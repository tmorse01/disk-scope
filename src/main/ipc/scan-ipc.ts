import { BrowserWindow, ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { pickDirectory } from '../services/directory-picker';
import { exportScanReport } from '../services/report-exporter';
import {
  cancelScan,
  getCompletedScanResult,
  getProtectedScanRootPaths,
  startScan,
} from '../services/scan-coordinator';
import {
  copyPathToClipboard,
  deletePath,
  listDirectoryContents,
  revealPathInExplorer,
} from '../services/file-actions';
import { getPreferencesSync, loadPreferences, savePreferences } from '../services/preferences-store';
import {
  buildScanHistoryHydrationPayload,
  saveLastSelectedPaths as persistLastSelectedPaths,
} from '../services/scan-history-store';
import {
  validateAppPreferences,
  validateDeletePathOptions,
  validateExportOptions,
  validatePath,
  validateScanSessionId,
  validateStartScanOptions,
  validateStringArray,
} from './validators';

export function registerScanIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async (event) => {
    const parentWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow();
    return pickDirectory(parentWindow);
  });

  ipcMain.handle(IPC_CHANNELS.START_SCAN, async (_event, options: unknown) => {
    const validated = validateStartScanOptions(options);
    return startScan(validated);
  });

  ipcMain.handle(IPC_CHANNELS.CANCEL_SCAN, async (_event, scanId: unknown) => {
    const validated = validateScanSessionId(scanId);
    cancelScan(validated);
  });

  ipcMain.handle(IPC_CHANNELS.REVEAL_PATH, async (_event, path: unknown) => {
    const validated = validatePath(path);
    await revealPathInExplorer(validated);
  });

  ipcMain.handle(IPC_CHANNELS.COPY_PATH, async (_event, path: unknown) => {
    const validated = validatePath(path);
    await copyPathToClipboard(validated);
  });

  ipcMain.handle(IPC_CHANNELS.LIST_DIRECTORY_CONTENTS, async (_event, dirPath: unknown) => {
    const validated = validatePath(dirPath);
    return listDirectoryContents(validated);
  });

  ipcMain.handle(IPC_CHANNELS.DELETE_PATH, async (_event, options: unknown) => {
    const validated = validateDeletePathOptions(options);
    return deletePath(validated.path, validated.method, getProtectedScanRootPaths());
  });

  ipcMain.handle(IPC_CHANNELS.EXPORT_REPORT, async (event, scanId: unknown, options: unknown) => {
    const validatedScanId = validateScanSessionId(scanId);
    const validatedOptions = validateExportOptions(options);
    const result = getCompletedScanResult(validatedScanId);
    if (!result) {
      throw new Error('No completed scan found for export');
    }

    const parentWindow =
      BrowserWindow.fromWebContents(event.sender) ?? BrowserWindow.getFocusedWindow();
    await exportScanReport(parentWindow, result, validatedOptions.format);
  });

  ipcMain.handle(IPC_CHANNELS.GET_PREFERENCES, async () => {
    await loadPreferences();
    return getPreferencesSync();
  });

  ipcMain.handle(IPC_CHANNELS.SET_PREFERENCES, async (_event, preferences: unknown) => {
    const validated = validateAppPreferences(preferences);
    return savePreferences(validated);
  });

  ipcMain.handle(IPC_CHANNELS.GET_SCAN_HISTORY, async () => {
    return buildScanHistoryHydrationPayload();
  });

  ipcMain.handle(IPC_CHANNELS.SAVE_LAST_SELECTED_PATHS, async (_event, paths: unknown) => {
    const validated = validateStringArray(paths);
    await persistLastSelectedPaths(validated);
  });
}

export function unregisterScanIpc(): void {
  const channels: string[] = [
    IPC_CHANNELS.SELECT_DIRECTORY,
    IPC_CHANNELS.START_SCAN,
    IPC_CHANNELS.CANCEL_SCAN,
    IPC_CHANNELS.REVEAL_PATH,
    IPC_CHANNELS.COPY_PATH,
    IPC_CHANNELS.LIST_DIRECTORY_CONTENTS,
    IPC_CHANNELS.DELETE_PATH,
    IPC_CHANNELS.EXPORT_REPORT,
    IPC_CHANNELS.GET_PREFERENCES,
    IPC_CHANNELS.SET_PREFERENCES,
    IPC_CHANNELS.GET_SCAN_HISTORY,
    IPC_CHANNELS.SAVE_LAST_SELECTED_PATHS,
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}
