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
} from '../../shared/types';
import { randomUUID } from 'node:crypto';
import type { WorkerInboundMessage, WorkerOutboundMessage } from '../../scanner/scan-types';
import { resolveWorkerCount } from '../../scanner/scan-types';
import { ScanWorkerPool } from '../../scanner/scan-worker-pool';
import { getPreferencesSync } from './preferences-store';

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

const activeScans = new Map<ScanSessionId, ActiveScan>();
const completedScans = new Map<ScanSessionId, ScanResult>();

export function getCompletedScanResult(scanId: ScanSessionId): ScanResult | undefined {
  return completedScans.get(scanId);
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

function handleWorkerMessage(scanId: ScanSessionId, message: WorkerOutboundMessage): void {
  switch (message.type) {
    case 'progress':
      broadcastToRenderers<ScanProgressEvent>(IPC_CHANNELS.SCAN_PROGRESS, message.payload);
      break;
    case 'complete':
      completedScans.set(scanId, message.payload.result);
      broadcastToRenderers<ScanCompleteEvent>(IPC_CHANNELS.SCAN_COMPLETE, message.payload);
      cleanupScan(scanId);
      break;
    case 'error':
      broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, message.payload);
      cleanupScan(scanId);
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

function startSingleWorkerScan(scanId: ScanSessionId, rootPath: string, exclusions: import('../../shared/types').ScanExclusion[]): void {
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
    payload: { scanId, rootPath, exclusions },
  };
  worker.postMessage(startMessage);
}

function startPoolScan(scanId: ScanSessionId, rootPath: string, exclusions: import('../../shared/types').ScanExclusion[]): void {
  const pool = new ScanWorkerPool({
    scanId,
    rootPath,
    exclusions,
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
    completedScans.set(scanId, result);
    broadcastToRenderers<ScanCompleteEvent>(IPC_CHANNELS.SCAN_COMPLETE, {
      scanId,
      result,
    });
    void cleanupScan(scanId);
  }).catch((error: Error) => {
    broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
      scanId,
      message: error.message,
      code: 'POOL_ERROR',
    });
    void cleanupScan(scanId);
  });
}

export function startScan(rootPath: string): ScanSessionId {
  completedScans.clear();
  const scanId = randomUUID();
  const exclusions = getPreferencesSync().exclusions;

  if (resolveWorkerCount() === 1) {
    startSingleWorkerScan(scanId, rootPath, exclusions);
  } else {
    startPoolScan(scanId, rootPath, exclusions);
  }

  return scanId;
}

export function cancelScan(scanId: ScanSessionId): void {
  const active = activeScans.get(scanId);
  if (!active) {
    return;
  }

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
