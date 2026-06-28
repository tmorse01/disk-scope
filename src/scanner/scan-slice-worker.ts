import { parentPort } from 'node:worker_threads';
import { resolveReadDirectory } from './native-enumerator';
import { processDirectorySlice } from './scan-engine-slice';
import type { SliceWorkerInboundMessage, SliceWorkerOutboundMessage } from './scan-types';

let cancelRequested = false;
let exclusions: import('../shared/types').ScanExclusion[] = [];
let developerCleanupEnabled = false;
const readDirectory = resolveReadDirectory();

function postMessage(message: SliceWorkerOutboundMessage): void {
  parentPort?.postMessage(message);
}

if (parentPort) {
  parentPort.on('message', (message: SliceWorkerInboundMessage) => {
    if (message.type === 'init') {
      exclusions = message.payload.exclusions;
      developerCleanupEnabled = message.payload.developerCleanupEnabled;
      postMessage({ type: 'ready' });
      return;
    }

    if (message.type === 'cancel') {
      cancelRequested = true;
      return;
    }

    if (message.type === 'process') {
      cancelRequested = false;
      void (async () => {
        try {
          const partial = await processDirectorySlice({
            job: message.payload,
            readDirectory,
            exclusions,
            developerCleanupEnabled,
            shouldCancel: () => cancelRequested,
          });
          postMessage({ type: 'partial', payload: partial, jobId: message.jobId });
        } catch (error) {
          postMessage({
            type: 'error',
            payload: {
              jobId: message.jobId,
              message: error instanceof Error ? error.message : String(error),
            },
          });
        }
      })();
    }
  });
}
