import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IPC_CHANNELS } from '../../src/shared/ipc-channels';
import type { UpdateBackend } from '../../src/main/services/update-service';
import {
  UpdateService,
  createInitialUpdateStatus,
  initUpdateService,
  isUpdatePhase,
  resetUpdateServiceForTest,
} from '../../src/main/services/update-service';

const { send, ipcHandle } = vi.hoisted(() => {
  const send = vi.fn();
  const ipcHandle = vi.fn((_channel: string, handler: (...args: unknown[]) => unknown) => {
    (globalThis as { __ipcHandlers?: Map<string, (...args: unknown[]) => unknown> }).__ipcHandlers ??=
      new Map();
    (globalThis as { __ipcHandlers: Map<string, (...args: unknown[]) => unknown> }).__ipcHandlers.set(
      _channel,
      handler,
    );
  });

  return { send, ipcHandle };
});

vi.mock('electron', () => ({
  ipcMain: {
    handle: ipcHandle,
    removeHandler: vi.fn(),
  },
  app: {
    isPackaged: true,
    getVersion: () => '0.2.2',
  },
  BrowserWindow: {
    getAllWindows: () => [
      {
        isDestroyed: () => false,
        webContents: { send },
      },
    ],
  },
}));

vi.mock('../../src/main/services/preferences-store', () => ({
  loadPreferences: vi.fn(async () => ({
    theme: 'light',
    exclusions: [],
    confirmBeforeDelete: true,
    defaultDeleteMethod: 'recycle-bin',
    developerCleanupEnabled: false,
    autoCheckForUpdates: true,
  })),
  getPreferencesSync: vi.fn(() => ({
    theme: 'light',
    exclusions: [],
    confirmBeforeDelete: true,
    defaultDeleteMethod: 'recycle-bin',
    developerCleanupEnabled: false,
    autoCheckForUpdates: true,
  })),
}));

function createMockBackend(): UpdateBackend & {
  emit: (event: string, ...args: unknown[]) => void;
  checkForUpdates: ReturnType<typeof vi.fn>;
  quitAndInstall: ReturnType<typeof vi.fn>;
} {
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();

  const backend = {
    autoDownload: false,
    autoInstallOnAppQuit: false,
    checkForUpdates: vi.fn(async () => undefined),
    quitAndInstall: vi.fn(),
    on(event: string, listener: (...args: unknown[]) => void) {
      const bucket = listeners.get(event) ?? new Set();
      bucket.add(listener);
      listeners.set(event, bucket);
      return backend;
    },
    removeAllListeners: vi.fn(),
    emit(event: string, ...args: unknown[]) {
      for (const listener of listeners.get(event) ?? []) {
        listener(...args);
      }
    },
  };

  return backend;
}

describe('update-service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUpdateServiceForTest();
  });

  it('creates an idle status snapshot with the current version', () => {
    expect(createInitialUpdateStatus('1.2.3')).toEqual({
      phase: 'idle',
      currentVersion: '1.2.3',
      message: undefined,
      errorMessage: undefined,
    });
  });

  it('does not call the backend when disabled (dev mode)', async () => {
    const backend = createMockBackend();
    const service = new UpdateService({
      backend,
      enabled: false,
      currentVersion: '0.2.2',
    });
    service.bindBackendEvents();

    await service.checkForUpdates();

    expect(backend.checkForUpdates).not.toHaveBeenCalled();
    expect(service.getStatus()).toMatchObject({
      phase: 'idle',
      message: 'Updates are checked in installed builds only.',
    });
  });

  it('auto-checks on init when preference is enabled', async () => {
    const backend = createMockBackend();
    const service = new UpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });
    service.bindBackendEvents();

    await service.init();

    expect(backend.checkForUpdates).toHaveBeenCalledOnce();
  });

  it('maps updater events to status phases and broadcasts', async () => {
    const backend = createMockBackend();
    const service = new UpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });
    service.bindBackendEvents();

    backend.emit('checking-for-update');
    expect(service.getStatus().phase).toBe('checking');

    backend.emit('update-available', { version: '0.2.3' });
    expect(service.getStatus()).toMatchObject({
      phase: 'available',
      availableVersion: '0.2.3',
    });

    backend.emit('download-progress', { percent: 42.6 });
    expect(service.getStatus()).toMatchObject({
      phase: 'downloading',
      downloadPercent: 43,
    });

    backend.emit('update-downloaded', { version: '0.2.3' });
    expect(service.getStatus()).toMatchObject({
      phase: 'ready',
      availableVersion: '0.2.3',
      downloadPercent: 100,
    });

    expect(send).toHaveBeenCalled();
    expect(send.mock.calls.at(-1)?.[0]).toBe(IPC_CHANNELS.UPDATE_STATUS);
  });

  it('reports up-to-date when no update is available', () => {
    const backend = createMockBackend();
    const service = new UpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });
    service.bindBackendEvents();

    backend.emit('update-not-available', { version: '0.2.2' });

    expect(service.getStatus()).toMatchObject({
      phase: 'up-to-date',
      message: 'You are on the latest version.',
      lastCheckedAt: expect.any(String),
    });
  });

  it('installUpdate calls quitAndInstall only when ready', () => {
    const backend = createMockBackend();
    const service = new UpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });
    service.bindBackendEvents();

    service.installUpdate();
    expect(backend.quitAndInstall).not.toHaveBeenCalled();

    backend.emit('update-downloaded', { version: '0.2.3' });
    service.installUpdate();

    expect(backend.quitAndInstall).toHaveBeenCalledWith(false, true);
  });

  it('registers ipc handlers via initUpdateService singleton', async () => {
    const backend = createMockBackend();
    const service = initUpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });

    await service.checkForUpdates();
    expect(backend.checkForUpdates).toHaveBeenCalledOnce();
  });

  it('validates update phases', () => {
    expect(isUpdatePhase('ready')).toBe(true);
    expect(isUpdatePhase('unknown')).toBe(false);
  });
});

describe('update-ipc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetUpdateServiceForTest();
    (globalThis as { __ipcHandlers?: Map<string, (...args: unknown[]) => unknown> }).__ipcHandlers =
      new Map();
  });

  async function invoke(channel: string) {
    const handler = (
      globalThis as { __ipcHandlers: Map<string, (...args: unknown[]) => unknown> }
    ).__ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler for ${channel}`);
    }
    return handler();
  }

  it('registers check, status, and install handlers', async () => {
    const backend = createMockBackend();
    initUpdateService({
      backend,
      enabled: true,
      currentVersion: '0.2.2',
    });

    const { registerUpdateIpc } = await import('../../src/main/ipc/update-ipc');

    registerUpdateIpc();

    await invoke(IPC_CHANNELS.CHECK_FOR_UPDATES);
    expect(backend.checkForUpdates).toHaveBeenCalledOnce();

    const status = await invoke(IPC_CHANNELS.GET_UPDATE_STATUS);
    expect(status).toMatchObject({ currentVersion: '0.2.2', phase: 'idle' });

    backend.emit('update-downloaded', { version: '0.2.3' });
    await invoke(IPC_CHANNELS.INSTALL_UPDATE);
    expect(backend.quitAndInstall).toHaveBeenCalledWith(false, true);
  });
});
