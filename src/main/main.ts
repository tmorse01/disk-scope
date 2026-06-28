import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow } from './browser-window';
import { registerScanIpc } from './ipc/scan-ipc';
import { registerUpdateIpc } from './ipc/update-ipc';
import { registerWindowIpc } from './ipc/window-ipc';
import { initPreferencesStore } from './services/preferences-store';
import { initUpdateService } from './services/update-service';
import { terminateAllScans } from './services/scan-coordinator';

if (started) {
  app.quit();
}

registerScanIpc();
registerWindowIpc();
registerUpdateIpc();

app.on('before-quit', () => {
  terminateAllScans();
});

app.on('ready', () => {
  void initPreferencesStore();
  createMainWindow();

  if (!started) {
    void initUpdateService().init();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});
