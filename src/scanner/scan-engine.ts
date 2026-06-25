import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  DirectoryNode,
  ExtensionSummary,
  LargestFileEntry,
  NodeId,
  ScanFileError,
  ScanResult,
} from '../shared/types';
import { CleanupCandidateCollector, parentHasDotNetProject } from './cleanup-rules';
import { baseName, fileExtension, normalizePath, parentPath, pathToNodeId } from './path-utils';
import {
  DEFAULT_PROGRESS_INTERVAL_MS,
  DEFAULT_TOP_FILES_LIMIT,
  type ScanEngineOptions,
  type ScanEngineRunResult,
} from './scan-types';

type DirectoryWorkItem = {
  dirPath: string;
  nodeId: NodeId;
};

type ExtensionAccumulator = {
  extension: string | null;
  sizeBytes: number;
  fileCount: number;
};

/**
 * Task 010 will replace this stub with persisted exclusion patterns.
 */
export function shouldExcludePath(_targetPath: string): boolean {
  return false;
}

class TopFilesTracker {
  private readonly entries: LargestFileEntry[] = [];

  constructor(private readonly limit: number) {}

  add(entry: LargestFileEntry): void {
    if (this.entries.length < this.limit) {
      this.insertSorted(entry);
      return;
    }

    const smallest = this.entries[this.entries.length - 1];
    if (entry.sizeBytes <= smallest.sizeBytes) {
      return;
    }

    this.entries.pop();
    this.insertSorted(entry);
  }

  toArray(): LargestFileEntry[] {
    return [...this.entries];
  }

  private insertSorted(entry: LargestFileEntry): void {
    let insertAt = this.entries.findIndex((existing) => entry.sizeBytes > existing.sizeBytes);
    if (insertAt === -1) {
      insertAt = this.entries.length;
    }
    this.entries.splice(insertAt, 0, entry);
  }
}

function toErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code?: unknown }).code;
    if (typeof code === 'string') {
      return code;
    }
  }
  return 'UNKNOWN';
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function buildExtensionSummaries(
  extensionTotals: Map<string | null, ExtensionAccumulator>,
): ExtensionSummary[] {
  return [...extensionTotals.values()].sort((left, right) => right.sizeBytes - left.sizeBytes);
}

