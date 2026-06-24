import { clipboard, shell } from 'electron';

/**
 * Reveal a path in the OS file explorer.
 * TODO(task-007): expand error handling for missing paths.
 */
export async function revealPathInExplorer(path: string): Promise<void> {
  await shell.showItemInFolder(path);
}

/**
 * Copy a path string to the clipboard.
 */
export async function copyPathToClipboard(path: string): Promise<void> {
  clipboard.writeText(path);
}
