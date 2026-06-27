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
import { getPreferencesSync } from './preferences-store';

type ActiveScan = {
  worker: Worker;
};

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

function cleanupScan(scanId: ScanSessionId): void {
  const active = activeScans.get(scanId);
  if (!active) {
    return;
  }

  active.worker.removeAllListeners();
  void active.worker.terminate();
  activeScans.delete(scanId);
}

export function startScan(rootPath: string): ScanSessionId {
  completedScans.clear();
  const scanId = randomUUID();
  const worker = new Worker(getScanWorkerPath());

  activeScans.set(scanId, { worker });

  worker.on('message', (message: WorkerOutboundMessage) => {
    handleWorkerMessage(scanId, message);
  });

  worker.on('error', (error) => {
    broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
      scanId,
      message: error.message,
      code: 'WORKER_ERROR',
    });
    cleanupScan(scanId);
  });

  worker.on('exit', (code) => {
    if (code !== 0 && activeScans.has(scanId)) {
      broadcastToRenderers<ScanErrorEvent>(IPC_CHANNELS.SCAN_ERROR, {
        scanId,
        message: `Scanner worker exited with code ${code}`,
        code: 'WORKER_EXIT',
      });
      cleanupScan(scanId);
    }
  });

  const exclusions = getPreferencesSync().exclusions;
  const startMessage: WorkerInboundMessage = {
    type: 'start',
    payload: { scanId, rootPath, exclusions },
  };
  worker.postMessage(startMessage);

  return scanId;
}

export function cancelScan(scanId: ScanSessionId): void {
  const active = activeScans.get(scanId);
  if (!active) {
    return;
  }

  const cancelMessage: WorkerInboundMessage = { type: 'cancel' };
  active.worker.postMessage(cancelMessage);
}

export function terminateAllScans(): void {
  for (const scanId of [...activeScans.keys()]) {
    cleanupScan(scanId);
  }
}
