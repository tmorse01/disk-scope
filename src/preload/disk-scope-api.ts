import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type {
  AppPreferences,
  DiskScopeAPI,
  ExportOptions,
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanProgressEvent,
  ScanSessionId,
  DeletePathOptions,
  SelectedPath,
  StartScanOptions,
  StartScanResponse,
  Unsubscribe,
} from '../shared/types';

function createEventSubscription<T>(
  channel: string,
  callback: (event: T) => void,
): Unsubscribe {
  const listener = (_event: IpcRendererEvent, payload: T) => {
    callback(payload);
  };

  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

const diskScopeAPI: DiskScopeAPI = {
  selectDirectory: (): Promise<SelectedPath | null> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SELECT_DIRECTORY);
  },

  startScan: (options: StartScanOptions): Promise<StartScanResponse> => {
    return ipcRenderer.invoke(IPC_CHANNELS.START_SCAN, options);
  },

  cancelScan: (scanId: ScanSessionId): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.CANCEL_SCAN, scanId);
  },

  revealPath: (path: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.REVEAL_PATH, path);
  },

  copyPath: (path: string): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.COPY_PATH, path);
  },

  listDirectoryContents: (dirPath: string) => {
    return ipcRenderer.invoke(IPC_CHANNELS.LIST_DIRECTORY_CONTENTS, dirPath);
  },

  deletePath: (options: DeletePathOptions) => {
    return ipcRenderer.invoke(IPC_CHANNELS.DELETE_PATH, options);
  },

  exportReport: (scanId: ScanSessionId, options: ExportOptions): Promise<void> => {
    return ipcRenderer.invoke(IPC_CHANNELS.EXPORT_REPORT, scanId, options);
  },

  getPreferences: (): Promise<AppPreferences> => {
    return ipcRenderer.invoke(IPC_CHANNELS.GET_PREFERENCES);
  },

  setPreferences: (preferences: AppPreferences): Promise<AppPreferences> => {
    return ipcRenderer.invoke(IPC_CHANNELS.SET_PREFERENCES, preferences);
  },

  onScanProgress: (callback: (event: ScanProgressEvent) => void): Unsubscribe => {
    return createEventSubscription(IPC_CHANNELS.SCAN_PROGRESS, callback);
  },

  onScanComplete: (callback: (event: ScanCompleteEvent) => void): Unsubscribe => {
    return createEventSubscription(IPC_CHANNELS.SCAN_COMPLETE, callback);
  },

  onScanError: (callback: (event: ScanErrorEvent) => void): Unsubscribe => {
    return createEventSubscription(IPC_CHANNELS.SCAN_ERROR, callback);
  },
};

contextBridge.exposeInMainWorld('diskScope', diskScopeAPI);
