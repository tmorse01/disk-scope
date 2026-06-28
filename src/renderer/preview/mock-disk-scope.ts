import type {
  AppPreferences,
  DiskScopeAPI,
  ScanProgressEvent,
  UpdateStatusSnapshot,
  WindowControlsAPI,
} from '../../shared/types';
import { ok } from '../../shared/result';

const noopUnsubscribe = () => undefined;

const mockWindowControls: WindowControlsAPI = {
  minimize: async () => undefined,
  toggleMaximize: async () => false,
  close: async () => undefined,
  isMaximized: async () => false,
  onMaximizeChanged: () => noopUnsubscribe,
};

const mockPreferences: AppPreferences = {
  theme: 'light',
  exclusions: [],
  confirmBeforeDelete: true,
  defaultDeleteMethod: 'recycle-bin',
  developerCleanupEnabled: false,
  autoCheckForUpdates: true,
};

const mockUpdateStatus: UpdateStatusSnapshot = {
  phase: 'idle',
  currentVersion: '0.0.0-preview',
  message: 'Updates are checked in installed builds only.',
};

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
      return { scanId };
    },
    cancelScan: async () => undefined,
    revealPath: async () => undefined,
    copyPath: async () => undefined,
    listDirectoryContents: async () =>
      ok([
        {
          name: 'example.txt',
          path: 'C:\\Users\\Demo\\Projects\\example.txt',
          kind: 'file',
          sizeBytes: 2048,
          modifiedAt: new Date().toISOString(),
        },
        {
          name: 'node_modules',
          path: 'C:\\Users\\Demo\\Projects\\node_modules',
          kind: 'directory',
          sizeBytes: 1024 * 1024 * 48,
          modifiedAt: new Date().toISOString(),
        },
      ]),
    deletePath: async () => ok(undefined),
    exportReport: async () => undefined,
    getPreferences: async () => ({
      theme: mockPreferences.theme,
      exclusions: mockPreferences.exclusions.map((entry) => ({ ...entry })),
      confirmBeforeDelete: mockPreferences.confirmBeforeDelete,
      defaultDeleteMethod: mockPreferences.defaultDeleteMethod,
      developerCleanupEnabled: mockPreferences.developerCleanupEnabled,
      autoCheckForUpdates: mockPreferences.autoCheckForUpdates,
    }),
    setPreferences: async (preferences) => {
      mockPreferences.theme = preferences.theme;
      mockPreferences.exclusions = preferences.exclusions.map((entry) => ({ ...entry }));
      mockPreferences.confirmBeforeDelete = preferences.confirmBeforeDelete;
      mockPreferences.defaultDeleteMethod = preferences.defaultDeleteMethod;
      mockPreferences.developerCleanupEnabled = preferences.developerCleanupEnabled;
      mockPreferences.autoCheckForUpdates = preferences.autoCheckForUpdates;
      return {
        theme: mockPreferences.theme,
        exclusions: mockPreferences.exclusions.map((entry) => ({ ...entry })),
        confirmBeforeDelete: mockPreferences.confirmBeforeDelete,
        defaultDeleteMethod: mockPreferences.defaultDeleteMethod,
        developerCleanupEnabled: mockPreferences.developerCleanupEnabled,
        autoCheckForUpdates: mockPreferences.autoCheckForUpdates,
      };
    },
    onScanProgress: (callback) => {
      progressHandler = callback;
      return noopUnsubscribe;
    },
    onScanComplete: () => noopUnsubscribe,
    onScanError: () => noopUnsubscribe,
    updates: {
      checkForUpdates: async () => undefined,
      installUpdate: async () => undefined,
      getUpdateStatus: async () => ({ ...mockUpdateStatus }),
      onUpdateStatus: () => noopUnsubscribe,
    },
    windowControls: mockWindowControls,
    ...overrides,
  };

  return api;
}

if (typeof window !== 'undefined' && typeof window.diskScope === 'undefined') {
  window.diskScope = createMockDiskScope();
}
