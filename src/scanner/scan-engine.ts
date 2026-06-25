import type { Dirent, Stats } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type {
  DirectoryNode,
  ExtensionSummary,
  NodeId,
  ScanFileError,
  ScanResult,
} from '../shared/types';
import { CleanupCandidateCollector, parentHasDotNetProject } from './cleanup-rules';
import { baseName, fileExtension, normalizePath, parentPath, pathToNodeId } from './path-utils';
import {
  buildExclusionConfig,
  isExcludedFolderEntryName,
  shouldExcludePath as matchesExclusion,
} from './exclusions';
import {
  DEFAULT_PROGRESS_INTERVAL_MS,
  DEFAULT_SCAN_ENGINE_TUNING,
  DEFAULT_TOP_FILES_LIMIT,
  type ScanEngineOptions,
  type ScanEngineRunResult,
  type ScanEngineTuning,
} from './scan-types';
import { createTopFilesTracker, type TopFilesTrackerLike } from './top-files-tracker';

type DirectoryWorkItem =
  | { phase: 'enter'; dirPath: string; nodeId: NodeId }
  | { phase: 'exit'; nodeId: NodeId };

type ExtensionAccumulator = {
  extension: string | null;
  sizeBytes: number;
  fileCount: number;
};

const PROGRESS_FILE_BATCH = 64;

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

function inodeKey(stat: Stats, fallbackPath: string): string {
  if (Number(stat.ino) === 0) {
    return normalizePath(fallbackPath);
  }
  return `${stat.dev}:${stat.ino}`;
}

function buildExtensionSummaries(
  extensionTotals: Map<string | null, ExtensionAccumulator>,
): ExtensionSummary[] {
  return [...extensionTotals.values()].sort((left, right) => right.sizeBytes - left.sizeBytes);
}

function isDefinitiveSymlink(entry: Dirent): boolean {
  return entry.isSymbolicLink();
}

function isDefinitiveDirectory(entry: Dirent): boolean {
  return entry.isDirectory();
}

function isDefinitiveFile(entry: Dirent): boolean {
  return entry.isFile();
}

function resolveTuning(partial?: Partial<ScanEngineTuning>): ScanEngineTuning {
  return { ...DEFAULT_SCAN_ENGINE_TUNING, ...partial };
}