export async function runScan(options: ScanEngineOptions): Promise<ScanEngineRunResult> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const progressIntervalMs = options.progressIntervalMs ?? DEFAULT_PROGRESS_INTERVAL_MS;
  const topFilesLimit = options.topFilesLimit ?? DEFAULT_TOP_FILES_LIMIT;

  const rootPath = normalizePath(options.rootPath);
  const rootNodeId = pathToNodeId(rootPath);
  const directoriesById: Record<NodeId, DirectoryNode> = {};
  const errors: ScanFileError[] = [];
  const visitedRealPaths = new Set<string>();
  const extensionTotals = new Map<string | null, ExtensionAccumulator>();
  const topFiles = new TopFilesTracker(topFilesLimit);
  const cleanupCollector = new CleanupCandidateCollector();

  let totalFileCount = 0;
  let totalDirectoryCount = 0;
  let errorCount = 0;
  let bytesDiscovered = 0;
  let currentPath = rootPath;
  let lastProgressAt = 0;
  let cancelled = false;

  const emitProgress = (force = false): void => {
    if (!options.onProgress) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastProgressAt < progressIntervalMs) {
      return;
    }

    lastProgressAt = now;
    options.onProgress({
      scanId: options.scanId,
      filesScanned: totalFileCount,
      directoriesScanned: totalDirectoryCount,
      bytesDiscovered,
      currentPath,
      errorCount,
      elapsedMs: now - startMs,
    });
  };

  const recordError = (
    targetPath: string,
    operation: ScanFileError['operation'],
    error: unknown,
  ): void => {
    errorCount += 1;
    errors.push({
      path: targetPath,
      operation,
      code: toErrorCode(error),
      message: toErrorMessage(error),
    });
  };

  const ensureDirectoryNode = (
    dirPath: string,
    parentId: NodeId | null,
    unreadable = false,
    errorCode?: string,
  ): { node: DirectoryNode; created: boolean } => {
    const normalized = normalizePath(dirPath);
    const nodeId = pathToNodeId(normalized);
    const existing = directoriesById[nodeId];
    if (existing) {
      return { node: existing, created: false };
    }

    const node: DirectoryNode = {
      id: nodeId,
      parentId,
      name: baseName(normalized),
      path: normalized,
      sizeBytes: 0,
      fileCount: 0,
      directoryCount: 0,
      childDirectoryIds: [],
      unreadable,
      errorCode,
    };
    directoriesById[nodeId] = node;

    if (parentId) {
      const parent = directoriesById[parentId];
      if (parent && !parent.childDirectoryIds.includes(nodeId)) {
        parent.childDirectoryIds.push(nodeId);
        parent.directoryCount += 1;
      }
    }

    return { node, created: true };
  };

  const addFileSizeToAncestors = (dirId: NodeId, sizeBytes: number): void => {
    let currentId: NodeId | null = dirId;
    while (currentId) {
      const node: DirectoryNode | undefined = directoriesById[currentId];
      if (!node) {
        break;
      }
      node.sizeBytes += sizeBytes;
      currentId = node.parentId;
    }
  };

  const trackFile = (
    filePath: string,
    sizeBytes: number,
    parentId: NodeId,
    modifiedAt?: string,
  ): void => {
    const parentNode = directoriesById[parentId];
    if (!parentNode) {
      return;
    }

    parentNode.fileCount += 1;
    totalFileCount += 1;
    bytesDiscovered += sizeBytes;
    addFileSizeToAncestors(parentId, sizeBytes);

    const extension = fileExtension(filePath);
    const extensionEntry = extensionTotals.get(extension) ?? {
      extension,
      sizeBytes: 0,
      fileCount: 0,
    };
    extensionEntry.sizeBytes += sizeBytes;
    extensionEntry.fileCount += 1;
    extensionTotals.set(extension, extensionEntry);

    topFiles.add({
      path: filePath,
      name: baseName(filePath),
      extension,
      sizeBytes,
      modifiedAt,
    });
  };

  const shouldCancel = (): boolean => {
    if (options.shouldCancel?.()) {
      cancelled = true;
      return true;
    }
    return false;
  };

  ensureDirectoryNode(rootPath, null);
  totalDirectoryCount = 1;

  const stack: DirectoryWorkItem[] = [{ dirPath: rootPath, nodeId: rootNodeId }];
  emitProgress(true);

  while (stack.length > 0) {
    if (shouldCancel()) {
      break;
    }

    const current = stack.pop();
    if (!current) {
      continue;
    }

    currentPath = current.dirPath;
    const currentNode = directoriesById[current.nodeId];
    if (!currentNode) {
      continue;
    }

    if (shouldExcludePath(current.dirPath)) {
      continue;
    }

    let realPath = current.dirPath;
    try {
      realPath = await fs.realpath(current.dirPath);
    } catch (error) {
      recordError(current.dirPath, 'stat', error);
      currentNode.unreadable = true;
      currentNode.errorCode = toErrorCode(error);
      emitProgress();
      continue;
    }

    if (visitedRealPaths.has(realPath)) {
      continue;
    }
    visitedRealPaths.add(realPath);

    let entries: Dirent[];
    try {
      entries = await fs.readdir(current.dirPath, { withFileTypes: true });
    } catch (error) {
      recordError(current.dirPath, 'read-dir', error);
      currentNode.unreadable = true;
      currentNode.errorCode = toErrorCode(error);
      emitProgress();
      continue;
    }

    const siblingFileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    const dotNetProjectContext = parentHasDotNetProject(siblingFileNames);

    for (const entry of entries) {
      if (shouldCancel()) {
        break;
      }

      const entryPath = path.join(current.dirPath, entry.name);
      currentPath = entryPath;

      if (shouldExcludePath(entryPath)) {
        continue;
      }

      try {
        const entryStat = await fs.lstat(entryPath);

        if (entryStat.isSymbolicLink()) {
          continue;
        }

        if (entryStat.isDirectory()) {
          cleanupCollector.tryRegister(
            entry.name,
            entryPath,
            currentNode.name,
            dotNetProjectContext,
          );
          const { node: childNode, created } = ensureDirectoryNode(entryPath, current.nodeId);
          if (created) {
            totalDirectoryCount += 1;
          }
          stack.push({ dirPath: entryPath, nodeId: childNode.id });
          continue;
        }

        if (entryStat.isFile()) {
          const modifiedAt = entryStat.mtime.toISOString();
          trackFile(entryPath, entryStat.size, current.nodeId, modifiedAt);
          emitProgress();
        }
      } catch (error) {
        recordError(entryPath, 'stat', error);
        emitProgress();
      }
    }
  }

  emitProgress(true);

  const rootNode = directoriesById[rootNodeId];
  const completedAt = new Date().toISOString();

  const result: ScanResult = {
    scanId: options.scanId,
    rootPath,
    startedAt,
    completedAt,
    totalSizeBytes: rootNode?.sizeBytes ?? 0,
    fileCount: totalFileCount,
    directoryCount: totalDirectoryCount,
    errorCount,
    rootNodeId,
    directoriesById,
    largestFiles: topFiles.toArray(),
    extensionSummaries: buildExtensionSummaries(extensionTotals),
    cleanupCandidates: cleanupCollector.finalize(directoriesById),
    errors,
  };

  return { result, cancelled };
}

export function resolveParentNodeId(dirPath: string): NodeId | null {
  const parent = parentPath(normalizePath(dirPath));
  if (!parent) {
    return null;
  }
  return pathToNodeId(parent);
}
