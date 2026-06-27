import { beforeEach, describe, expect, it, vi } from 'vitest';

const minimize = vi.fn();
const maximize = vi.fn();
const unmaximize = vi.fn();
const close = vi.fn();
const isMaximized = vi.fn(() => false);
const send = vi.fn();
const on = vi.fn();

const mockWindow = {
  minimize,
  maximize,
  unmaximize,
  close,
  isMaximized,
  webContents: { send },
  on,
};

vi.mock('electron', () => ({
  ipcMain: {
    handle: vi.fn((_channel: string, handler: (event: { sender: unknown }) => unknown) => {
      (globalThis as { __ipcHandlers?: Map<string, (event: { sender: unknown }) => unknown> }).__ipcHandlers ??=
        new Map();
      (globalThis as { __ipcHandlers: Map<string, (event: { sender: unknown }) => unknown> }).__ipcHandlers.set(
        _channel,
        handler,
      );
    }),
  },
  BrowserWindow: {
    fromWebContents: vi.fn(() => mockWindow),
  },
}));

describe('window-ipc', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isMaximized.mockReturnValue(false);
    (globalThis as { __ipcHandlers?: Map<string, (event: { sender: unknown }) => unknown> }).__ipcHandlers =
      new Map();
  });

  async function invoke(channel: string) {
    const handler = (
      globalThis as { __ipcHandlers: Map<string, (event: { sender: unknown }) => unknown> }
    ).__ipcHandlers.get(channel);
    if (!handler) {
      throw new Error(`No handler for ${channel}`);
    }
    return handler({ sender: {} });
  }

  it('registers handlers and minimizes the window', async () => {
    const { registerWindowIpc } = await import('../../src/main/ipc/window-ipc');
    const { IPC_CHANNELS } = await import('../../src/shared/ipc-channels');

    registerWindowIpc();

    await invoke(IPC_CHANNELS.WINDOW_MINIMIZE);
    expect(minimize).toHaveBeenCalledOnce();
  });

  it('toggles maximize state', async () => {
    const { registerWindowIpc } = await import('../../src/main/ipc/window-ipc');
    const { IPC_CHANNELS } = await import('../../src/shared/ipc-channels');

    registerWindowIpc();

    await invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE);
    expect(maximize).toHaveBeenCalledOnce();

    isMaximized.mockReturnValue(true);
    await invoke(IPC_CHANNELS.WINDOW_TOGGLE_MAXIMIZE);
    expect(unmaximize).toHaveBeenCalledOnce();
  });

  it('closes the window and reports maximize state', async () => {
    const { registerWindowIpc } = await import('../../src/main/ipc/window-ipc');
    const { IPC_CHANNELS } = await import('../../src/shared/ipc-channels');

    registerWindowIpc();

    await invoke(IPC_CHANNELS.WINDOW_CLOSE);
    expect(close).toHaveBeenCalledOnce();

    isMaximized.mockReturnValue(true);
    await expect(invoke(IPC_CHANNELS.WINDOW_IS_MAXIMIZED)).resolves.toBe(true);
  });

  it('notifies renderer on maximize changes', async () => {
    const { attachWindowChromeListeners } = await import('../../src/main/ipc/window-ipc');
    const { IPC_CHANNELS } = await import('../../src/shared/ipc-channels');

    attachWindowChromeListeners(mockWindow as never);

    expect(on).toHaveBeenCalledWith('maximize', expect.any(Function));
    expect(on).toHaveBeenCalledWith('unmaximize', expect.any(Function));

    const maximizeHandler = on.mock.calls.find(([event]) => event === 'maximize')?.[1] as () => void;
    isMaximized.mockReturnValue(true);
    maximizeHandler();

    expect(send).toHaveBeenCalledWith(IPC_CHANNELS.WINDOW_MAXIMIZE_CHANGED, { isMaximized: true });
  });
});
