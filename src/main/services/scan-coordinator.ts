import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanProgressEvent,
  ScanResult,
  ScanSessionId,
  StartScanResponse,
} from '../../shared/types';
import { randomUUID } from 'node:crypto';
import type { WorkerInboundMessage, WorkerOutboundMessage } from '../../scanner/scan-types';
import { resolveWorkerCount } from '../../scanner/scan-types';
import { ScanWorkerPool } from '../../scanner/scan-worker-pool';
import { dropWindowsStandbyCache } from './filesystem-cache';
import { getPreferencesSync } from './preferences-store';
import { appendScanHistory, getPersistedScanResults, initScanHistoryStore } from './scan-history-store';

type ActiveSingleScan = {
  kind: 'single';
  worker: Worker;
};

type ActivePoolScan = {
  kind: 'pool';
  pool: ScanWorkerPool;
  cancelRequested: boolean;
};

type ActiveScan = ActiveSingleScan | ActivePoolScan;

type ScanSessionMetadata = {
  developerCleanupEnabledAtScan: boolean;
};

const activeScans = new Map<ScanSessionId, ActiveScan>();
const completedScans = new Map<ScanSessionId, ScanResult>();
const cancelRequestedScans = new Set<ScanSessionId>();
const scanSessionMetadata = new Map<ScanSessionId, ScanSessionMetadata>();

export function getCompletedScanResult(scanId: ScanSessionId): ScanResult | undefined {
  return completedScans.get(scanId);
}

export function getProtectedScanRootPaths(): string[] {
  return [...completedScans.values()].map((result) => path.normalize(result.rootPath));
}

export async function initScanCoordinatorHistory(): Promise<void> {
  await initScanHistoryStore();
  completedScans.clear();
  for (const [scanId, result] of getPersistedScanResults()) {
    completedScans.set(scanId, result);
  }
}

function broadcastToRenderers<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(channel, payload);
    }
  }
}

function getScanWorkerPath(): string {
  const workerDir = __dirname.includes('app.asar')
    ? __dirname.replace('app.asar', 'app.asar.unpacked')
    : __dirname;
  return path.join(workerDir, 'scan-worker.js');
}

async function persistCompletedScan(scanId: ScanSessionId, result: ScanResult): Promise<void> {
  const metadata = scanSessionMetadata.get(scanId);
  const status = cancelRequestedScans.has(scanId) ? 'cancelled' : 'completed';

  completedScans.set(scanId, result);
  cancelRequestedScans.delete(scanId);
  scanSessionMetadata.delete(scanId);

  try {
    await appendScanHistory({
      scanId,
      status,
      developerCleanupEnabledAtScan: metadata?.developerCleanupEnabledAtScan ?? false,
      result,
    });
  } catch (error) {
    console.warn('[scan-coordinator] Failed to persist scan history:', error);
  }
}

function handleWorkerMessage(scanId: ScanSessionId, message: WorkerOutboundMessage): void {
  switch (message.type) {
    case 'progress':
      broadcastToRenderers<ScanProgressEvent>(IPC_CHANNELS.SCAN_PROGRESS, message.payload);
      break;
    case 'complete':
      void persistCompletedScan(scanId, message.payload.result).then(() => {
        broadcastToRenderers<ScanCompleteEvent>(IPC_CHANNELS.SCAN_COMPLETE, message.payload);
        void cleanupScan(scanId);
      });
      break;
    case 'error':
      cancelRequestedScans.delete(scanId);
      scanSessionMetadata.delete(scanId);
      broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, message.payload);
      void cleanupScan(scanId);
      break;
    default:
      break;
  }
}

async function cleanupScan(scanId: ScanSessionId): Promise<void> {
  const active = activeScans.get(scanId);
  if (!active) {
    return;
  }

  if (active.kind === 'single') {
    active.worker.removeAllListeners();
    await active.worker.terminate();
  } else {
    await active.pool.terminate();
  }

  activeScans.delete(scanId);
}

