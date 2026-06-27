import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScanCompleteEvent, ScanProgressEvent } from '../../src/shared/types';

const selectDirectory = vi.fn<[], Promise<{ path: string } | null>>();
const startScan = vi.fn();
const cancelScan = vi.fn();
const onScanProgress = vi.fn();
const onScanComplete = vi.fn();
const onScanError = vi.fn();

type ProgressHandler = (event: ScanProgressEvent) => void;
type CompleteHandler = (event: ScanCompleteEvent) => void;

let _progressHandler: ProgressHandler | undefined;
let completeHandler: CompleteHandler | undefined;

function mockDiskScope() {
  onScanProgress.mockImplementation((handler: ProgressHandler) => {
    _progressHandler = handler;
    return () => {
      _progressHandler = undefined;
    };
  });
  onScanComplete.mockImplementation((handler: CompleteHandler) => {
    completeHandler = handler;
    return () => {
      completeHandler = undefined;
    };
  });
  onScanError.mockImplementation(() => () => undefined);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      diskScope: {
        selectDirectory,
        startScan,
        cancelScan,
        onScanProgress,
        onScanComplete,
        onScanError,
      },
    },
  });
}

describe('scan store picker flow', () => {
  beforeEach(async () => {
    vi.resetModules();
    selectDirectory.mockReset();
    startScan.mockReset();
    cancelScan.mockReset();
    onScanProgress.mockReset();
    onScanComplete.mockReset();
    onScanError.mockReset();
    _progressHandler = undefined;
    completeHandler = undefined;
    mockDiskScope();

    const { scanStore, resetScanSessionForTest } = await import('../../src/renderer/stores/scan-store');
    scanStore.status = 'idle';
    scanStore.selectedPaths = [];
    scanStore.pickerError = null;
    resetScanSessionForTest();
  });

  it('stores the selected path and returns to idle', async () => {
    selectDirectory.mockResolvedValue({ path: 'C:\\Projects\\disk-scope' });

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();

    expect(selectDirectory).toHaveBeenCalledOnce();
    expect(scanStore.selectedPaths).toEqual(['C:\\Projects\\disk-scope']);
    expect(scanStore.status).toBe('idle');
    expect(scanStore.pickerError).toBeNull();
  });

  it('leaves selected path empty when the picker is canceled', async () => {
    selectDirectory.mockResolvedValue(null);

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();

    expect(scanStore.selectedPaths).toEqual([]);
    expect(scanStore.status).toBe('idle');
    expect(scanStore.pickerError).toBeNull();
  });

  it('uses selecting-target while the native picker is open', async () => {
    let resolvePicker: ((value: { path: string } | null) => void) | undefined;
    selectDirectory.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');
    const pending = pickScanTarget();

    expect(scanStore.status).toBe('selecting-target');

    resolvePicker?.({ path: 'E:\\Archive' });
    await pending;

    expect(scanStore.status).toBe('idle');
    expect(scanStore.selectedPaths).toEqual(['E:\\Archive']);
  });

  it('appends additional targets without duplicates', async () => {
    selectDirectory.mockResolvedValueOnce({ path: 'C:\\A' }).mockResolvedValueOnce({ path: 'C:\\B' });

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();
    await pickScanTarget();

    expect(scanStore.selectedPaths).toEqual(['C:\\A', 'C:\\B']);

    selectDirectory.mockResolvedValueOnce({ path: 'C:\\A' });
    await pickScanTarget();

    expect(scanStore.selectedPaths).toEqual(['C:\\A', 'C:\\B']);
  });
});

