import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ScanCompleteEvent, ScanProgressEvent } from '../../src/shared/types';

const selectDirectory = vi.fn<[], Promise<{ path: string } | null>>();
const startScan = vi.fn();
const cancelScan = vi.fn();
const getScanHistory = vi.fn();
const saveLastSelectedPaths = vi.fn();
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
  getScanHistory.mockResolvedValue({ entries: [], lastSelectedPaths: [] });
  saveLastSelectedPaths.mockResolvedValue(undefined);

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      diskScope: {
        selectDirectory,
        startScan,
        cancelScan,
        getScanHistory,
        saveLastSelectedPaths,
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
    getScanHistory.mockReset();
    saveLastSelectedPaths.mockReset();
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
    getScanHistory.mockReset();
    saveLastSelectedPaths.mockReset();
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
    expect(scanStore.overviewMode).toBe('summary');
    expect(scanStore.scanHistory).toHaveLength(1);
    expect(scanStore.scanHistory[0]?.scanId).toBe('scan-1');
  });

  it('activates a previous scan from history', async () => {
    const { activateScanFromHistory, scanStore } = await import('../../src/renderer/stores/scan-store');

    const firstResult = {
      scanId: 'scan-a',
      rootPath: 'C:\\First',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:05.000Z',
      durationMs: 5000,
      totalSizeBytes: 100,
      fileCount: 1,
      directoryCount: 1,
      errorCount: 0,
      rootNodeId: 'root-a',
      directoriesById: {},
      largestFiles: [],
      extensionSummaries: [],
      cleanupCandidates: [],
      errors: [],
    };
    const secondResult = {
      ...firstResult,
      scanId: 'scan-b',
      rootPath: 'C:\\Second',
      fileCount: 2,
      rootNodeId: 'root-b',
    };

    scanStore.scanHistory = [
      { scanId: 'scan-b', result: secondResult, status: 'completed', developerCleanupEnabledAtScan: false },
      { scanId: 'scan-a', result: firstResult, status: 'completed', developerCleanupEnabledAtScan: false },
    ];
    scanStore.scanId = 'scan-b';
    scanStore.result = secondResult;
    scanStore.status = 'completed';
    scanStore.overviewMode = 'summary';

    activateScanFromHistory('scan-a');

    expect(scanStore.scanId).toBe('scan-a');
    expect(scanStore.result?.rootPath).toBe('C:\\First');
    expect(scanStore.overviewMode).toBe('summary');
  });

  it('shows the overview picker without clearing scan history', async () => {
    const { showOverviewPicker, scanStore } = await import('../../src/renderer/stores/scan-store');

    scanStore.scanHistory = [
      {
        scanId: 'scan-a',
        result: {
          scanId: 'scan-a',
          rootPath: 'C:\\Demo',
          startedAt: '2026-01-01T00:00:00.000Z',
          completedAt: '2026-01-01T00:00:05.000Z',
          durationMs: 5000,
          totalSizeBytes: 100,
          fileCount: 1,
          directoryCount: 1,
          errorCount: 0,
          rootNodeId: 'root',
          directoriesById: {},
          largestFiles: [],
          extensionSummaries: [],
          cleanupCandidates: [],
          errors: [],
        },
        status: 'completed',
        developerCleanupEnabledAtScan: false,
      },
    ];
    scanStore.overviewMode = 'summary';

    showOverviewPicker();

    expect(scanStore.overviewMode).toBe('picker');
    expect(scanStore.scanHistory).toHaveLength(1);
  });

  it('marks cancelled when user cancels before completion', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });
    cancelScan.mockResolvedValue(undefined);

    const { startScanFromStore, cancelScanFromStore, initScanStoreListeners, scanStore } =
      await import('../../src/renderer/stores/scan-store');

    await startScanFromStore();
    initScanStoreListeners();
    await cancelScanFromStore();

    expect(scanStore.cancelPending).toBe(true);
    expect(cancelScan).toHaveBeenCalledWith('scan-1');

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

    expect(scanStore.status).toBe('cancelled');
    expect(scanStore.cancelPending).toBe(false);
    expect(scanStore.overviewMode).toBe('picker');
  });

  it('resumes scan progress from the paused baseline instead of resetting', async () => {
    vi.useFakeTimers();
    startScan.mockResolvedValueOnce({ scanId: 'scan-1' }).mockResolvedValueOnce({ scanId: 'scan-2' });
    cancelScan.mockResolvedValue(undefined);

    const {
      startScanFromStore,
      cancelScanFromStore,
      resumeScanFromStore,
      initScanStoreListeners,
      scanStore,
    } = await import('../../src/renderer/stores/scan-store');

    scanStore.selectedPaths = ['C:\\Demo'];
    await startScanFromStore();
    initScanStoreListeners();

    _progressHandler?.({
      scanId: 'scan-1',
      filesScanned: 12_000,
      directoriesScanned: 400,
      bytesDiscovered: 1_000_000,
      currentPath: 'C:\\Demo\\src',
      errorCount: 0,
      elapsedMs: 45_000,
    });
    await vi.advanceTimersByTimeAsync(200);

    expect(scanStore.progress?.elapsedMs).toBe(45_000);

    await cancelScanFromStore();

    expect(scanStore.analyzedPercentFloor).toBeGreaterThan(0);

    await resumeScanFromStore();

    expect(scanStore.status).toBe('scanning');
    expect(scanStore.progress?.elapsedMs).toBe(45_000);
    expect(scanStore.progress?.filesScanned).toBe(12_000);
    expect(scanStore.analyzedPercentFloor).toBeGreaterThan(0);
    expect(startScan).toHaveBeenLastCalledWith({
      rootPath: 'C:\\Demo',
      useFilesystemCache: true,
    });

    scanStore.scanId = 'scan-2';
    _progressHandler?.({
      scanId: 'scan-2',
      filesScanned: 500,
      directoriesScanned: 20,
      bytesDiscovered: 50_000,
      currentPath: 'C:\\Demo\\lib',
      errorCount: 0,
      elapsedMs: 2_000,
    });
    await vi.advanceTimersByTimeAsync(200);

    expect(scanStore.progress?.elapsedMs).toBe(47_000);
    expect(scanStore.progress?.filesScanned).toBe(12_000);

    vi.useRealTimers();
  });
});

