import { parentPort } from 'node:worker_threads';
import { runScan } from './scan-engine';
import type { WorkerInboundMessage, WorkerOutboundMessage } from './scan-types';

let cancelRequested = false;

function postMessage(message: WorkerOutboundMessage): void {
  parentPort?.postMessage(message);
}

async function handleStart(payload: WorkerInboundMessage & { type: 'start' }): Promise<void> {
  cancelRequested = false;

  try {
    const { result, cancelled: _cancelled } = await runScan({
      scanId: payload.payload.scanId,
      rootPath: payload.payload.rootPath,
      shouldCancel: () => cancelRequested,
      onProgress: (event) => {
        postMessage({ type: 'progress', payload: event });
      },
    });

    postMessage({
      type: 'complete',
      payload: {
        scanId: result.scanId,
        result,
      },
    });
  } catch (error) {
    postMessage({
      type: 'error',
      payload: {
        scanId: payload.payload.scanId,
        message: error instanceof Error ? error.message : String(error),
        code: error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined,
      },
    });
  }
}

if (parentPort) {
  parentPort.on('message', (message: WorkerInboundMessage) => {
    if (message.type === 'cancel') {
      cancelRequested = true;
      return;
    }

    if (message.type === 'start') {
      void handleStart(message);
    }
  });
}
