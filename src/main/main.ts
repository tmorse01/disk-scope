import { app, BrowserWindow } from 'electron';
import started from 'electron-squirrel-startup';
import { createMainWindow } from './browser-window';
import { registerE2eIpc } from './ipc/e2e-ipc';
import { registerScanIpc } from './ipc/scan-ipc';
import { registerUpdateIpc } from './ipc/update-ipc';
import { registerWindowIpc } from './ipc/window-ipc';
import { initPreferencesStore } from './services/preferences-store';
import { initScanCoordinatorHistory, terminateAllScans } from './services/scan-coordinator';
import { initUpdateService } from './services/update-service';

if (started) {
  app.quit();
}

registerScanIpc();
registerWindowIpc();
registerUpdateIpc();
registerE2eIpc();

app.on('before-quit', () => {
  terminateAllScans();
});

app.on('ready', () => {
  void (async () => {
    await initPreferencesStore();
    await initScanCoordinatorHistory();
    createMainWindow();

    if (!started) {
      void initUpdateService().init();
    }
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
