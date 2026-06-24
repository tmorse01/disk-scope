import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow } from './browser-window';
import { registerScanIpc } from './ipc/scan-ipc';

if (started) {
  app.quit();
}

registerScanIpc();

app.on('ready', () => {
  createMainWindow();
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