export async function runScan(options: ScanEngineOptions): Promise<ScanEngineRunResult> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const progressIntervalMs = options.progressIntervalMs ?? DEFAULT_PROGRESS_INTERVAL_MS;
  const topFilesLimit = options.topFilesLimit ?? DEFAULT_TOP_FILES_LIMIT;
  const tuning = resolveTuning(options.tuning);

  const rootPath = normalizePath(options.rootPath);
  const rootNodeId = pathToNodeId(rootPath);
  const exclusionConfig = buildExclusionConfig(options.exclusions ?? []);
  const directoriesById: Record<NodeId, DirectoryNode> = {};
  const errors: ScanFileError[] = [];
  const visitedInodes = new Set<string>();
  const extensionTotals = new Map<string | null, ExtensionAccumulator>();
  const topFiles: TopFilesTrackerLike = createTopFilesTracker(
    topFilesLimit,
    tuning.minHeapTopFiles,
  );
  const cleanupCollector = new CleanupCandidateCollector();

  let totalFileCount = 0;
  let totalDirectoryCount = 0;
  let errorCount = 0;
  let bytesDiscovered = 0;
  let currentPath = rootPath;
  let lastProgressAt = 0;
  let filesSinceProgress = 0;
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
    filesSinceProgress = 0;
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

  const progressFileBatch =
    progressIntervalMs === 0 ? 1 : tuning.batchedProgress ? PROGRESS_FILE_BATCH : 1;

  const maybeEmitProgressAfterFile = (): void => {
    filesSinceProgress += 1;
    if (filesSinceProgress >= progressFileBatch) {
      emitProgress();
    }
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

  const bubbleDirectorySizeToParent = (nodeId: NodeId): void => {
    if (!tuning.postOrderRollup) {
      return;
    }

    const node = directoriesById[nodeId];
    if (!node?.parentId) {
      return;
    }

    const parent = directoriesById[node.parentId];
    if (parent) {
      parent.sizeBytes += node.sizeBytes;
    }
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
    mtimeMs?: number,
  ): void => {
    const parentNode = directoriesById[parentId];
    if (!parentNode) {
      return;
    }

    parentNode.fileCount += 1;
    if (tuning.postOrderRollup) {
      parentNode.sizeBytes += sizeBytes;
    } else {
      addFileSizeToAncestors(parentId, sizeBytes);
    }
    totalFileCount += 1;
    bytesDiscovered += sizeBytes;

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
      mtimeMs: tuning.deferMtimeFormatting ? mtimeMs : mtimeMs,
    });

    maybeEmitProgressAfterFile();
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

  const stack: DirectoryWorkItem[] = [{ phase: 'enter', dirPath: rootPath, nodeId: rootNodeId }];
  emitProgress(true);

  while (stack.length > 0) {
    if (shouldCancel()) {
      break;
    }

    const current = stack.pop();
    if (!current) {
      continue;
    }

    if (current.phase === 'exit') {
      bubbleDirectorySizeToParent(current.nodeId);
      emitProgress();
      continue;
    }

    currentPath = current.dirPath;
    const currentNode = directoriesById[current.nodeId];
    if (!currentNode) {
      continue;
    }

    if (matchesExclusion(current.dirPath, exclusionConfig)) {
      continue;
    }

    if (tuning.inodeLoopDetection) {
      let dirStat: Stats;
      try {
        dirStat = await fs.lstat(current.dirPath);
      } catch (error) {
        recordError(current.dirPath, 'stat', error);
        currentNode.unreadable = true;
        currentNode.errorCode = toErrorCode(error);
        emitProgress();
        continue;
      }

      if (!dirStat.isDirectory()) {
        continue;
      }

      const currentInode = inodeKey(dirStat, current.dirPath);
      if (visitedInodes.has(currentInode)) {
        continue;
      }
      visitedInodes.add(currentInode);
    } else {
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

      if (visitedInodes.has(realPath)) {
        continue;
      }
      visitedInodes.add(realPath);
    }

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

    if (tuning.postOrderRollup) {
      stack.push({ phase: 'exit', nodeId: current.nodeId });
    }

    const siblingFileNames = entries.filter((entry) => entry.isFile()).map((entry) => entry.name);
    const dotNetProjectContext = parentHasDotNetProject(siblingFileNames);

    const processEntry = async (entry: Dirent): Promise<void> => {
      const entryPath = path.join(current.dirPath, entry.name);
      currentPath = entryPath;

      if (matchesExclusion(entryPath, exclusionConfig)) {
        return;
      }

      const handleStat = async (entryStat: Stats): Promise<void> => {
        if (entryStat.isSymbolicLink()) {
          return;
        }
        if (entryStat.isDirectory()) {
          if (tuning.exclusionShortCircuit && isExcludedFolderEntryName(entry.name, exclusionConfig)) {
            return;
          }

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
          stack.push({ phase: 'enter', dirPath: entryPath, nodeId: childNode.id });
          return;
        }
        if (entryStat.isFile()) {
          trackFile(entryPath, entryStat.size, current.nodeId, entryStat.mtimeMs);
        }
      };

      if (tuning.skipRedundantLstat) {
        if (isDefinitiveSymlink(entry)) {
          return;
        }

        if (isDefinitiveDirectory(entry)) {
          if (tuning.exclusionShortCircuit && isExcludedFolderEntryName(entry.name, exclusionConfig)) {
            return;
          }

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
          stack.push({ phase: 'enter', dirPath: entryPath, nodeId: childNode.id });
          return;
        }

        if (isDefinitiveFile(entry)) {
          try {
            const entryStat = await fs.lstat(entryPath);
            if (entryStat.isSymbolicLink() || !entryStat.isFile()) {
              return;
            }
            trackFile(entryPath, entryStat.size, current.nodeId, entryStat.mtimeMs);
          } catch (error) {
            recordError(entryPath, 'stat', error);
            emitProgress();
          }
          return;
        }
      }

      try {
        const entryStat = await fs.lstat(entryPath);
        await handleStat(entryStat);
      } catch (error) {
        recordError(entryPath, 'stat', error);
        emitProgress();
      }
    };

    for (let index = entries.length - 1; index >= 0; index -= 1) {
      if (shouldCancel()) {
        break;
      }

      await processEntry(entries[index]);
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
