import { dialog, type BrowserWindow, type OpenDialogOptions, type OpenDialogReturnValue } from 'electron';
import os from 'node:os';
import path from 'node:path';
import type { SelectedPath } from '../../shared/types';

/**
 * Dialog options for selecting a scan target folder or drive root.
 *
 * Windows: users can pick any folder or navigate to "This PC" and select a drive
 * letter (for example `C:\`) as the scan root. Electron's folder picker treats
 * drive letters as directories on Windows when selected from the native dialog.
 */
export function getPickerDialogOptions(): OpenDialogOptions {
  return {
    title: 'Select folder or drive to scan',
    buttonLabel: 'Select',
    properties: ['openDirectory'],
    defaultPath: getDefaultPickerPath(),
  };
}

export function getDefaultPickerPath(): string {
  if (process.platform === 'win32') {
    return process.env.USERPROFILE ?? 'C:\\';
  }

  return os.homedir();
}

export function normalizeSelectedPath(selectedPath: string): string {
  const trimmed = selectedPath.trim();
  const driveRootMatch = /^([A-Za-z]):[\\/]?$/i.exec(trimmed.replace(/[\\/]+$/, ''));

  if (driveRootMatch) {
    return `${driveRootMatch[1].toUpperCase()}:\\`;
  }

  const normalized = path.normalize(trimmed);
  return normalized.replace(/[\\/]+$/, '');
}

export function mapOpenDialogResult(result: OpenDialogReturnValue): SelectedPath | null {
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  const selectedPath = result.filePaths[0];
  if (!selectedPath) {
    return null;
  }

  return { path: normalizeSelectedPath(selectedPath) };
}

/**
 * Opens the native folder picker anchored to the requesting window when available.
 * Cancel returns `null` without throwing. Unexpected dialog failures throw.
 */
export async function pickDirectory(
  parentWindow?: BrowserWindow | null,
): Promise<SelectedPath | null> {
  try {
    const options = getPickerDialogOptions();
    const result = parentWindow
      ? await dialog.showOpenDialog(parentWindow, options)
      : await dialog.showOpenDialog(options);

    return mapOpenDialogResult(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown folder picker failure';
    throw new Error(`Failed to open folder picker: ${message}`);
  }
}
