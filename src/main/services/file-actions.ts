import fs from 'node:fs/promises';
import path from 'node:path';
import { clipboard, shell } from 'electron';
import { normalizePath } from '../../scanner/path-utils';
import type {
  DeleteMethod,
  DirectoryListingEntry,
  FileActionError,
} from '../../shared/types';
import type { Result } from '../../shared/result';
import { err, ok } from '../../shared/result';

function toFileActionError(error: unknown): FileActionError {
  if (error && typeof error === 'object' && 'code' in error) {
    const nodeError = error as NodeJS.ErrnoException;
    const code = nodeError.code ?? 'UNKNOWN';

    switch (code) {
      case 'ENOENT':
        return { code: 'NOT_FOUND', message: nodeError.message || 'Path not found' };
      case 'EACCES':
      case 'EPERM':
        return { code: 'ACCESS_DENIED', message: nodeError.message || 'Access denied' };
      default:
        return { code, message: nodeError.message || 'File action failed' };
    }
  }

  if (error instanceof Error) {
    return { code: 'UNKNOWN', message: error.message };
  }

  return { code: 'UNKNOWN', message: 'File action failed' };
}

function compareListingEntries(a: DirectoryListingEntry, b: DirectoryListingEntry): number {
  if (a.kind !== b.kind) {
    return a.kind === 'directory' ? -1 : 1;
  }

  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
}

function isProtectedPath(targetPath: string, protectedRootPaths: string[]): boolean {
  const normalizedTarget = normalizePath(targetPath);
  return protectedRootPaths.some((rootPath) => normalizePath(rootPath) === normalizedTarget);
}

export async function revealPathInExplorer(filePath: string): Promise<void> {
  await shell.showItemInFolder(filePath);
}

export async function copyPathToClipboard(filePath: string): Promise<void> {
  clipboard.writeText(filePath);
}

export async function listDirectoryContents(
  dirPath: string,
): Promise<Result<DirectoryListingEntry[], FileActionError>> {
  const normalizedDir = normalizePath(dirPath);

  try {
    const dirents = await fs.readdir(normalizedDir, { withFileTypes: true });
    const entries: DirectoryListingEntry[] = [];

    for (const dirent of dirents) {
      const entryPath = path.join(normalizedDir, dirent.name);

      let stat;
      try {
        stat = await fs.lstat(entryPath);
      } catch (error) {
        return err(toFileActionError(error));
      }

      if (stat.isSymbolicLink()) {
        continue;
      }

      const kind = stat.isDirectory() ? 'directory' : 'file';
      const entry: DirectoryListingEntry = {
        name: dirent.name,
        path: entryPath,
        kind,
        sizeBytes: kind === 'file' ? stat.size : 0,
      };

      if (stat.mtime) {
        entry.modifiedAt = stat.mtime.toISOString();
      }

      entries.push(entry);
    }

    entries.sort(compareListingEntries);
    return ok(entries);
  } catch (error) {
    return err(toFileActionError(error));
  }
}

export async function deletePath(
  targetPath: string,
  method: DeleteMethod,
  protectedRootPaths: string[],
): Promise<Result<void, FileActionError>> {
  const normalizedPath = normalizePath(targetPath);

  if (isProtectedPath(normalizedPath, protectedRootPaths)) {
    return err({
      code: 'PROTECTED_PATH',
      message: 'Cannot delete a protected scan root path',
    });
  }

  try {
    if (method === 'recycle-bin') {
      await shell.trashItem(normalizedPath);
      return ok(undefined);
    }

    const stat = await fs.lstat(normalizedPath);
    if (stat.isDirectory()) {
      await fs.rm(normalizedPath, { recursive: true, force: true });
    } else {
      await fs.rm(normalizedPath, { force: true });
    }

    return ok(undefined);
  } catch (error) {
    return err(toFileActionError(error));
  }
}
