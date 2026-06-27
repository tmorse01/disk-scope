import { BrowserWindow } from 'electron';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { brandColors } from '../shared/branding';
import { attachWindowChromeListeners } from './ipc/window-ipc';

function resolveWindowIcon(): string | undefined {
  const fileName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
  const iconPath = path.join(__dirname, '../../assets', fileName);
  return existsSync(iconPath) ? iconPath : undefined;
}

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 800;
const MIN_WIDTH = 960;
const MIN_HEIGHT = 640;

const USE_CUSTOM_WINDOW_FRAME = process.platform === 'win32';

export function createMainWindow(): BrowserWindow {
  const windowIcon = resolveWindowIcon();

  const mainWindow = new BrowserWindow({
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    show: false,
    ...(windowIcon ? { icon: windowIcon } : {}),
    ...(USE_CUSTOM_WINDOW_FRAME
      ? {
          frame: false,
          autoHideMenuBar: true,
          backgroundColor: brandColors.backgroundLight,
        }
      : {}),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
    },
  });

  if (USE_CUSTOM_WINDOW_FRAME) {
    attachWindowChromeListeners(mainWindow);
  }

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));

  mainWindow.webContents.on('will-navigate', (event) => {
    event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  return mainWindow;
}
