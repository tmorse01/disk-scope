import { ipcMain } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import { getUpdateService } from '../services/update-service';

export function registerUpdateIpc(): void {
  ipcMain.handle(IPC_CHANNELS.CHECK_FOR_UPDATES, async () => {
    await getUpdateService().checkForUpdates();
  });

  ipcMain.handle(IPC_CHANNELS.INSTALL_UPDATE, async () => {
    getUpdateService().installUpdate();
  });

  ipcMain.handle(IPC_CHANNELS.GET_UPDATE_STATUS, async () => {
    return getUpdateService().getStatus();
  });
}

export function unregisterUpdateIpc(): void {
  for (const channel of [
    IPC_CHANNELS.CHECK_FOR_UPDATES,
    IPC_CHANNELS.INSTALL_UPDATE,
    IPC_CHANNELS.GET_UPDATE_STATUS,
  ]) {
    ipcMain.removeHandler(channel);
  }
}
