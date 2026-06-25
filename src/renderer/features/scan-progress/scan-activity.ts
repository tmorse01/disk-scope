import { isDriveRoot } from '../scan-picker/scan-target-utils';

export type ScanProgressEstimateInput = {
  scanPath: string;
  filesScanned: number;
  elapsedMs: number;
};

/** Never show 100% until the scan actually completes. */
export const ANALYZED_CAP = 96;

const BASE_ESTIMATE_MS = {
  drive: 240_000,
  folder: 60_000,
  default: 120_000,
} as const;

/** Rough guess at total scan duration from path type and live throughput. */
export function estimateScanDurationMs(input: ScanProgressEstimateInput): number {
  const { scanPath, filesScanned, elapsedMs } = input;
  const isDrive = scanPath.length > 0 && isDriveRoot(scanPath);
  let estimate: number = isDrive ? BASE_ESTIMATE_MS.drive : BASE_ESTIMATE_MS.folder;

  if (filesScanned <= 0 || elapsedMs <= 0) {
    return estimate;
  }

  // Large tree discovered early — extend the guess.
  if (filesScanned > 10_000 && elapsedMs < estimate * 0.4) {
    estimate = Math.max(estimate, elapsedMs * 6);
  }

  // Past the initial guess — assume more work remains and stretch the timeline.
  if (elapsedMs > estimate * 0.85) {
    const extension = Math.max(30_000, estimate * 0.5);
    estimate = elapsedMs + extension;
  }

  return estimate;
}

/**
 * Fake “% analyzed” from elapsed time vs estimated duration.
 * Moves quickly at first, then eases off and crawls near the cap.
 */
export function computeAnalyzedPercent(elapsedMs: number, estimatedTotalMs: number): number {
  if (elapsedMs <= 0 || estimatedTotalMs <= 0) {
    return 0;
  }

  const ratio = elapsedMs / estimatedTotalMs;
  const atEstimate = 92 * (1 - Math.exp(-2.5));

  let percent: number;
  if (ratio <= 1) {
    percent = 92 * (1 - Math.exp(-2.5 * ratio));
  } else {
    const headroom = ANALYZED_CAP - atEstimate;
    const overshoot = ratio - 1;
    percent = atEstimate + headroom * (1 - Math.exp(-1.2 * overshoot));
  }

  return Math.min(ANALYZED_CAP, Math.max(0, Math.round(percent * 10) / 10));
}

export function analyzedCaption(
  percent: number,
  elapsedMs: number,
  estimatedTotalMs: number,
): string {
  if (percent < 5) {
    return 'Starting';
  }

  const ratio = estimatedTotalMs > 0 ? elapsedMs / estimatedTotalMs : 0;
  if (ratio > 1.2 || percent >= 90) {
    return 'Finishing up';
  }
  if (percent >= 75) {
    return 'Almost done';
  }
  return 'Analyzing';
}

export function formatAnalyzedPercent(percent: number): string {
  return `${Math.round(percent)}%`;
}
