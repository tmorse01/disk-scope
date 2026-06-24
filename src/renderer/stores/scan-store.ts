import type { ScanStatus } from '../../shared/types';

/**
 * In-memory scan session state for the renderer.
 * TODO(task-006): wire progress events and result storage.
 */
export type ScanStoreState = {
  status: ScanStatus;
};

export const scanStore: ScanStoreState = {
  status: 'idle',
};
