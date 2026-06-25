export interface NativeDirectoryEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  sizeBytes: number;
  mtimeMs?: number | null;
}

export function readDirectory(dirPath: string): NativeDirectoryEntry[];
