const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'] as const;

/**
 * Format a byte count for display using binary (1024) units.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!Number.isFinite(bytes)) {
    return '0 B';
  }

  const value = Math.max(0, bytes);

  if (value === 0) {
    return '0 B';
  }

  const unitIndex = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    UNITS.length - 1,
  );
  const scaled = value / 1024 ** unitIndex;

  return `${scaled.toFixed(decimals)} ${UNITS[unitIndex]}`;
}