describe('scan store history hydration', () => {
  beforeEach(async () => {
    vi.resetModules();
    selectDirectory.mockReset();
    startScan.mockReset();
    cancelScan.mockReset();
    getScanHistory.mockReset();
    saveLastSelectedPaths.mockReset();
    onScanProgress.mockReset();
    onScanComplete.mockReset();
    onScanError.mockReset();
    _progressHandler = undefined;
    completeHandler = undefined;
    mockDiskScope();

    const { scanStore, resetScanSessionForTest } = await import('../../src/renderer/stores/scan-store');
    resetScanSessionForTest();
    scanStore.selectedPaths = [];
  });

  it('hydrates scan history and activates the most recent completed scan', async () => {
    const completedResult = {
      scanId: 'scan-done',
      rootPath: 'C:\\Done',
      startedAt: '2026-01-01T00:00:00.000Z',
      completedAt: '2026-01-01T00:00:05.000Z',
      durationMs: 5000,
      totalSizeBytes: 2048,
      fileCount: 4,
      directoryCount: 1,
      errorCount: 0,
      rootNodeId: 'root-done',
      directoriesById: {},
      largestFiles: [],
      extensionSummaries: [],
      cleanupCandidates: [],
      errors: [],
    };
    const cancelledResult = {
      ...completedResult,
      scanId: 'scan-cancelled',
      rootPath: 'C:\\Cancelled',
      rootNodeId: 'root-cancelled',
    };

    getScanHistory.mockResolvedValue({
      entries: [
        {
          scanId: 'scan-cancelled',
          status: 'cancelled',
          developerCleanupEnabledAtScan: false,
          savedAt: '2026-01-02T00:00:00.000Z',
          result: cancelledResult,
          rootPathMissing: false,
        },
        {
          scanId: 'scan-done',
          status: 'completed',
          developerCleanupEnabledAtScan: true,
          savedAt: '2026-01-01T00:00:00.000Z',
          result: completedResult,
          rootPathMissing: false,
        },
      ],
      lastSelectedPaths: ['C:\\Done'],
    });

    const { hydrateScanHistoryFromMain, scanStore } = await import('../../src/renderer/stores/scan-store');

    await hydrateScanHistoryFromMain();

    expect(getScanHistory).toHaveBeenCalledOnce();
    expect(scanStore.scanHistory).toHaveLength(2);
    expect(scanStore.scanId).toBe('scan-done');
    expect(scanStore.result?.rootPath).toBe('C:\\Done');
    expect(scanStore.overviewMode).toBe('summary');
    expect(scanStore.selectedPaths).toEqual(['C:\\Done']);
    expect(scanStore.developerCleanupEnabledAtScan).toBe(true);
  });

  it('handles empty persisted history without changing idle state', async () => {
    getScanHistory.mockResolvedValue({ entries: [], lastSelectedPaths: [] });

    const { hydrateScanHistoryFromMain, scanStore } = await import('../../src/renderer/stores/scan-store');

    await hydrateScanHistoryFromMain();

    expect(scanStore.scanHistory).toEqual([]);
    expect(scanStore.result).toBeNull();
    expect(scanStore.overviewMode).toBe('picker');
    expect(scanStore.status).toBe('idle');
  });

  it('marks missing scan targets during hydration', async () => {
    getScanHistory.mockResolvedValue({
      entries: [
        {
          scanId: 'scan-missing',
          status: 'completed',
          developerCleanupEnabledAtScan: false,
          savedAt: '2026-01-01T00:00:00.000Z',
          result: {
            scanId: 'scan-missing',
            rootPath: 'Z:\\Gone',
            startedAt: '2026-01-01T00:00:00.000Z',
            completedAt: '2026-01-01T00:00:05.000Z',
            durationMs: 5000,
            totalSizeBytes: 100,
            fileCount: 1,
            directoryCount: 1,
            errorCount: 0,
            rootNodeId: 'root',
            directoriesById: {},
            largestFiles: [],
            extensionSummaries: [],
            cleanupCandidates: [],
            errors: [],
          },
          rootPathMissing: true,
        },
      ],
      lastSelectedPaths: [],
    });

    const { hydrateScanHistoryFromMain, scanStore } = await import('../../src/renderer/stores/scan-store');

    await hydrateScanHistoryFromMain();

    expect(scanStore.scanTargetMissing).toBe(true);
    expect(scanStore.scanHistory[0]?.rootPathMissing).toBe(true);
  });

  it('persists last selected paths when starting a scan', async () => {
    startScan.mockResolvedValue({ scanId: 'scan-1' });

    const { startScanFromStore, scanStore } = await import('../../src/renderer/stores/scan-store');
    scanStore.selectedPaths = ['C:\\Demo', 'D:\\Extra'];

    await startScanFromStore();

    expect(saveLastSelectedPaths).toHaveBeenCalledWith(['C:\\Demo', 'D:\\Extra']);
  });

  it('restores last selected paths when opening the overview picker', async () => {
    const { showOverviewPicker, scanStore } = await import('../../src/renderer/stores/scan-store');

    scanStore.lastSelectedPaths = ['C:\\Restored'];
    scanStore.selectedPaths = [];
    scanStore.status = 'idle';
    scanStore.overviewMode = 'summary';

    showOverviewPicker();

    expect(scanStore.overviewMode).toBe('picker');
    expect(scanStore.selectedPaths).toEqual(['C:\\Restored']);
  });
});
