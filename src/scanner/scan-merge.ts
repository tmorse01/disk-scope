import type {
  DirectoryNode,
  ExtensionSummary,
  NodeId,
  ScanFileError,
  ScanResult,
  ScanSessionId,
} from '../shared/types';
import { finalizeCleanupMatches } from './cleanup-rules';
import { normalizePath } from './path-utils';
import { computeScanDurationMs } from '../shared/scan-duration';
import type { ExtensionAccumulator, ScanPartialResult } from './scan-types';
import { DEFAULT_TOP_FILES_LIMIT } from './scan-types';
import { createTopFilesTracker, type TopFileCandidate } from './top-files-tracker';

function pathDepth(dirPath: string): number {
  const normalized = normalizePath(dirPath);
  if (normalized === normalizePath('/')) {
    return 0;
  }
  return normalized.split(/[/\\]/).filter(Boolean).length;
}

export function rollupDirectorySizes(directoriesById: Record<NodeId, DirectoryNode>): void {
  const nodes = Object.values(directoriesById);
  nodes.sort((left, right) => pathDepth(right.path) - pathDepth(left.path));

  for (const node of nodes) {
    if (!node.parentId) {
      continue;
    }
    const parent = directoriesById[node.parentId];
    if (parent) {
      parent.sizeBytes += node.sizeBytes;
    }
  }
}

function mergeExtensionMaps(
  target: Map<string | null, ExtensionAccumulator>,
  source: Map<string | null, ExtensionAccumulator>,
): void {
  for (const [extension, entry] of source) {
    const existing = target.get(extension) ?? {
      extension,
      sizeBytes: 0,
      fileCount: 0,
    };
    existing.sizeBytes += entry.sizeBytes;
    existing.fileCount += entry.fileCount;
    target.set(extension, existing);
  }
}

function buildExtensionSummaries(
  extensionTotals: Map<string | null, ExtensionAccumulator>,
): ExtensionSummary[] {
  return [...extensionTotals.values()].sort((left, right) => right.sizeBytes - left.sizeBytes);
}

function mergeDirectoryMaps(
  target: Record<NodeId, DirectoryNode>,
  source: Record<NodeId, DirectoryNode>,
): void {
  for (const [nodeId, node] of Object.entries(source)) {
    const existing = target[nodeId];
    if (!existing) {
      target[nodeId] = { ...node, childDirectoryIds: [...node.childDirectoryIds] };
      continue;
    }

    existing.fileCount += node.fileCount;
    existing.sizeBytes += node.sizeBytes;
    existing.directoryCount += node.directoryCount;
    existing.unreadable = existing.unreadable || node.unreadable;
    if (node.errorCode && !existing.errorCode) {
      existing.errorCode = node.errorCode;
    }

    for (const childId of node.childDirectoryIds) {
      if (!existing.childDirectoryIds.includes(childId)) {
        existing.childDirectoryIds.push(childId);
      }
    }
  }
}

function mergeTopFiles(
  candidates: TopFileCandidate[],
  limit: number,
): ReturnType<ReturnType<typeof createTopFilesTracker>['toArray']> {
  const tracker = createTopFilesTracker(limit, true);
  for (const candidate of candidates) {
    tracker.add(candidate);
  }
  return tracker.toArray();
}

export type MergeScanPartialsOptions = {
  scanId: ScanSessionId;
  rootPath: string;
  rootNodeId: NodeId;
  startedAt: string;
  topFilesLimit?: number;
};

export function mergeScanPartials(
  partials: ScanPartialResult[],
  options: MergeScanPartialsOptions,
): ScanResult {
  const topFilesLimit = options.topFilesLimit ?? DEFAULT_TOP_FILES_LIMIT;
  const directoriesById: Record<NodeId, DirectoryNode> = {};
  const extensionTotals = new Map<string | null, ExtensionAccumulator>();
  const cleanupMatches = new Map<string, import('./cleanup-rules').CleanupRuleMatch>();
  const errors: ScanFileError[] = [];
  const allFileCandidates: TopFileCandidate[] = [];

  let fileCount = 0;
  let directoryCount = 0;
  let errorCount = 0;

  for (const partial of partials) {
    mergeDirectoryMaps(directoriesById, partial.directoriesById);
    mergeExtensionMaps(extensionTotals, partial.extensionTotals);
    fileCount += partial.fileCount;
    directoryCount += partial.directoryCount;
    errorCount += partial.errorCount;
    errors.push(...partial.errors);
    allFileCandidates.push(...partial.largestFileCandidates);

    for (const [folderPath, match] of partial.cleanupMatches) {
      cleanupMatches.set(folderPath, match);
    }
  }

  rollupDirectorySizes(directoriesById);

  const rootNode = directoriesById[options.rootNodeId];

  errors.sort((left, right) => left.path.localeCompare(right.path));

  const completedAt = new Date().toISOString();
  const durationMs = computeScanDurationMs({ startedAt: options.startedAt, completedAt });

  return {
    scanId: options.scanId,
    rootPath: normalizePath(options.rootPath),
    startedAt: options.startedAt,
    completedAt,
    durationMs,
    totalSizeBytes: rootNode?.sizeBytes ?? 0,
    fileCount,
    directoryCount,
    errorCount,
    rootNodeId: options.rootNodeId,
    directoriesById,
    largestFiles: mergeTopFiles(allFileCandidates, topFilesLimit),
    extensionSummaries: buildExtensionSummaries(extensionTotals),
    cleanupCandidates: finalizeCleanupMatches(cleanupMatches, directoriesById),
    errors,
  };
}
