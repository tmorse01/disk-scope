import type {
  DirectoryNode,
  ExportFormat,
  NodeId,
  ScanProgressEvent,
  ScanResult,
  ScanSessionId,
  ScanStatus,
  SelectedPath,
} from '../../shared/types';
import { computeScanDurationMs } from '../../shared/scan-duration';
import type { DeleteTarget } from '../features/file-actions/delete-target';
import { preferencesStore } from './preferences-store';

export type ScanProgressSnapshot = {
  filesScanned: number;
  directoriesScanned: number;
  bytesDiscovered: number;
  currentPath: string;
  errorCount: number;
  elapsedMs: number;
};

export type OverviewMode = 'picker' | 'summary';

export type ScanHistoryEntry = {
  scanId: ScanSessionId;
  result: ScanResult;
  status: 'completed' | 'cancelled';
  developerCleanupEnabledAtScan: boolean;
  rootPathMissing?: boolean;
};

const MAX_SCAN_HISTORY = 10;

/**
 * In-memory scan session state for the renderer.
 */
export type ScanStoreState = {
  status: ScanStatus;
  selectedPaths: string[];
  pickerError: string | null;
  scanId: ScanSessionId | null;
  scanError: string | null;
  cacheWarning: string | null;
  useFilesystemCache: boolean;
  progress: ScanProgressSnapshot | null;
  result: ScanResult | null;
  /** Whether developer cleanup was enabled when the current result was scanned. */
  developerCleanupEnabledAtScan: boolean | null;
  /** Overview shows folder picker or the active scan summary. */
  overviewMode: OverviewMode;
  /** Session scan history, newest first. */
  scanHistory: ScanHistoryEntry[];
  /** True when the active scan target path no longer exists on disk. */
  scanTargetMissing: boolean;
  /** Last selected paths restored from disk (for picker pre-fill). */
  lastSelectedPaths: string[];
};

export const scanStore: ScanStoreState = {
  status: 'idle',
  selectedPaths: [],
  pickerError: null,
  scanId: null,
  scanError: null,
  cacheWarning: null,
  useFilesystemCache: true,
  progress: null,
  result: null,
  developerCleanupEnabledAtScan: null,
  overviewMode: 'picker',
  scanHistory: [],
  scanTargetMissing: false,
  lastSelectedPaths: [],
};

export function getPrimarySelectedPath(): string | null {
  return scanStore.selectedPaths[0] ?? null;
}

type ScanStoreListener = (state: ScanStoreState) => void;

const listeners = new Set<ScanStoreListener>();

let storeVersion = 0;
let listenersInitialized = false;
let historyHydrated = false;
let cancelRequestedByUser = false;

const PROGRESS_NOTIFY_MS = 150;
let pendingProgress: ScanProgressEvent | null = null;
let progressNotifyTimer: ReturnType<typeof setTimeout> | null = null;

export function getScanStoreVersion(): number {
  return storeVersion;
}

export function subscribeScanStore(listener: ScanStoreListener): () => void {
  listeners.add(listener);
  listener(scanStore);

  return () => {
    listeners.delete(listener);
  };
}

function notifyScanStore(): void {
  storeVersion += 1;
  for (const listener of listeners) {
    listener(scanStore);
  }
}

function clearProgressNotifyTimer(): void {
  if (progressNotifyTimer !== null) {
    clearTimeout(progressNotifyTimer);
    progressNotifyTimer = null;
  }
}

function applyProgressSnapshot(event: ScanProgressEvent): void {
  scanStore.progress = {
    filesScanned: event.filesScanned,
    directoriesScanned: event.directoriesScanned,
    bytesDiscovered: event.bytesDiscovered,
    currentPath: event.currentPath,
    errorCount: event.errorCount,
    elapsedMs: event.elapsedMs,
  };
}

function flushPendingProgress(): void {
  progressNotifyTimer = null;
  if (!pendingProgress) {
    return;
  }

  applyProgressSnapshot(pendingProgress);
  pendingProgress = null;
  notifyScanStore();
}

function scheduleProgressNotify(event: ScanProgressEvent): void {
  pendingProgress = event;

  if (progressNotifyTimer !== null) {
    return;
  }

  progressNotifyTimer = setTimeout(flushPendingProgress, PROGRESS_NOTIFY_MS);
}

