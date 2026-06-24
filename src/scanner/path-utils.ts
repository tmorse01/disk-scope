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