describe('scan store scan lifecycle', () => {
  beforeEach(async () => {
    vi.resetModules();
    selectDirectory.mockReset();
    startScan.mockReset();
    cancelScan.mockReset();
    onScanProgress.mockReset();
    onScanComplete.mockReset();
    onScanError.mockReset();
    _progressHandler = undefined;
    completeHandler = undefined;
    mockDiskScope();

    const { scanStore, resetScanSessionForTest } = await import('../../src/renderer/stores/scan-store');
    scanStore.selectedPaths = ['C:\\Demo'];
    resetScanSessionForTest();
    scanStore.selectedPaths = ['C:\\Demo'];
  });

  it('starts a scan and stores the scan id', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });

    const { startScanFromStore, scanStore } = await import('../../src/renderer/stores/scan-store');

    await startScanFromStore();

    expect(startScan).toHaveBeenCalledWith({
      rootPath: 'C:\\Demo',
      useFilesystemCache: true,
    });
    expect(scanStore.status).toBe('scanning');
    expect(scanStore.scanId).toBe('scan-1');
  });

  it('passes useFilesystemCache false when disabled in the store', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });

    const { startScanFromStore, setUseFilesystemCache } = await import(
      '../../src/renderer/stores/scan-store'
    );

    setUseFilesystemCache(false);
    await startScanFromStore();

    expect(startScan).toHaveBeenCalledWith({
      rootPath: 'C:\\Demo',
      useFilesystemCache: false,
    });
  });

  it('stores cache warnings from startScan', async () => {
    startScan.mockResolvedValue({
      scanId: 'scan-1',
      cacheWarning: 'Could not clear filesystem cache.',
    });

    const { startScanFromStore, scanStore } = await import('../../src/renderer/stores/scan-store');

    await startScanFromStore();

    expect(scanStore.cacheWarning).toBe('Could not clear filesystem cache.');
  });

  it('merges progress updates into the store', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });

    const { startScanFromStore, applyScanProgressForTest, scanStore } = await import(
      '../../src/renderer/stores/scan-store'
    );

    await startScanFromStore();

    applyScanProgressForTest({
      scanId: 'scan-1',
      filesScanned: 12,
      directoriesScanned: 3,
      bytesDiscovered: 4096,
      currentPath: 'C:\\Demo\\src',
      errorCount: 1,
      elapsedMs: 500,
    });

    expect(scanStore.progress).toEqual({
      filesScanned: 12,
      directoriesScanned: 3,
      bytesDiscovered: 4096,
      currentPath: 'C:\\Demo\\src',
      errorCount: 1,
      elapsedMs: 500,
    });
  });

  it('transitions to completed when scan completes', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });

    const { startScanFromStore, initScanStoreListeners, scanStore } = await import(
      '../../src/renderer/stores/scan-store'
    );

    await startScanFromStore();
    initScanStoreListeners();

    completeHandler?.({
      scanId: 'scan-1',
      result: {
        scanId: 'scan-1',
        rootPath: 'C:\\Demo',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:05.000Z',
        durationMs: 5000,
        totalSizeBytes: 8192,
        fileCount: 20,
        directoryCount: 4,
        errorCount: 0,
        rootNodeId: 'root',
        directoriesById: {},
        largestFiles: [],
        extensionSummaries: [],
        cleanupCandidates: [],
        errors: [],
      },
    });

    expect(scanStore.status).toBe('completed');
    expect(scanStore.result?.fileCount).toBe(20);
  });

  it('marks cancelled when user cancels before completion', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });
    cancelScan.mockResolvedValue(undefined);

    const { startScanFromStore, cancelScanFromStore, initScanStoreListeners, scanStore } =
      await import('../../src/renderer/stores/scan-store');

    await startScanFromStore();
    initScanStoreListeners();
    await cancelScanFromStore();

    completeHandler?.({
      scanId: 'scan-1',
      result: {
        scanId: 'scan-1',
        rootPath: 'C:\\Demo',
        startedAt: '2026-01-01T00:00:00.000Z',
        completedAt: '2026-01-01T00:00:02.000Z',
        durationMs: 2000,
        totalSizeBytes: 1024,
        fileCount: 5,
        directoryCount: 1,
        errorCount: 0,
        rootNodeId: 'root',
        directoriesById: {},
        largestFiles: [],
        extensionSummaries: [],
        cleanupCandidates: [],
        errors: [],
      },
    });

    expect(cancelScan).toHaveBeenCalledWith('scan-1');
    expect(scanStore.status).toBe('cancelled');
  });
});