function progressSnapshotFromResult(result: ScanResult): ScanProgressSnapshot {
  return {
    filesScanned: result.fileCount,
    directoriesScanned: result.directoryCount,
    bytesDiscovered: result.totalSizeBytes,
    currentPath: result.rootPath,
    errorCount: result.errorCount,
    elapsedMs: computeScanDurationMs(result),
  };
}

function upsertScanHistory(entry: ScanHistoryEntry): void {
  scanStore.scanHistory = [
    entry,
    ...scanStore.scanHistory.filter((existing) => existing.scanId !== entry.scanId),
  ].slice(0, MAX_SCAN_HISTORY);
}

function persistLastSelectedPaths(): void {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  void window.diskScope.saveLastSelectedPaths(scanStore.selectedPaths);
}

function applyMostRecentCompletedScan(): void {
  const mostRecentCompleted = scanStore.scanHistory.find((entry) => entry.status === 'completed');
  if (!mostRecentCompleted) {
    return;
  }

  scanStore.scanId = mostRecentCompleted.scanId;
  scanStore.result = mostRecentCompleted.result;
  scanStore.status = mostRecentCompleted.status;
  scanStore.developerCleanupEnabledAtScan = mostRecentCompleted.developerCleanupEnabledAtScan;
  scanStore.progress = progressSnapshotFromResult(mostRecentCompleted.result);
  scanStore.scanTargetMissing = mostRecentCompleted.rootPathMissing ?? false;
  scanStore.overviewMode = 'summary';
}

export async function hydrateScanHistoryFromMain(): Promise<void> {
  if (historyHydrated || typeof window.diskScope === 'undefined') {
    return;
  }

  historyHydrated = true;

  try {
    const payload = await window.diskScope.getScanHistory();
    scanStore.scanHistory = payload.entries.map((entry) => ({
      scanId: entry.scanId,
      result: entry.result,
      status: entry.status,
      developerCleanupEnabledAtScan: entry.developerCleanupEnabledAtScan,
      rootPathMissing: entry.rootPathMissing,
    }));
    scanStore.lastSelectedPaths = payload.lastSelectedPaths;

    if (scanStore.status === 'idle' && scanStore.selectedPaths.length === 0 && payload.lastSelectedPaths.length > 0) {
      scanStore.selectedPaths = [...payload.lastSelectedPaths];
    }

    if (!scanStore.result && scanStore.scanHistory.length > 0) {
      applyMostRecentCompletedScan();
    }

    notifyScanStore();
  } catch (error) {
    console.warn('[scan-store] Failed to hydrate scan history:', error);
  }
}

function handleScanProgress(event: ScanProgressEvent): void {
  if (scanStore.scanId !== event.scanId || scanStore.status !== 'scanning') {
    return;
  }

  scheduleProgressNotify(event);
}

function handleScanComplete(event: { scanId: ScanSessionId; result: ScanResult }): void {
  if (scanStore.scanId !== event.scanId) {
    return;
  }

  clearProgressNotifyTimer();
  pendingProgress = null;
  const finalStatus = cancelRequestedByUser ? 'cancelled' : 'completed';
  scanStore.result = event.result;
  scanStore.progress = progressSnapshotFromResult(event.result);
  scanStore.status = finalStatus;
  scanStore.scanTargetMissing = false;
  upsertScanHistory({
    scanId: event.scanId,
    result: event.result,
    status: finalStatus,
    developerCleanupEnabledAtScan: scanStore.developerCleanupEnabledAtScan ?? false,
  });
  scanStore.overviewMode = 'summary';
  cancelRequestedByUser = false;
  notifyScanStore();
}

function handleScanError(event: { scanId: ScanSessionId; message: string }): void {
  if (scanStore.scanId !== event.scanId) {
    return;
  }

  clearProgressNotifyTimer();
  pendingProgress = null;
  scanStore.scanError = event.message;
  scanStore.status = 'failed';
  cancelRequestedByUser = false;
  notifyScanStore();
}

