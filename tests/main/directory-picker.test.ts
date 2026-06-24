import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { OpenDialogReturnValue } from 'electron';

const showOpenDialog = vi.fn();

vi.mock('electron', () => ({
  dialog: {
    showOpenDialog,
  },
}));

describe('directory picker', () => {
  beforeEach(() => {
    showOpenDialog.mockReset();
  });

  it('maps cancel to null without throwing', async () => {
    const { mapOpenDialogResult } = await import('../../src/main/services/directory-picker');

    expect(
      mapOpenDialogResult({
        canceled: true,
        filePaths: [],
      } satisfies OpenDialogReturnValue),
    ).toBeNull();
  });

  it('maps an empty selection to null', async () => {
    const { mapOpenDialogResult } = await import('../../src/main/services/directory-picker');

    expect(
      mapOpenDialogResult({
        canceled: false,
        filePaths: [],
      } satisfies OpenDialogReturnValue),
    ).toBeNull();
  });

  it('returns SelectedPath shape for a chosen folder', async () => {
    const { mapOpenDialogResult } = await import('../../src/main/services/directory-picker');

    expect(
      mapOpenDialogResult({
        canceled: false,
        filePaths: ['C:\\Users\\dev\\Projects'],
      } satisfies OpenDialogReturnValue),
    ).toEqual({
      path: 'C:\\Users\\dev\\Projects',
    });
  });

  it('normalizes selected paths', async () => {
    const { normalizeSelectedPath } = await import('../../src/main/services/directory-picker');

    expect(normalizeSelectedPath('C:/Users/dev/Projects/')).toBe('C:\\Users\\dev\\Projects');
    expect(normalizeSelectedPath('C:')).toBe('C:\\');
  });

  it('uses openDirectory dialog options for drive and folder selection', async () => {
    const { getPickerDialogOptions } = await import('../../src/main/services/directory-picker');

    expect(getPickerDialogOptions()).toMatchObject({
      title: 'Select folder or drive to scan',
      buttonLabel: 'Select',
      properties: ['openDirectory'],
    });
  });

  it('returns null when the native dialog is canceled', async () => {
    showOpenDialog.mockResolvedValue({
      canceled: true,
      filePaths: [],
    } satisfies OpenDialogReturnValue);

    const { pickDirectory } = await import('../../src/main/services/directory-picker');
    await expect(pickDirectory()).resolves.toBeNull();
  });

  it('returns SelectedPath when the native dialog succeeds', async () => {
    showOpenDialog.mockResolvedValue({
      canceled: false,
      filePaths: ['D:\\Data'],
    } satisfies OpenDialogReturnValue);

    const { pickDirectory } = await import('../../src/main/services/directory-picker');
    await expect(pickDirectory()).resolves.toEqual({ path: 'D:\\Data' });
  });

  it('wraps unexpected dialog failures', async () => {
    showOpenDialog.mockRejectedValue(new Error('dialog unavailable'));

    const { pickDirectory } = await import('../../src/main/services/directory-picker');
    await expect(pickDirectory()).rejects.toThrow(
      'Failed to open folder picker: dialog unavailable',
    );
  });
});
