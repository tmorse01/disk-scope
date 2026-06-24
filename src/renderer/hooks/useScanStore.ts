import { useSyncExternalStore } from 'react';
import {
  getScanStoreVersion,
  scanStore,
  subscribeScanStore,
  type ScanStoreState,
} from '../stores/scan-store';

export function useScanStore(): ScanStoreState {
  useSyncExternalStore(
    (onStoreChange) => subscribeScanStore(() => onStoreChange()),
    getScanStoreVersion,
    () => 0,
  );
  return scanStore;
}