function startSingleWorkerScan(
  scanId: ScanSessionId,
  rootPath: string,
  exclusions: import('../../shared/types').ScanExclusion[],
  developerCleanupEnabled: boolean,
): void {
  const worker = new Worker(getScanWorkerPath());

  activeScans.set(scanId, { kind: 'single', worker });

  worker.on('message', (message: WorkerOutboundMessage) => {
    handleWorkerMessage(scanId, message);
  });

  worker.on('error', (error) => {
    broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
      scanId,
      message: error.message,
      code: 'WORKER_ERROR',
    });
    void cleanupScan(scanId);
  });

  worker.on('exit', (code) => {
    if (code !== 0 && activeScans.has(scanId)) {
      broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
        scanId,
        message: `Scanner worker exited with code ${code}`,
        code: 'WORKER_EXIT',
      });
      void cleanupScan(scanId);
    }
  });

  const startMessage: WorkerInboundMessage = {
    type: 'start',
    payload: { scanId, rootPath, exclusions, developerCleanupEnabled },
  };
  worker.postMessage(startMessage);
}

function startPoolScan(
  scanId: ScanSessionId,
  rootPath: string,
  exclusions: import('../../shared/types').ScanExclusion[],
  developerCleanupEnabled: boolean,
): void {
  const pool = new ScanWorkerPool({
    scanId,
    rootPath,
    exclusions,
    developerCleanupEnabled,
    workerCount: resolveWorkerCount(),
    onProgress: (event) => {
      broadcastToRenderers<ScanProgressEvent>(IPC_CHANNELS.SCAN_PROGRESS, event);
    },
    shouldCancel: () => {
      const active = activeScans.get(scanId);
      return active?.kind === 'pool' ? active.cancelRequested : false;
    },
  });

  activeScans.set(scanId, { kind: 'pool', pool, cancelRequested: false });

  void pool.start().then(({ result }) => {
    void persistCompletedScan(scanId, result).then(() => {
      broadcastToRenderers<ScanCompleteEvent>(IPC_CHANNELS.SCAN_COMPLETE, {
        scanId,
        result,
      });
      void cleanupScan(scanId);
    });
  }).catch((error: Error) => {
    cancelRequestedScans.delete(scanId);
    scanSessionMetadata.delete(scanId);
    broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
      scanId,
      message: error.message,
      code: 'POOL_ERROR',
    });
    void cleanupScan(scanId);
  });
}

export async function startScan(options: {
  rootPath: string;
  useFilesystemCache: boolean;
}): Promise<StartScanResponse> {
  const scanId = randomUUID();
  const preferences = getPreferencesSync();
  const exclusions = preferences.exclusions;
  const developerCleanupEnabled = preferences.developerCleanupEnabled;

  scanSessionMetadata.set(scanId, { developerCleanupEnabledAtScan: developerCleanupEnabled });
  cancelRequestedScans.delete(scanId);

  let cacheWarning: string | undefined;
  if (!options.useFilesystemCache) {
    const dropResult = await dropWindowsStandbyCache();
    if (!dropResult.ok) {
      cacheWarning = dropResult.error.message;
    }
  }

  if (resolveWorkerCount() === 1) {
    startSingleWorkerScan(scanId, options.rootPath, exclusions, developerCleanupEnabled);
  } else {
    startPoolScan(scanId, options.rootPath, exclusions, developerCleanupEnabled);
  }

  return { scanId, cacheWarning };
}

export function cancelScan(scanId: ScanSessionId): void {
  const active = activeScans.get(scanId);
  if (!active) {
    return;
  }

  cancelRequestedScans.add(scanId);

  if (active.kind === 'single') {
    const cancelMessage: WorkerInboundMessage = { type: 'cancel' };
    active.worker.postMessage(cancelMessage);
    return;
  }

  active.cancelRequested = true;
  active.pool.cancel();
}

export function terminateAllScans(): void {
  for (const scanId of [...activeScans.keys()]) {
    void cleanupScan(scanId);
  }
}
