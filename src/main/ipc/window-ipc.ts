import { BrowserWindow, ipcMain, type WebContents } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';

function getWindowFromSender(sender: WebContents): BrowserWindow | null {
  return BrowserWindow.fromWebContents(sender);
}

function sendMaximizeChanged(window: BrowserWindow): void {
  window.webContents.send(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, {
    isMaximized: window.isMaximized(),
  });
}

export function registerWindowIpc(): void {
  ipcMain.handle(IPC_CHANNELS.WINDOW_MINIMIZE, (event) => {
    const window = getWindowFromSender(event.sender);
    window?.minimize();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE, (event) => {
    const window = getWindowFromSender(event.sender);
    if (!window) {
      return false;
    }

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }

    return window.isMaximized();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_CLOSE, (event) => {
    const window = getWindowFromSender(event.sender);
    window?.close();
  });

  ipcMain.handle(IPC_CHANNELS.WINDOW_IS_MAXIMIZED, (event) => {
    const window = getWindowFromSender(event.sender);
    return window?.isMaximized() ?? false;
  });
}

export function attachWindowChromeListeners(window: BrowserWindow): void {
  const notify = () => sendMaximizeChanged(window);

  window.on('maximize', notify);
  window.on('unmaximize', notify);
}
