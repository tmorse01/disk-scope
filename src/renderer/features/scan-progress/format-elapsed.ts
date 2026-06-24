export function formatElapsed(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return '0s';
  }

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `${seconds}s`;
  }

  return `${minutes}m ${seconds}s`;
}

export function shortenPath(path: string, maxLength = 64): string {
  if (path.length <= maxLength) {
    return path;
  }

  const head = Math.ceil(maxLength * 0.4);
  const tail = maxLength - head - 1;
  return `${path.slice(0, head)}…${path.slice(-tail)}`;
}
