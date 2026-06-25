const VIDEO_EXTENSIONS = new Set(['mp4', 'mkv', 'avi', 'mov', 'webm', 'wmv']);
const IMAGE_EXTENSIONS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico']);
const ARCHIVE_EXTENSIONS = new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']);
const DATABASE_EXTENSIONS = new Set(['sql', 'db', 'sqlite', 'mdb']);

export function fileIconForExtension(extension: string | null): string {
  if (!extension) {
    return 'description';
  }

  const lower = extension.toLowerCase();

  if (VIDEO_EXTENSIONS.has(lower)) {
    return 'movie';
  }

  if (IMAGE_EXTENSIONS.has(lower)) {
    return 'image';
  }

  if (ARCHIVE_EXTENSIONS.has(lower)) {
    return 'folder_zip';
  }

  if (DATABASE_EXTENSIONS.has(lower)) {
    return 'database';
  }

  if (lower === 'iso') {
    return 'album';
  }

  return 'description';
}
