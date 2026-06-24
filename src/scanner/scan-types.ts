import type { ScanStatus } from '../shared/types';

/**
 * Scanner-specific types and message payloads.
 * TODO(task-005): expand worker message protocol.
 */
export type ScanWorkerMessage =
  | { type: 'progress'; payload: unknown }
  | { type: 'complete'; payload: unknown }
  | { type: 'error'; payload: unknown };

export type ScanWorkerState = {
  status: ScanStatus;
};
