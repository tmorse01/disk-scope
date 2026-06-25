import type {
  ExportFormat,
  ScanProgressEvent,
  ScanResult,
  ScanSessionId,
  ScanStatus,
  SelectedPath,
} from '../../shared/types';

export type ScanProgressSnapshot = {
  filesScanned: number;
  directoriesScanned: number;
  bytesDiscovered: number;
  currentPath: string;
  errorCount: number;
  elapsedMs: number;
};

/**
 * In-memory scan session state for the renderer.
 */
export type ScanStoreState = {
  status: ScanStatus;
  selectedPaths: string[];
  pickerError: string | null;
  scanId: ScanSessionId | null;
  scanError: string | null;
  progress: ScanProgressSnapshot | null;
  result: ScanResult | null;
};

export const scanStore: ScanStoreState = {
  status: 'idle',
  selectedPaths: [],
  pickerError: null,
  scanId: null,
  scanError: null,
  progress: null,
  result: null,
};

export function getPrimarySelectedPath(): string | null {
  return scanStore.selectedPaths[0] ?? null;
}

type ScanStoreListener = (state: ScanStoreState) => void;

const listeners = new Set<ScanStoreListener>();

let storeVersion = 0;
let listenersInitialized = false;
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
  scanStore.result = event.result;
  scanStore.progress = {
    filesScanned: event.result.fileCount,
    directoriesScanned: event.result.directoryCount,
    bytesDiscovered: event.result.totalSizeBytes,
    currentPath: event.result.rootPath,
    errorCount: event.result.errorCount,
    elapsedMs: Date.parse(event.result.completedAt) - Date.parse(event.result.startedAt),
  };
  scanStore.status = cancelRequestedByUser ? 'cancelled' : 'completed';
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

  if (scanStore.status === 'scanning') {
    return;
  }

  initScanStoreListeners();

  scanStore.scanError = null;
  scanStore.result = null;
  scanStore.progress = null;
  cancelRequestedByUser = false;
  clearProgressNotifyTimer();
  pendingProgress = null;
  scanStore.status = 'scanning';
  notifyScanStore();

  try {
    const scanId = await window.diskScope.startScan({ rootPath });
    scanStore.scanId = scanId;
    notifyScanStore();
  } catch (error) {
    scanStore.status = 'failed';
    scanStore.scanError =
      error instanceof Error ? error.message : 'Failed to start scan.';
    scanStore.scanId = null;
    notifyScanStore();
  }
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

/** Test helper — reset scan lifecycle fields. */
export function resetScanSessionForTest(): void {
  clearProgressNotifyTimer();
  pendingProgress = null;
  cancelRequestedByUser = false;
  scanStore.scanId = null;
  scanStore.scanError = null;
  scanStore.progress = null;
  scanStore.result = null;
  scanStore.status = 'idle';
  notifyScanStore();
}
