import type { DiskScopeAPI } from '../shared/types';

declare global {
  interface Window {
    diskScope: DiskScopeAPI;
  }
}

export {};
