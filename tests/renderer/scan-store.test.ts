import { beforeEach, describe, expect, it, vi } from 'vitest';

const selectDirectory = vi.fn<[], Promise<{ path: string } | null>>();

describe('scan store picker flow', () => {
  beforeEach(async () => {
    vi.resetModules();
    selectDirectory.mockReset();

    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: {
        diskScope: {
          selectDirectory,
        },
      },
    });

    const { scanStore } = await import('../../src/renderer/stores/scan-store');
    scanStore.status = 'idle';
    scanStore.selectedPath = null;
    scanStore.pickerError = null;
  });

  it('stores the selected path and returns to idle', async () => {
    selectDirectory.mockResolvedValue({ path: 'C:\\Projects\\disk-scope' });

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();

    expect(selectDirectory).toHaveBeenCalledOnce();
    expect(scanStore.selectedPath).toBe('C:\\Projects\\disk-scope');
    expect(scanStore.status).toBe('idle');
    expect(scanStore.pickerError).toBeNull();
  });

  it('leaves selected path empty when the picker is canceled', async () => {
    selectDirectory.mockResolvedValue(null);

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();

    expect(scanStore.selectedPath).toBeNull();
    expect(scanStore.status).toBe('idle');
    expect(scanStore.pickerError).toBeNull();
  });

  it('uses selecting-target while the native picker is open', async () => {
    let resolvePicker: ((value: { path: string } | null) => void) | undefined;
    selectDirectory.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolvePicker = resolve;
        }),
    );

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');
    const pending = pickScanTarget();

    expect(scanStore.status).toBe('selecting-target');

    resolvePicker?.({ path: 'E:\\Archive' });
    await pending;

    expect(scanStore.status).toBe('idle');
    expect(scanStore.selectedPath).toBe('E:\\Archive');
  });

  it('records picker failures without changing status to failed', async () => {
    selectDirectory.mockRejectedValue(new Error('IPC unavailable'));

    const { pickScanTarget, scanStore } = await import('../../src/renderer/stores/scan-store');

    await pickScanTarget();

    expect(scanStore.selectedPath).toBeNull();
    expect(scanStore.status).toBe('idle');
    expect(scanStore.pickerError).toBe('IPC unavailable');
  });
});
