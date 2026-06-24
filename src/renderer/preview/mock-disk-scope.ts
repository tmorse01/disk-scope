import type { DiskScopeAPI, ScanProgressEvent } from '../../shared/types';

const noopUnsubscribe = () => undefined;

export function createMockDiskScope(
  overrides: Partial<DiskScopeAPI> = {},
): DiskScopeAPI {
  let progressHandler: ((event: ScanProgressEvent) => void) | undefined;

  const api: DiskScopeAPI = {
    selectDirectory: async () => ({ path: 'C:\\Users\\Demo\\Projects' }),
    startScan: async (options) => {
      const scanId = 'mock-scan-id';
      if (progressHandler) {
        window.setTimeout(() => {
          progressHandler?.({
            scanId,
            filesScanned: 42,
            directoriesScanned: 7,
            bytesDiscovered: 1024 * 1024,
            currentPath: `${options.rootPath}\\src\\main.tsx`,
            errorCount: 0,
            elapsedMs: 1200,
          });
        }, 300);
      }
      return scanId;
    },
    cancelScan: async () => undefined,
    revealPath: async () => undefined,
    copyPath: async () => undefined,
    exportReport: async () => undefined,
    onScanProgress: (callback) => {
      progressHandler = callback;
      return noopUnsubscribe;
    },
    onScanComplete: () => noopUnsubscribe,
    onScanError: () => noopUnsubscribe,
    ...overrides,
  };

  return api;
}

if (typeof window !== 'undefined' && typeof window.diskScope === 'undefined') {
  window.diskScope = createMockDiskScope();
}
