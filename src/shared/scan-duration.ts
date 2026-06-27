export type ScanTiming = {
  startedAt: string;
  completedAt: string;
  durationMs?: number;
};

export function computeScanDurationMs(timing: ScanTiming): number {
  if (typeof timing.durationMs === 'number' && Number.isFinite(timing.durationMs)) {
    return Math.max(0, timing.durationMs);
  }

  const started = Date.parse(timing.startedAt);
  const completed = Date.parse(timing.completedAt);
  if (!Number.isFinite(started) || !Number.isFinite(completed)) {
    return 0;
  }

  return Math.max(0, completed - started);
}

export function computeFilesPerSec(fileCount: number, durationMs: number): number {
  if (!Number.isFinite(fileCount) || fileCount <= 0 || !Number.isFinite(durationMs) || durationMs <= 0) {
    return 0;
  }

  return fileCount / (durationMs / 1000);
}

export function formatFilesPerSec(filesPerSec: number): string {
  if (!Number.isFinite(filesPerSec) || filesPerSec <= 0) {
    return '0 files/sec';
  }

  return `${Math.round(filesPerSec).toLocaleString()} files/sec`;
}
