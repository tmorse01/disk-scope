import type { ScanStatus, SelectedPath } from '../../shared/types';

/**
 * In-memory scan session state for the renderer.
 * Task 004: selected scan target path and picker flow.
 * TODO(task-006): wire progress events and result storage.
 */
export type ScanStoreState = {
  status: ScanStatus;
  selectedPath: string | null;
  pickerError: string | null;
};

export const scanStore: ScanStoreState = {
  status: 'idle',
  selectedPath: null,
  pickerError: null,
};

type ScanStoreListener = (state: ScanStoreState) => void;

const listeners = new Set<ScanStoreListener>();

export function subscribeScanStore(listener: ScanStoreListener): () => void {
  listeners.add(listener);
  listener(scanStore);

  return () => {
    listeners.delete(listener);
  };
}

function notifyScanStore(): void {
  for (const listener of listeners) {
    listener(scanStore);
  }
}

export function setSelectedPath(selected: SelectedPath | null): void {
  scanStore.selectedPath = selected?.path ?? null;
  scanStore.pickerError = null;
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
    scanStore.selectedPath = null;
    scanStore.pickerError =
      error instanceof Error ? error.message : 'Failed to open folder picker.';
    scanStore.status = 'idle';
    notifyScanStore();
  }
}
