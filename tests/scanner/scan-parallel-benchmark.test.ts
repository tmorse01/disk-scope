import os from 'node:os';
import { afterEach, describe, expect, it } from 'vitest';
import { runScanParallel } from '../../src/scanner/scan-engine-parallel';
import { readDirectoryTypeScript } from '../../src/scanner/native-enumerator';
import { runScan } from '../../src/scanner/scan-engine';
import { DEFAULT_SCAN_ENGINE_TUNING } from '../../src/scanner/scan-types';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import { formatMeasurement, measureScan, speedupRatio } from './benchmark/measure';
import { createTempFixture, removeFixture } from './fixture-utils';

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => removeFixture(fixture)));
});

describe('scan-parallel benchmark', () => {
  it(
    'logs parallel speedup on shallow-wide fixture',
    async () => {
      const root = await createTempFixture('diskscope-par-bench-');
      fixtures.push(root);
      await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 400 });

      const { measurement: sequential } = await measureScan(
        root,
        DEFAULT_SCAN_ENGINE_TUNING,
        'par-bench-seq',
        { readDirectory: readDirectoryTypeScript },
      );

      const workerCount = Math.min(4, Math.max(1, os.cpus().length - 1));
      const parallelStart = performance.now();
      const { result: parResult } = await runScanParallel({
        scanId: 'par-bench-par',
        rootPath: root,
        readDirectory: readDirectoryTypeScript,
        workerCount,
      });
      const parallelMs = performance.now() - parallelStart;
      const ratio = speedupRatio(sequential.elapsedMs, parallelMs);

      console.log(formatMeasurement('sequential', sequential));
      console.log(
        `[bench] parallel (${workerCount} workers, ${os.platform()}): ${parallelMs.toFixed(1)}ms`,
      );
      console.log(`[bench] parallel speedup: ${ratio.toFixed(2)}×`);

      const { result: seqResult } = await runScan({
        scanId: 'verify-seq',
        rootPath: root,
        readDirectory: readDirectoryTypeScript,
      });

      expect(parResult.totalSizeBytes).toBe(seqResult.totalSizeBytes);
      expect(parResult.fileCount).toBe(seqResult.fileCount);
      expect(ratio).toBeGreaterThan(0);
    },
    30_000,
  );
});
