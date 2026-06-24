import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { pickDirectory } from '../services/directory-picker';
import { cancelScan, startScan } from '../services/scan-coordinator';
import { copyPathToClipboard, revealPathInExplorer } from '../services/file-actions';
import {
  validateExportOptions,
  validatePath,
  validateScanSessionId,
  validateStartScanOptions,
} from './validators';

function notImplemented(message: string): never {
  throw new Error(`Not implemented: ${message}`);
}

export function registerScanIpc(): void {
  ipcMain.handle(IPC_CHANNELS.SELECT_DIRECTORY, async () => {
    return pickDirectory();
  });

  ipcMain.handle(IPC_CHANNELS.START_SCAN, async (_event, options: unknown) => {
    const validated = validateStartScanOptions(options);
    return startScan(validated.rootPath);
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

  ipcMain.handle(IPC_CHANNELS.EXPORT_REPORT, async (_event, scanId: unknown, options: unknown) => {
    const validatedScanId = validateScanSessionId(scanId);
    const validatedOptions = validateExportOptions(options);
    notImplemented(`exportReport for ${validatedScanId} as ${validatedOptions.format}`);
  });
}

export function unregisterScanIpc(): void {
  const channels: string[] = [
    IPC_CHANNELS.SELECT_DIRECTORY,
    IPC_CHANNELS.START_SCAN,
    IPC_CHANNELS.CANCEL_SCAN,
    IPC_CHANNELS.REVEAL_PATH,
    IPC_CHANNELS.COPY_PATH,
    IPC_CHANNELS.EXPORT_REPORT,
  ];

  for (const channel of channels) {
    ipcMain.removeHandler(channel);
  }
}
