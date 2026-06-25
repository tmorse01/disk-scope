import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
import {
  DEFAULT_SCAN_ENGINE_TUNING,
  LEGACY_SCAN_ENGINE_TUNING,
} from '../../src/scanner/scan-types';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import {
  formatMeasurement,
  measureScan,
  speedupRatio,
} from './benchmark/measure';
import {
  OPTIMIZATION_KEYS,
  OPTIMIZATION_LABELS,
  tuningWithOnly,
} from './benchmark/tuning-presets';
import { createTempFixture, removeFixture } from './fixture-utils';

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => removeFixture(fixture)));
});

async function trackFixture(prefix: string): Promise<string> {
  const fixturePath = await createTempFixture(prefix);
  fixtures.push(fixturePath);
  return fixturePath;
}

function expectSameAggregates(
  legacy: Awaited<ReturnType<typeof runScan>>['result'],
  optimized: Awaited<ReturnType<typeof runScan>>['result'],
): void {
  expect(optimized.fileCount).toBe(legacy.fileCount);
  expect(optimized.directoryCount).toBe(legacy.directoryCount);
  expect(optimized.totalSizeBytes).toBe(legacy.totalSizeBytes);
  expect(optimized.errorCount).toBe(legacy.errorCount);
  expect(optimized.largestFiles.map((entry) => entry.sizeBytes)).toEqual(
    legacy.largestFiles.map((entry) => entry.sizeBytes),
  );
  expect(optimized.extensionSummaries).toEqual(legacy.extensionSummaries);
}

describe('scan-optimization correctness', () => {
  it('legacy and default tuning produce identical aggregates on nested fixture', async () => {
    const root = await trackFixture('diskscope-opt-equiv-nested-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 120 });

    const { result: legacy } = await runScan({
      scanId: 'equiv-legacy',
      rootPath: root,
      tuning: LEGACY_SCAN_ENGINE_TUNING,
    });
    const { result: optimized } = await runScan({
      scanId: 'equiv-default',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
    });

    expectSameAggregates(legacy, optimized);
  });

  it('legacy and default tuning produce identical aggregates on shallow-wide fixture', async () => {
    const root = await trackFixture('diskscope-opt-equiv-wide-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 400 });

    const { result: legacy } = await runScan({
      scanId: 'equiv-wide-legacy',
      rootPath: root,
      tuning: LEGACY_SCAN_ENGINE_TUNING,
    });
    const { result: optimized } = await runScan({
      scanId: 'equiv-wide-default',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
    });

    expectSameAggregates(legacy, optimized);
  });

  describe('postOrderRollup', () => {
    it('matches ancestor-walk totals on deep tree', async () => {
      const root = await trackFixture('diskscope-opt-rollup-');
      await createBenchmarkFixture(root, { kind: 'deep-narrow', fileCount: 40 });

      const { result: legacy } = await runScan({
        scanId: 'rollup-legacy',
        rootPath: root,
        tuning: LEGACY_SCAN_ENGINE_TUNING,
      });
      const { result: withRollup } = await runScan({
        scanId: 'rollup-only',
        rootPath: root,
        tuning: tuningWithOnly('postOrderRollup'),
      });

      expect(withRollup.totalSizeBytes).toBe(legacy.totalSizeBytes);
    });
  });

  describe('skipRedundantLstat', () => {
    it('matches full-lstat totals on balanced tree', async () => {
      const root = await trackFixture('diskscope-opt-lstat-');
      await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 80 });

      const { result: legacy } = await runScan({
        scanId: 'lstat-legacy',
        rootPath: root,
        tuning: LEGACY_SCAN_ENGINE_TUNING,
      });
      const { result: withSkip } = await runScan({
        scanId: 'lstat-skip',
        rootPath: root,
        tuning: tuningWithOnly('skipRedundantLstat'),
      });

      expectSameAggregates(legacy, withSkip);
    });
  });

  describe('minHeapTopFiles', () => {
    it('selects the same top-N sizes as sorted-array tracker', async () => {
      const root = await trackFixture('diskscope-opt-heap-');
      for (let index = 0; index < 30; index += 1) {
        const size = (index + 1) * 10;
        await fs.writeFile(path.join(root, `f-${index}.dat`), 'x'.repeat(size));
      }

      const { result: legacy } = await runScan({
        scanId: 'heap-legacy',
        rootPath: root,
        topFilesLimit: 5,
        tuning: LEGACY_SCAN_ENGINE_TUNING,
      });
      const { result: withHeap } = await runScan({
        scanId: 'heap-min',
        rootPath: root,
        topFilesLimit: 5,
        tuning: tuningWithOnly('minHeapTopFiles'),
      });

      expect(withHeap.largestFiles.map((entry) => entry.sizeBytes)).toEqual(
        legacy.largestFiles.map((entry) => entry.sizeBytes),
      );
    });
  });

  describe('inodeLoopDetection', () => {
    it('does not follow directory symlinks (unix)', async () => {
      if (process.platform === 'win32') {
        return;
      }

      const root = await trackFixture('diskscope-opt-inode-');
      const realDir = path.join(root, 'real');
      const linkedDir = path.join(root, 'linked');
      await fs.mkdir(realDir, { recursive: true });
      await fs.writeFile(path.join(realDir, 'inside.txt'), 'x'.repeat(200));
      await fs.symlink(realDir, linkedDir, 'dir');

      for (const tuning of [LEGACY_SCAN_ENGINE_TUNING, tuningWithOnly('inodeLoopDetection')]) {
        const { result } = await runScan({
          scanId: `inode-${tuning.inodeLoopDetection ? 'inode' : 'realpath'}`,
          rootPath: root,
          tuning,
        });
        expect(result.fileCount).toBe(1);
        expect(result.totalSizeBytes).toBe(200);
        expect(result.directoriesById[linkedDir]).toBeUndefined();
      }
    });
  });

  describe('exclusionShortCircuit', () => {
    it('skips node_modules subtree without listing children', async () => {
      const root = await trackFixture('diskscope-opt-excl-');
      const nodeModules = path.join(root, 'app', 'node_modules');
      await fs.mkdir(nodeModules, { recursive: true });
      for (let index = 0; index < 40; index += 1) {
        await fs.writeFile(path.join(nodeModules, `pkg-${index}.js`), 'x'.repeat(512));
      }
      await fs.writeFile(path.join(root, 'app', 'index.js'), 'main');

      const { result: legacy } = await runScan({
        scanId: 'excl-legacy',
        rootPath: root,
        exclusions: [{ id: 'nm', kind: 'folder-name', value: 'node_modules' }],
        tuning: { ...LEGACY_SCAN_ENGINE_TUNING, exclusionShortCircuit: false },
      });
      const { result: shortCircuit } = await runScan({
        scanId: 'excl-short',
        rootPath: root,
        exclusions: [{ id: 'nm', kind: 'folder-name', value: 'node_modules' }],
        tuning: tuningWithOnly('exclusionShortCircuit'),
      });

      expect(shortCircuit.fileCount).toBe(1);
      expect(shortCircuit.totalSizeBytes).toBe(legacy.totalSizeBytes);
      expect(shortCircuit.directoriesById[nodeModules]).toBeUndefined();
    });
  });

  describe('batchedProgress', () => {
    it('batches file progress when interval is non-zero', async () => {
      const root = await trackFixture('diskscope-opt-progress-');
      for (let index = 0; index < 200; index += 1) {
        await fs.writeFile(path.join(root, `p-${index}.dat`), 'x'.repeat(16));
      }

      let perFileEvents = 0;
      let batchedEvents = 0;

      await runScan({
        scanId: 'progress-per-file',
        rootPath: root,
        progressIntervalMs: 250,
        tuning: { ...LEGACY_SCAN_ENGINE_TUNING, batchedProgress: false },
        onProgress: () => {
          perFileEvents += 1;
        },
      });
      await runScan({
        scanId: 'progress-batched',
        rootPath: root,
        progressIntervalMs: 250,
        tuning: DEFAULT_SCAN_ENGINE_TUNING,
        onProgress: () => {
          batchedEvents += 1;
        },
      });

      expect(batchedEvents).toBeLessThanOrEqual(perFileEvents);
    });
  });
});

