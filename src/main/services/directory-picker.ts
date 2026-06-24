import { dialog } from 'electron';
import type { SelectedPath } from '../../shared/types';

/**
 * Opens the native folder picker.
 * TODO(task-004): wire full picker flow and drive-root support.
 */
export async function pickDirectory(): Promise<SelectedPath | null> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return { path: result.filePaths[0] };
}
