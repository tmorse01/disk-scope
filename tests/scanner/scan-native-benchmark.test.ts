import { afterEach, describe, expect, it } from 'vitest';
import {
  readDirectoryTypeScript,
  resetNativeEnumeratorCacheForTests,
  tryLoadNativeReadDirectory,
} from '../../src/scanner/native-enumerator';
import { DEFAULT_SCAN_ENGINE_TUNING } from '../../src/scanner/scan-types';
import { runScan } from '../../src/scanner/scan-engine';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import { formatMeasurement, measureScan, speedupRatio } from './benchmark/measure';
import { createTempFixture, removeFixture } from './fixture-utils';

const fixtures: string[] = [];

afterEach(async () => {
  resetNativeEnumeratorCacheForTests();
  await Promise.all(fixtures.splice(0).map((fixture) => removeFixture(fixture)));
});

async function trackFixture(prefix: string): Promise<string> {
  const fixturePath = await createTempFixture(prefix);
  fixtures.push(fixturePath);
  return fixturePath;
}

function expectSameAggregates(
  left: Awaited<ReturnType<typeof runScan>>['result'],
  right: Awaited<ReturnType<typeof runScan>>['result'],
): void {
  expect(right.fileCount).toBe(left.fileCount);
  expect(right.directoryCount).toBe(left.directoryCount);
  expect(right.totalSizeBytes).toBe(left.totalSizeBytes);
  expect(right.errorCount).toBe(left.errorCount);
}

async function benchFixture(
  label: string,
  kind: 'shallow-wide' | 'balanced-tree',
  fileCount: number,
): Promise<{ tsMs: number; nativeMs: number | null; speedup: number | null }> {
  const root = await trackFixture(`diskscope-native-bench-${label}-`);
  await createBenchmarkFixture(root, { kind, fileCount });

  const { measurement: tsMeasurement, result: tsResult } = await measureScan(
    root,
    DEFAULT_SCAN_ENGINE_TUNING,
    `${label}-ts-enumerator`,
    { readDirectory: readDirectoryTypeScript },
  );
  console.log(
    `[bench] ${label} ts-enumerator: ${tsMeasurement.elapsedMs.toFixed(1)}ms | ${tsMeasurement.filesPerSec.toFixed(0)} files/sec`,
  );

  const nativeReadDirectory = tryLoadNativeReadDirectory();
  if (!nativeReadDirectory) {
    console.log(`[bench] ${label} native-enumerator: unavailable`);
    console.log(`[bench] ${label} native speedup: N/A (addon not built)`);
    return { tsMs: tsMeasurement.elapsedMs, nativeMs: null, speedup: null };
  }

  const { measurement: nativeMeasurement, result: nativeResult } = await measureScan(
    root,
    DEFAULT_SCAN_ENGINE_TUNING,
    `${label}-native-enumerator`,
    { readDirectory: nativeReadDirectory },
  );
  console.log(
    `[bench] ${label} native-enumerator: ${nativeMeasurement.elapsedMs.toFixed(1)}ms | ${nativeMeasurement.filesPerSec.toFixed(0)} files/sec`,
  );

  const speedup = speedupRatio(tsMeasurement.elapsedMs, nativeMeasurement.elapsedMs);
  console.log(`[bench] ${label} native speedup: ${speedup.toFixed(2)}×`);

  expectSameAggregates(tsResult, nativeResult);
  return { tsMs: tsMeasurement.elapsedMs, nativeMs: nativeMeasurement.elapsedMs, speedup };
}

describe('scan-native benchmark', () => {
  it('reports ts vs native speedup on shallow-wide fixture', async () => {
    const stats = await benchFixture('shallow-wide', 'shallow-wide', 600);
    expect(stats.tsMs).toBeGreaterThan(0);
    if (stats.nativeMs !== null) {
      expect(stats.nativeMs).toBeGreaterThan(0);
    }
  }, 120_000);

  it('reports ts vs native speedup on balanced-tree fixture', async () => {
    const stats = await benchFixture('balanced-tree', 'balanced-tree', 500);
    expect(stats.tsMs).toBeGreaterThan(0);
    if (stats.nativeMs !== null) {
      expect(stats.nativeMs).toBeGreaterThan(0);
    }
  }, 120_000);

  it('fallback TS enumerator end-to-end matches legacy-ts baseline aggregates', async () => {
    const root = await trackFixture('diskscope-native-e2e-bench-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 200 });

    const { measurement: legacyTs, result: legacyResult } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      'legacy-ts-baseline',
    );
    const { measurement: enumTs, result: enumResult } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      'ts-enumerator-e2e',
      { readDirectory: readDirectoryTypeScript },
    );

    console.log(formatMeasurement('legacy-ts baseline', legacyTs));
    console.log(formatMeasurement('ts-enumerator e2e', enumTs));
    console.log(
      `[bench] end-to-end legacy-ts vs ts-enumerator speedup: ${speedupRatio(legacyTs.elapsedMs, enumTs.elapsedMs).toFixed(2)}×`,
    );

    expectSameAggregates(legacyResult, enumResult);
  }, 120_000);
});
