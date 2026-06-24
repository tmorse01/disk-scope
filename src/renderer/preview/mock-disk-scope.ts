import type { DiskScopeAPI } from '../../shared/types';

const noopUnsubscribe = () => undefined;

export function createMockDiskScope(
  overrides: Partial<DiskScopeAPI> = {},
): DiskScopeAPI {
  return {
    selectDirectory: async () => ({ path: 'C:\\Users\\Demo\\Projects' }),
    startScan: async () => 'mock-scan-id',
    cancelScan: async () => undefined,
    revealPath: async () => undefined,
    copyPath: async () => undefined,
    exportReport: async () => undefined,
    onScanProgress: () => noopUnsubscribe,
    onScanComplete: () => noopUnsubscribe,
    onScanError: () => noopUnsubscribe,
    ...overrides,
  };
}

if (typeof window !== 'undefined' && typeof window.diskScope === 'undefined') {
  window.diskScope = createMockDiskScope();
}
