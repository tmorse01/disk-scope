import type { Stats } from 'node:fs';
import fs from 'node:fs/promises';
import type { DirectoryNode, NodeId, ScanFileError } from '../shared/types';
import {
  CleanupCandidateCollector,
  parentHasDevProjectContext,
  parentHasDotNetProject,
} from './cleanup-rules';
import { baseName, fileExtension, normalizePath, pathToNodeId } from './path-utils';
import {
  buildExclusionConfig,
  isExcludedFolderEntryName,
  shouldExcludePath as matchesExclusion,
} from './exclusions';
import {
  DEFAULT_SCAN_ENGINE_TUNING,
  type DirectoryEntry,
  type DirectorySliceJob,
  type ExtensionAccumulator,
  type ReadDirFn,
  type ScanEngineTuning,
  type ScanPartialResult,
} from './scan-types';
import type { TopFileCandidate } from './top-files-tracker';

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

export function inodeKey(stat: Stats, fallbackPath: string): string {
  if (Number(stat.ino) === 0) {
    return normalizePath(fallbackPath);
  }
  return `${stat.dev}:${stat.ino}`;
}

export type ProcessDirectorySliceOptions = {
  job: DirectorySliceJob;
  readDirectory: ReadDirFn;
  exclusions: import('../shared/types').ScanExclusion[];
  developerCleanupEnabled?: boolean;
  tuning?: Partial<ScanEngineTuning>;
  shouldCancel?: () => boolean;
  /** Pre-populated parent node when child was stubbed by another worker. */
  existingDirectoriesById?: Record<NodeId, DirectoryNode>;
};

function resolveTuning(partial?: Partial<ScanEngineTuning>): ScanEngineTuning {
  return { ...DEFAULT_SCAN_ENGINE_TUNING, ...partial };
}

export async function processDirectorySlice(
  options: ProcessDirectorySliceOptions,
): Promise<ScanPartialResult> {
  const tuning = resolveTuning(options.tuning);
  const exclusionConfig = buildExclusionConfig(options.exclusions);
  const directoriesById: Record<NodeId, DirectoryNode> = {
    ...options.existingDirectoriesById,
  };
  const errors: ScanFileError[] = [];
  const extensionTotals = new Map<string | null, ExtensionAccumulator>();
  const largestFileCandidates: TopFileCandidate[] = [];
  const cleanupMatches = new Map<string, import('./cleanup-rules').CleanupRuleMatch>();
  const cleanupCollector = new CleanupCandidateCollector({
    developerCleanupEnabled: options.developerCleanupEnabled === true,
  });
  const childDirs: ScanPartialResult['childDirs'] = [];

  let fileCount = 0;
  let directoryCount = 0;
  let bytesDiscovered = 0;
  let errorCount = 0;
  let currentPath = options.job.dirPath;

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
    parentNode.sizeBytes += sizeBytes;
    fileCount += 1;
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

    largestFileCandidates.push({
      path: filePath,
      name: baseName(filePath),
      extension,
      sizeBytes,
      mtimeMs,
    });
  };

  const dirPath = normalizePath(options.job.dirPath);
  const nodeId = options.job.nodeId;
  const parentId = options.job.parentId;

  if (options.job.parentId === null) {
    const { created } = ensureDirectoryNode(dirPath, null);
    if (created) {
      directoryCount += 1;
    }
  } else {
    ensureDirectoryNode(dirPath, parentId);
  }

  const currentNode = directoriesById[nodeId];
  if (!currentNode) {
    return {
      directoriesById,
      fileCount,
      directoryCount,
      bytesDiscovered,
      errorCount,
      largestFileCandidates,
      extensionTotals,
      cleanupMatches,
      errors,
      childDirs,
      currentPath,
    };
  }

  if (matchesExclusion(dirPath, exclusionConfig)) {
    return {
      directoriesById,
      fileCount,
      directoryCount,
      bytesDiscovered,
      errorCount,
      largestFileCandidates,
      extensionTotals,
      cleanupMatches,
      errors,
      childDirs,
      currentPath,
    };
  }

  try {
    const dirStat = await fs.lstat(dirPath);
    if (!dirStat.isDirectory()) {
      return {
        directoriesById,
        fileCount,
        directoryCount,
        bytesDiscovered,
        errorCount,
        largestFileCandidates,
        extensionTotals,
        cleanupMatches,
        errors,
        childDirs,
        currentPath,
      };
    }
  } catch (error) {
    recordError(dirPath, 'stat', error);
    currentNode.unreadable = true;
    currentNode.errorCode = toErrorCode(error);
    return {
      directoriesById,
      fileCount,
      directoryCount,
      bytesDiscovered,
      errorCount,
      largestFileCandidates,
      extensionTotals,
      cleanupMatches,
      errors,
      childDirs,
      currentPath,
    };
  }

  let directoryEntries: DirectoryEntry[];
  try {
    directoryEntries = await options.readDirectory(dirPath);
  } catch (error) {
    recordError(dirPath, 'read-dir', error);
    currentNode.unreadable = true;
    currentNode.errorCode = toErrorCode(error);
    return {
      directoriesById,
      fileCount,
      directoryCount,
      bytesDiscovered,
      errorCount,
      largestFileCandidates,
      extensionTotals,
      cleanupMatches,
      errors,
      childDirs,
      currentPath,
    };
  }

  const siblingFileNames = directoryEntries
    .filter((entry) => !entry.isDirectory && !entry.isSymlink)
    .map((entry) => entry.name);
  const siblingDirNames = directoryEntries
    .filter((entry) => entry.isDirectory && !entry.isSymlink)
    .map((entry) => entry.name);
  const dotNetProjectContext = parentHasDotNetProject(siblingFileNames);
  const devProjectContext = parentHasDevProjectContext(siblingFileNames, siblingDirNames);

  for (const entry of directoryEntries) {
    if (options.shouldCancel?.()) {
      break;
    }

    const entryPath = entry.path;
    currentPath = entryPath;

    if (matchesExclusion(entryPath, exclusionConfig)) {
      continue;
    }

    if (entry.isSymlink) {
      continue;
    }

    if (entry.isDirectory) {
      if (tuning.exclusionShortCircuit && isExcludedFolderEntryName(entry.name, exclusionConfig)) {
        continue;
      }

      cleanupCollector.tryRegister(
        entry.name,
        entryPath,
        currentNode.name,
        devProjectContext,
        dotNetProjectContext,
      );
      const { node: childNode, created } = ensureDirectoryNode(entryPath, currentNode.id);
      if (created) {
        directoryCount += 1;
      }

      let childInodeKey = entryPath;
      try {
        const childStat = await fs.lstat(entryPath);
        childInodeKey = inodeKey(childStat, entryPath);
      } catch {
        childInodeKey = entryPath;
      }

      childDirs.push({
        dirPath: entryPath,
        parentId: childNode.id,
        inodeKey: childInodeKey,
      });
      continue;
    }

    trackFile(entryPath, entry.sizeBytes, currentNode.id, entry.mtimeMs);
  }

  for (const [folderPath, match] of cleanupCollector.exportMatches()) {
    cleanupMatches.set(folderPath, match);
  }

  return {
    directoriesById,
    fileCount,
    directoryCount,
    bytesDiscovered,
    errorCount,
    largestFileCandidates,
    extensionTotals,
    cleanupMatches,
    errors,
    childDirs,
    currentPath,
  };
}
