import path from 'node:path';

/**
 * Normalize a filesystem path for consistent comparisons.
 */
export function normalizePath(input: string): string {
  return path.normalize(input);
}

/**
 * Return the parent directory path, or null when at a root.
 */
export function parentPath(input: string): string | null {
  const parent = path.dirname(input);
  if (parent === input) {
    return null;
  }
  return parent;
}

/**
 * Derive a stable node id from a normalized directory path.
 */
export function pathToNodeId(normalizedPath: string): string {
  return normalizedPath;
}

/**
 * Return the lowercase file extension, or null when absent.
 */
export function fileExtension(filePath: string): string | null {
  const extension = path.extname(filePath);
  if (!extension || extension === '.') {
    return null;
  }
  return extension.toLowerCase();
}

/**
 * Return the final path segment.
 */
export function baseName(filePath: string): string {
  return path.basename(filePath);
}
