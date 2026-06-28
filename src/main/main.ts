import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow } from './browser-window';
import { registerScanIpc } from './ipc/scan-ipc';
import { registerWindowIpc } from './ipc/window-ipc';
import { initPreferencesStore } from './services/preferences-store';
import { initScanCoordinatorHistory, terminateAllScans } from './services/scan-coordinator';

if (started) {
  app.quit();
}

registerScanIpc();
registerWindowIpc();

app.on('before-quit', () => {
  terminateAllScans();
});

app.on('ready', () => {
  void (async () => {
    await initPreferencesStore();
    await initScanCoordinatorHistory();
    createMainWindow();
  })();
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
