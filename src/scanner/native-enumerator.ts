import type { Dirent } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { DirectoryEntry, ReadDirFn } from './scan-types';

export type NativeEnumeratorStatus = 'native' | 'typescript' | 'unavailable';

type NativeModuleShape = {
  readDirectory: (dirPath: string) => DirectoryEntry[];
};

let cachedNativeReadDirectory: ReadDirFn | null | undefined;
let cachedStatus: NativeEnumeratorStatus | undefined;
let loggedEnumeratorChoice = false;

function mapNativeEntry(raw: {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  sizeBytes: number;
  mtimeMs?: number | null;
}): DirectoryEntry {
  return {
    name: raw.name,
    path: raw.path,
    isDirectory: raw.isDirectory,
    isSymlink: raw.isSymlink,
    sizeBytes: raw.sizeBytes,
    mtimeMs: raw.mtimeMs ?? undefined,
  };
}

function loadNativeModule(): NativeModuleShape | null {
  if (process.platform !== 'win32') {
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const native = require('@diskscope/scanner-win') as NativeModuleShape;
    if (typeof native.readDirectory !== 'function') {
      return null;
    }
    return native;
  } catch {
    return null;
  }
}

export function tryLoadNativeReadDirectory(): ReadDirFn | null {
  if (cachedNativeReadDirectory !== undefined) {
    return cachedNativeReadDirectory;
  }

  const native = loadNativeModule();
  if (!native) {
    cachedNativeReadDirectory = null;
    cachedStatus = process.platform === 'win32' ? 'unavailable' : 'typescript';
    return null;
  }

  cachedNativeReadDirectory = async (dirPath: string): Promise<DirectoryEntry[]> => {
    const entries = native.readDirectory(dirPath);
    return entries.map(mapNativeEntry);
  };
  cachedStatus = 'native';
  return cachedNativeReadDirectory;
}

export function getNativeEnumeratorStatus(): NativeEnumeratorStatus {
  if (cachedStatus === undefined) {
    tryLoadNativeReadDirectory();
  }
  return cachedStatus ?? 'typescript';
}

export function resolveReadDirectory(override?: ReadDirFn): ReadDirFn {
  if (override) {
    return override;
  }

  const native = tryLoadNativeReadDirectory();
  const reader = native ?? readDirectoryTypeScript;

  if (!loggedEnumeratorChoice) {
    const label =
      native !== null ? 'native (FindFirstFileEx)' : 'typescript (readdir+lstat fallback)';
    console.log(`[scanner] directory enumerator: ${label}`);
    loggedEnumeratorChoice = true;
  }

  return reader;
}

export async function readDirectoryTypeScript(dirPath: string): Promise<DirectoryEntry[]> {
  const dirents = await fs.readdir(dirPath, { withFileTypes: true });
  const entries: DirectoryEntry[] = [];

  for (const dirent of dirents) {
    const mapped = await mapDirentToDirectoryEntry(dirPath, dirent);
    if (mapped) {
      entries.push(mapped);
    }
  }

  return entries;
}

async function mapDirentToDirectoryEntry(
  dirPath: string,
  dirent: Dirent,
): Promise<DirectoryEntry | null> {
  const entryPath = path.join(dirPath, dirent.name);

  if (dirent.isSymbolicLink()) {
    return {
      name: dirent.name,
      path: entryPath,
      isDirectory: false,
      isSymlink: true,
      sizeBytes: 0,
    };
  }

  if (dirent.isDirectory()) {
    return {
      name: dirent.name,
      path: entryPath,
      isDirectory: true,
      isSymlink: false,
      sizeBytes: 0,
    };
  }

  if (dirent.isFile()) {
    try {
      const entryStat = await fs.lstat(entryPath);
      if (entryStat.isSymbolicLink()) {
        return {
          name: dirent.name,
          path: entryPath,
          isDirectory: false,
          isSymlink: true,
          sizeBytes: 0,
        };
      }
      if (!entryStat.isFile()) {
        return null;
      }
      return {
        name: dirent.name,
        path: entryPath,
        isDirectory: false,
        isSymlink: false,
        sizeBytes: entryStat.size,
        mtimeMs: entryStat.mtimeMs,
      };
    } catch {
      return null;
    }
  }

  try {
    const entryStat = await fs.lstat(entryPath);
    if (entryStat.isSymbolicLink()) {
      return {
        name: dirent.name,
        path: entryPath,
        isDirectory: false,
        isSymlink: true,
        sizeBytes: 0,
      };
    }
    if (entryStat.isDirectory()) {
      return {
        name: dirent.name,
        path: entryPath,
        isDirectory: true,
        isSymlink: false,
        sizeBytes: 0,
      };
    }
    if (entryStat.isFile()) {
      return {
        name: dirent.name,
        path: entryPath,
        isDirectory: false,
        isSymlink: false,
        sizeBytes: entryStat.size,
        mtimeMs: entryStat.mtimeMs,
      };
    }
  } catch {
    return null;
  }

  return null;
}

/** Reset module-level caches (tests only). */
export function resetNativeEnumeratorCacheForTests(): void {
  cachedNativeReadDirectory = undefined;
  cachedStatus = undefined;
  loggedEnumeratorChoice = false;
}
