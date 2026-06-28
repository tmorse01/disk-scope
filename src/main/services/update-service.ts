import { app, BrowserWindow } from 'electron';
import { IPC_CHANNELS } from '../../shared/ipc-channels';
import type { UpdatePhase, UpdateStatusSnapshot } from '../../shared/types';
import { getPreferencesSync, loadPreferences } from './preferences-store';

export type UpdateBackendEvents =
  | 'checking-for-update'
  | 'update-available'
  | 'update-not-available'
  | 'download-progress'
  | 'update-downloaded'
  | 'error';

export type UpdateBackend = {
  checkForUpdates(): Promise<void>;
  quitAndInstall(isSilent?: boolean, isForceRunAfter?: boolean): void;
  on(event: UpdateBackendEvents, listener: (...args: unknown[]) => void): UpdateBackend;
  autoDownload: boolean;
  autoInstallOnAppQuit: boolean;
};

const DEV_MODE_MESSAGE = 'Updates are checked in installed builds only.';

function broadcastUpdateStatus(snapshot: UpdateStatusSnapshot): void {
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) {
      window.webContents.send(IPC_CHANNELS.UPDATE_STATUS, snapshot);
    }
  }
}

export function createInitialUpdateStatus(currentVersion: string): UpdateStatusSnapshot {
  return {
    phase: 'idle',
    currentVersion,
    message: undefined,
    errorMessage: undefined,
  };
}

export class UpdateService {
  private snapshot: UpdateStatusSnapshot;
  private readonly backend: UpdateBackend | null;
  private readonly enabled: boolean;

  constructor(options: { backend: UpdateBackend | null; enabled: boolean; currentVersion: string }) {
    this.backend = options.backend;
    this.enabled = options.enabled;
    this.snapshot = createInitialUpdateStatus(options.currentVersion);
  }

  bindBackendEvents(): void {
    if (!this.backend) {
      return;
    }

    this.backend.autoDownload = true;
    this.backend.autoInstallOnAppQuit = false;

    this.backend.on('checking-for-update', () => {
      this.patchStatus({
        phase: 'checking',
        message: 'Checking for updates…',
        errorMessage: undefined,
      });
    });

    this.backend.on('update-available', (info: unknown) => {
      const version =
        info && typeof info === 'object' && typeof (info as { version?: unknown }).version === 'string'
          ? (info as { version: string }).version
          : undefined;

      this.patchStatus({
        phase: 'available',
        availableVersion: version,
        message: version ? `Update ${version} is available. Downloading…` : 'Update available. Downloading…',
        errorMessage: undefined,
      });
    });

    this.backend.on('update-not-available', (info: unknown) => {
      const version =
        info && typeof info === 'object' && typeof (info as { version?: unknown }).version === 'string'
          ? (info as { version: string }).version
          : undefined;

      this.patchStatus({
        phase: 'up-to-date',
        availableVersion: version,
        lastCheckedAt: new Date().toISOString(),
        downloadPercent: undefined,
        message: 'You are on the latest version.',
        errorMessage: undefined,
      });
    });

    this.backend.on('download-progress', (progress: unknown) => {
      const percent =
        progress &&
        typeof progress === 'object' &&
        typeof (progress as { percent?: unknown }).percent === 'number'
          ? Math.round((progress as { percent: number }).percent)
          : undefined;

      this.patchStatus({
        phase: 'downloading',
        downloadPercent: percent,
        message:
          percent !== undefined ? `Downloading update… ${percent}%` : 'Downloading update…',
        errorMessage: undefined,
      });
    });

    this.backend.on('update-downloaded', (info: unknown) => {
      const version =
        info && typeof info === 'object' && typeof (info as { version?: unknown }).version === 'string'
          ? (info as { version: string }).version
          : this.snapshot.availableVersion;

      this.patchStatus({
        phase: 'ready',
        availableVersion: version,
        downloadPercent: 100,
        message: version
          ? `Update ${version} is ready. Restart to install.`
          : 'Update is ready. Restart to install.',
        errorMessage: undefined,
      });
    });

    this.backend.on('error', (error: unknown) => {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Could not check for updates. Try again later.';

      this.patchStatus({
        phase: 'error',
        lastCheckedAt: new Date().toISOString(),
        message: 'Update check failed.',
        errorMessage,
      });
    });
  }

  async init(): Promise<void> {
    if (!this.enabled || !this.backend) {
      return;
    }

    await loadPreferences();

    if (getPreferencesSync().autoCheckForUpdates) {
      await this.checkForUpdates();
    }
  }

  getStatus(): UpdateStatusSnapshot {
    return { ...this.snapshot };
  }

  async checkForUpdates(): Promise<void> {
    if (!this.enabled || !this.backend) {
      this.patchStatus({
        phase: 'idle',
        message: DEV_MODE_MESSAGE,
        errorMessage: undefined,
      });
      return;
    }

    try {
      await this.backend.checkForUpdates();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not check for updates.';
      this.patchStatus({
        phase: 'error',
        lastCheckedAt: new Date().toISOString(),
        message: 'Update check failed.',
        errorMessage,
      });
    }
  }

  installUpdate(): void {
    if (!this.enabled || !this.backend || this.snapshot.phase !== 'ready') {
      return;
    }

    this.backend.quitAndInstall(false, true);
  }

  private patchStatus(partial: Partial<UpdateStatusSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...partial };
    broadcastUpdateStatus(this.getStatus());
  }
}

let updateService: UpdateService | null = null;

export function createProductionUpdateBackend(): UpdateBackend | null {
  if (!app.isPackaged) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { autoUpdater } = require('electron-updater') as {
    autoUpdater: UpdateBackend;
  };

  return autoUpdater;
}

export function initUpdateService(options?: {
  backend?: UpdateBackend | null;
  enabled?: boolean;
  currentVersion?: string;
}): UpdateService {
  if (!updateService) {
    updateService = new UpdateService({
      backend: options?.backend ?? createProductionUpdateBackend(),
      enabled: options?.enabled ?? app.isPackaged,
      currentVersion: options?.currentVersion ?? app.getVersion(),
    });
    updateService.bindBackendEvents();
  }

  return updateService;
}

export function getUpdateService(): UpdateService {
  return updateService ?? initUpdateService();
}

export function resetUpdateServiceForTest(): void {
  updateService = null;
}

export function isUpdatePhase(value: string): value is UpdatePhase {
  return (
    value === 'idle' ||
    value === 'checking' ||
    value === 'available' ||
    value === 'downloading' ||
    value === 'ready' ||
    value === 'up-to-date' ||
    value === 'error'
  );
}