export function initScanStoreListeners(): void {
  if (listenersInitialized || typeof window.diskScope === 'undefined') {
    return;
  }

  listenersInitialized = true;

  window.diskScope.onScanProgress(handleScanProgress);
  window.diskScope.onScanComplete(handleScanComplete);
  window.diskScope.onScanError(handleScanError);

  void hydrateScanHistoryFromMain();
}

export function showOverviewPicker(): void {
  scanStore.overviewMode = 'picker';
  if (
    scanStore.status === 'idle' &&
    scanStore.selectedPaths.length === 0 &&
    scanStore.lastSelectedPaths.length > 0
  ) {
    scanStore.selectedPaths = [...scanStore.lastSelectedPaths];
  }
  notifyScanStore();
}

export function showOverviewSummary(): void {
  if (!scanStore.result) {
    return;
  }
  scanStore.overviewMode = 'summary';
  notifyScanStore();
}

export function activateScanFromHistory(scanId: ScanSessionId): void {
  const entry = scanStore.scanHistory.find((candidate) => candidate.scanId === scanId);
  if (!entry) {
    return;
  }

  scanStore.scanId = entry.scanId;
  scanStore.result = entry.result;
  scanStore.status = entry.status;
  scanStore.developerCleanupEnabledAtScan = entry.developerCleanupEnabledAtScan;
  scanStore.progress = progressSnapshotFromResult(entry.result);
  scanStore.overviewMode = 'summary';
  scanStore.scanError = null;
  scanStore.scanTargetMissing = entry.rootPathMissing ?? false;
  notifyScanStore();
}

export function addSelectedPath(path: string): void {
  const normalized = path.trim();
  if (!normalized || scanStore.selectedPaths.includes(normalized)) {
    return;
  }
  scanStore.selectedPaths = [...scanStore.selectedPaths, normalized];
  scanStore.pickerError = null;
  notifyScanStore();
}

export function removeSelectedPath(path: string): void {
  scanStore.selectedPaths = scanStore.selectedPaths.filter((entry) => entry !== path);
  notifyScanStore();
}

export function setSelectedPath(selected: SelectedPath | null): void {
  if (selected?.path) {
    addSelectedPath(selected.path);
  } else {
    scanStore.pickerError = null;
    notifyScanStore();
  }
}

export function setUseFilesystemCache(value: boolean): void {
  scanStore.useFilesystemCache = value;
  notifyScanStore();
}

export function clearCacheWarning(): void {
  scanStore.cacheWarning = null;
  notifyScanStore();
}

export function clearPickerError(): void {
  scanStore.pickerError = null;
  notifyScanStore();
}

export async function pickScanTarget(): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    scanStore.pickerError = 'DiskScope API is not available yet.';
    notifyScanStore();
    return;
  }

  scanStore.status = 'selecting-target';
  scanStore.pickerError = null;
  notifyScanStore();

  try {
    const selected = await window.diskScope.selectDirectory();
    setSelectedPath(selected);
    scanStore.status = 'idle';
    notifyScanStore();
  } catch (error) {
    scanStore.pickerError =
      error instanceof Error ? error.message : 'Failed to open folder picker.';
    scanStore.status = 'idle';
    notifyScanStore();
  }
}

export async function startScanFromStore(): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    scanStore.scanError = 'DiskScope API is not available yet.';
    notifyScanStore();
    return;
  }

  if (scanStore.selectedPaths.length === 0) {
    scanStore.scanError = 'Select a folder before starting a scan.';
    notifyScanStore();
    return;
  }

  const rootPath = scanStore.selectedPaths[0];
  await beginScanForRootPath(rootPath);
}

export async function startScanForPath(rootPath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    scanStore.scanError = 'DiskScope API is not available yet.';
    notifyScanStore();
    return;
  }

  const normalized = rootPath.trim();
  if (!normalized) {
    scanStore.scanError = 'Select a folder before starting a scan.';
    notifyScanStore();
    return;
  }

  scanStore.selectedPaths = [normalized];
  scanStore.pickerError = null;
  await beginScanForRootPath(normalized);
}

