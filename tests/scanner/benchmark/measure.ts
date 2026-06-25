import { runScan } from '../../../src/scanner/scan-engine';
import type { ReadDirFn, ScanEngineTuning } from '../../../src/scanner/scan-types';
import { DEFAULT_SCAN_ENGINE_TUNING, LEGACY_SCAN_ENGINE_TUNING } from '../../../src/scanner/scan-types';
import type { ScanResult } from '../../../src/shared/types';

export type MeasureScanOptions = {
  readDirectory?: ReadDirFn;
};

export type BenchmarkMeasurement = {
  elapsedMs: number;
  filesPerSec: number;
  fileCount: number;
  directoryCount: number;
  totalSizeBytes: number;
};

export async function measureScan(
  rootPath: string,
  tuning: ScanEngineTuning,
  scanId: string,
  options?: MeasureScanOptions,
): Promise<{ measurement: BenchmarkMeasurement; result: ScanResult }> {
  const start = performance.now();
  const scanOptions: Parameters<typeof runScan>[0] = {
    scanId,
    rootPath,
    progressIntervalMs: 250,
    tuning,
  };
  if (options?.readDirectory) {
    scanOptions.readDirectory = options.readDirectory;
  }
  const { result } = await runScan(scanOptions);
  const elapsedMs = performance.now() - start;

  return {
    result,
    measurement: {
      elapsedMs,
      filesPerSec: result.fileCount / (elapsedMs / 1000),
      fileCount: result.fileCount,
      directoryCount: result.directoryCount,
      totalSizeBytes: result.totalSizeBytes,
    },
  };
}

export function formatMeasurement(label: string, measurement: BenchmarkMeasurement): string {
  return (
    `[bench] ${label}: ${measurement.elapsedMs.toFixed(1)}ms | ` +
    `${measurement.filesPerSec.toFixed(0)} files/sec | ` +
    `files=${measurement.fileCount} dirs=${measurement.directoryCount}`
  );
}

export function speedupRatio(beforeMs: number, afterMs: number): number {
  if (afterMs <= 0) {
    return 1;
  }
  return beforeMs / afterMs;
}

export { DEFAULT_SCAN_ENGINE_TUNING, LEGACY_SCAN_ENGINE_TUNING };