describe('scan-optimization benchmark', () => {
  const BENCH_FILE_COUNT = 800;

  it('reports legacy vs default vs per-optimization speedups on balanced-tree fixture', async () => {
    const root = await trackFixture('diskscope-opt-bench-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: BENCH_FILE_COUNT });

    const { measurement: legacy } = await measureScan(
      root,
      LEGACY_SCAN_ENGINE_TUNING,
      'bench-legacy-all-off',
    );
    const { measurement: optimized } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      'bench-default-all-on',
    );

    console.log(formatMeasurement('legacy-all-off', legacy));
    console.log(formatMeasurement('default-all-on', optimized));
    console.log(
      `[bench] total speedup: ${speedupRatio(legacy.elapsedMs, optimized.elapsedMs).toFixed(2)}×`,
    );

    for (const key of OPTIMIZATION_KEYS) {
      const { measurement: single } = await measureScan(
        root,
        tuningWithOnly(key),
        `bench-only-${key}`,
      );
      const deltaVsLegacy = speedupRatio(legacy.elapsedMs, single.elapsedMs);
      const incremental =
        single.elapsedMs < legacy.elapsedMs
          ? `${deltaVsLegacy.toFixed(2)}× vs legacy`
          : 'no measurable gain alone';
      console.log(
        `[bench] +${OPTIMIZATION_LABELS[key]}: ${single.elapsedMs.toFixed(1)}ms (${incremental})`,
      );
    }

    expect(legacy.fileCount).toBe(BENCH_FILE_COUNT);
    expect(optimized.fileCount).toBe(BENCH_FILE_COUNT);
    expect(optimized.elapsedMs).toBeLessThan(legacy.elapsedMs * 1.5);
  }, 120_000);
});
