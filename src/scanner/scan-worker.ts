import { parentPort } from 'node:worker_threads';

/**
 * Scanner worker entry point.
 * TODO(task-005): implement recursive traversal, aggregation, and progress batching.
 */
if (parentPort) {
  parentPort.postMessage({ type: 'ready' });
}
