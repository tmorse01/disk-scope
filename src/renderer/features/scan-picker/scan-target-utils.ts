/** True when path looks like a Windows drive root (e.g. C:\ or D:). */
export function isDriveRoot(path: string): boolean {
  return /^[A-Za-z]:\\?$/.test(path.replace(/\/+$/, ''));
}

export function targetIcon(path: string): string {
  return isDriveRoot(path) ? 'hard_drive' : 'folder';
}

export function targetTitle(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
  if (isDriveRoot(path)) {
    const letter = normalized.charAt(0).toUpperCase();
    return `${letter}: drive`;
  }
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? path;
}
