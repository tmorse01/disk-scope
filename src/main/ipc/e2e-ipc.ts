import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { getE2eAutostartConfig } from '../services/e2e-autostart';

export function registerE2eIpc(): void {
  ipcMain.handle(IPC_CHANNELS.GET_E2E_AUTOSTART_CONFIG, () => {
    return getE2eAutostartConfig();
  });
}

export function unregisterE2eIpc(): void {
  ipcMain.removeHandler(IPC_CHANNELS.GET_E2E_AUTOSTART_CONFIG);
}