async function beginScanForRootPath(rootPath: string): Promise<void> {
  if (scanStore.status === 'scanning') {
    return;
  }

  initScanStoreListeners();

  scanStore.scanError = null;
  scanStore.cacheWarning = null;
  scanStore.result = null;
  scanStore.progress = null;
  scanStore.overviewMode = 'picker';
  scanStore.developerCleanupEnabledAtScan = preferencesStore.developerCleanupEnabled;
  cancelRequestedByUser = false;
  clearProgressNotifyTimer();
  pendingProgress = null;
  scanStore.status = 'scanning';
  notifyScanStore();

  persistLastSelectedPaths();

  try {
    const response = await window.diskScope.startScan({
      rootPath,
      useFilesystemCache: scanStore.useFilesystemCache,
    });
    scanStore.scanId = response.scanId;
    scanStore.cacheWarning = response.cacheWarning ?? null;
    notifyScanStore();
  } catch (error) {
    scanStore.status = 'failed';
    scanStore.scanError =
      error instanceof Error ? error.message : 'Failed to start scan.';
    scanStore.scanId = null;
    notifyScanStore();
  }
}

export async function initE2eAutostartScan(): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  const config = await window.diskScope.getE2eAutostartConfig();
  if (!config?.rootPath) {
    return;
  }

  await startScanForPath(config.rootPath);
}

export async function cancelScanFromStore(): Promise<void> {
  if (typeof window.diskScope === 'undefined' || !scanStore.scanId || scanStore.status !== 'scanning') {
    return;
  }

  cancelRequestedByUser = true;

  try {
    await window.diskScope.cancelScan(scanStore.scanId);
  } catch (error) {
    scanStore.scanError =
      error instanceof Error ? error.message : 'Failed to cancel scan.';
    notifyScanStore();
  }
}

export async function exportReportFromStore(format: ExportFormat): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    scanStore.scanError = 'DiskScope API is not available yet.';
    notifyScanStore();
    return;
  }

  if (!scanStore.scanId || !scanStore.result) {
    scanStore.scanError = 'Complete a scan before exporting.';
    notifyScanStore();
    return;
  }

  if (scanStore.status !== 'completed' && scanStore.status !== 'cancelled') {
    scanStore.scanError = 'Export is available only after a scan finishes.';
    notifyScanStore();
    return;
  }

  try {
    await window.diskScope.exportReport(scanStore.scanId, { format });
    scanStore.scanError = null;
    notifyScanStore();
  } catch (error) {
    scanStore.scanError =
      error instanceof Error ? error.message : 'Failed to export report.';
    notifyScanStore();
  }
}

/** Test helper — apply a progress event without throttling. */
export function applyScanProgressForTest(event: ScanProgressEvent): void {
  if (scanStore.scanId !== event.scanId) {
    return;
  }

  applyProgressSnapshot(event);
  notifyScanStore();
}


function pathsEqual(a: string, b: string): boolean {
  return a.replace(/\/$/, '').toLowerCase() === b.replace(/\/$/, '').toLowerCase();
}

function isPathInsideDirectory(targetPath: string, directoryPath: string): boolean {
  const normalizedTarget = targetPath.replace(/\/$/, '');
  const normalizedDirectory = directoryPath.replace(/\/$/, '');
  if (!normalizedDirectory) {
    return false;
  }

  const prefix = normalizedDirectory.endsWith('\\')
    ? normalizedDirectory
    : `${normalizedDirectory}\\`;
  return normalizedTarget.toLowerCase().startsWith(prefix.toLowerCase());
}

function findDirectoryNodeIdByPath(result: ScanResult, targetPath: string): NodeId | null {
  for (const node of Object.values(result.directoriesById)) {
    if (pathsEqual(node.path, targetPath)) {
      return node.id;
    }
  }

  return null;
}

function collectSubtreeNodeIds(result: ScanResult, rootId: NodeId): NodeId[] {
  const collected: NodeId[] = [];
  const stack: NodeId[] = [rootId];

  while (stack.length > 0) {
    const nodeId = stack.pop();
    if (!nodeId) {
      continue;
    }

    collected.push(nodeId);
    const node = result.directoriesById[nodeId];
    if (!node) {
      continue;
    }

    for (const childId of node.childDirectoryIds) {
      stack.push(childId);
    }
  }

  return collected;
}

function subtractFileSizeFromAncestors(result: ScanResult, startNodeId: NodeId, sizeBytes: number): void {
  let currentId: NodeId | null = startNodeId;

  while (currentId) {
    const node: DirectoryNode | undefined = result.directoriesById[currentId];
    if (!node) {
      break;
    }

    node.sizeBytes = Math.max(0, node.sizeBytes - sizeBytes);
    currentId = node.parentId;
  }
}

function parentDirectoryPath(filePath: string): string | null {
  const normalized = filePath.replace(/\/$/, '');
  const index = Math.max(normalized.lastIndexOf('\\'), normalized.lastIndexOf('/'));
  if (index <= 0) {
    return null;
  }

  return normalized.slice(0, index);
}

/** Best-effort scan summary patch after a successful delete. */
export function removeDeletedPathFromScanResult(target: DeleteTarget): void {
  if (!scanStore.result) {
    return;
  }

  const result = scanStore.result;
  const targetPath = target.path;

  result.largestFiles = result.largestFiles.filter((entry) => !pathsEqual(entry.path, targetPath));
  result.cleanupCandidates = result.cleanupCandidates.filter((entry) => !pathsEqual(entry.path, targetPath));

  if (target.kind === 'file') {
    result.fileCount = Math.max(0, result.fileCount - 1);
    result.totalSizeBytes = Math.max(0, result.totalSizeBytes - target.sizeBytes);

    const parentPath = parentDirectoryPath(targetPath);
    if (parentPath) {
      const parentId = findDirectoryNodeIdByPath(result, parentPath);
      if (parentId) {
        const parentNode = result.directoriesById[parentId];
        if (parentNode) {
          parentNode.fileCount = Math.max(0, parentNode.fileCount - 1);
          subtractFileSizeFromAncestors(result, parentId, target.sizeBytes);
        }
      }
    }
  } else {
    const nodeId = findDirectoryNodeIdByPath(result, targetPath);
    if (nodeId) {
      const node = result.directoriesById[nodeId];
      const subtreeIds = collectSubtreeNodeIds(result, nodeId);
      let subtreeFileCount = 0;

      for (const id of subtreeIds) {
        const subtreeNode = result.directoriesById[id];
        if (subtreeNode) {
          subtreeFileCount += subtreeNode.fileCount;
        }
      }

      result.fileCount = Math.max(0, result.fileCount - subtreeFileCount);
      result.directoryCount = Math.max(0, result.directoryCount - subtreeIds.length);
      result.totalSizeBytes = Math.max(0, result.totalSizeBytes - (node?.sizeBytes ?? target.sizeBytes));

      if (node?.parentId) {
        const parentNode = result.directoriesById[node.parentId];
        if (parentNode) {
          parentNode.childDirectoryIds = parentNode.childDirectoryIds.filter((childId) => childId !== nodeId);
          parentNode.directoryCount = Math.max(0, parentNode.directoryCount - 1);
          subtractFileSizeFromAncestors(result, node.parentId, node.sizeBytes);
        }
      }

      for (const id of subtreeIds) {
        delete result.directoriesById[id];
      }
    }

    result.largestFiles = result.largestFiles.filter(
      (entry) => !isPathInsideDirectory(entry.path, targetPath) && !pathsEqual(entry.path, targetPath),
    );
    result.cleanupCandidates = result.cleanupCandidates.filter(
      (entry) => !isPathInsideDirectory(entry.path, targetPath) && !pathsEqual(entry.path, targetPath),
    );
  }

  notifyScanStore();
}


/** Test helper — reset scan lifecycle fields. */
export function resetScanSessionForTest(): void {
  clearProgressNotifyTimer();
  pendingProgress = null;
  cancelRequestedByUser = false;
  scanStore.scanId = null;
  scanStore.scanError = null;
  scanStore.cacheWarning = null;
  scanStore.progress = null;
  scanStore.result = null;
  scanStore.developerCleanupEnabledAtScan = null;
  scanStore.overviewMode = 'picker';
  scanStore.scanHistory = [];
  scanStore.scanTargetMissing = false;
  scanStore.lastSelectedPaths = [];
  scanStore.status = 'idle';
  historyHydrated = false;
  notifyScanStore();
}
