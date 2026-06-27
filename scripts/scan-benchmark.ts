import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  readDirectoryTypeScript,
  tryLoadNativeReadDirectory,
} from '../src/scanner/native-enumerator';
import {
  DEFAULT_SCAN_ENGINE_TUNING,
  LEGACY_SCAN_ENGINE_TUNING,
  resolveWorkerCount,
} from '../src/scanner/scan-types';
import { runScanParallel } from '../src/scanner/scan-engine-parallel';
import { createBenchmarkFixture, type BenchmarkFixtureKind } from '../tests/scanner/benchmark/fixture-generator';
import {
  formatMeasurement,
  measureScan,
  speedupRatio,
} from '../tests/scanner/benchmark/measure';
import {
  OPTIMIZATION_KEYS,
  OPTIMIZATION_LABELS,
  tuningWithOnly,
} from '../tests/scanner/benchmark/tuning-presets';

type BenchmarkCase = {
  kind: BenchmarkFixtureKind;
  fileCount: number;
  label: string;
};

const CASES: BenchmarkCase[] = [
  { kind: 'shallow-wide', fileCount: 2_000, label: 'shallow-wide-2k' },
  { kind: 'balanced-tree', fileCount: 1_500, label: 'balanced-tree-1.5k' },
  { kind: 'deep-narrow', fileCount: 200, label: 'deep-narrow-200' },
];

type Profile = 'legacy' | 'optimized' | 'compare' | 'per-opt' | 'native-compare' | 'parallel-compare';

function parseProfile(): Profile {
  const arg = process.argv.find((value) => value.startsWith('--profile='));
  const profile = arg?.split('=')[1] ?? 'compare';
  if (
    profile === 'legacy' ||
    profile === 'optimized' ||
    profile === 'compare' ||
    profile === 'per-opt' ||
    profile === 'native-compare' ||
    profile === 'parallel-compare'
  ) {
    return profile;
  }
  return 'compare';
}

async function runCase(root: string, spec: BenchmarkCase, profile: Profile): Promise<void> {
  await createBenchmarkFixture(root, { kind: spec.kind, fileCount: spec.fileCount });

  if (profile === 'legacy' || profile === 'compare') {
    const { measurement } = await measureScan(root, LEGACY_SCAN_ENGINE_TUNING, `${spec.label}-legacy`);
    console.log(formatMeasurement(`${spec.label} legacy`, measurement));
  }

  if (profile === 'optimized' || profile === 'compare') {
    const { measurement } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      `${spec.label}-optimized`,
    );
    console.log(formatMeasurement(`${spec.label} optimized`, measurement));
  }

  if (profile === 'compare') {
    const { measurement: legacy } = await measureScan(
      root,
      LEGACY_SCAN_ENGINE_TUNING,
      `${spec.label}-legacy-cmp`,
    );
    const { measurement: optimized } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      `${spec.label}-opt-cmp`,
    );
    console.log(
      `[bench] ${spec.label} total: ${speedupRatio(legacy.elapsedMs, optimized.elapsedMs).toFixed(2)}×`,
    );
  }

  if (profile === 'per-opt') {
    const { measurement: legacy } = await measureScan(
      root,
      LEGACY_SCAN_ENGINE_TUNING,
      `${spec.label}-legacy-base`,
    );
    console.log(formatMeasurement(`${spec.label} legacy baseline`, legacy));

    for (const key of OPTIMIZATION_KEYS) {
      const { measurement: single } = await measureScan(
        root,
        tuningWithOnly(key),
        `${spec.label}-${key}`,
      );
      const ratio = speedupRatio(legacy.elapsedMs, single.elapsedMs);
      console.log(
        `[bench] ${spec.label} +${OPTIMIZATION_LABELS[key]}: ${single.elapsedMs.toFixed(1)}ms (${ratio.toFixed(2)}× vs legacy)`,
      );
    }
  }

  if (profile === 'native-compare') {
    const nativeReadDirectory = tryLoadNativeReadDirectory();
    const { measurement: tsMeasurement } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      `${spec.label}-ts-enumerator`,
      { readDirectory: readDirectoryTypeScript },
    );
    console.log(
      `[bench] ${spec.label} ts-enumerator: ${tsMeasurement.elapsedMs.toFixed(1)}ms | ${tsMeasurement.filesPerSec.toFixed(0)} files/sec`,
    );

    if (nativeReadDirectory) {
      const { measurement: nativeMeasurement } = await measureScan(
        root,
        DEFAULT_SCAN_ENGINE_TUNING,
        `${spec.label}-native-enumerator`,
        { readDirectory: nativeReadDirectory },
      );
      console.log(
        `[bench] ${spec.label} native-enumerator: ${nativeMeasurement.elapsedMs.toFixed(1)}ms | ${nativeMeasurement.filesPerSec.toFixed(0)} files/sec`,
      );
      console.log(
        `[bench] ${spec.label} native speedup: ${speedupRatio(tsMeasurement.elapsedMs, nativeMeasurement.elapsedMs).toFixed(2)}×`,
      );
    } else {
      console.log(`[bench] ${spec.label} native-enumerator: unavailable (build with pnpm build:native on Windows)`);
    }
  }

  if (profile === 'parallel-compare') {
    const workerCount = resolveWorkerCount();
    const { measurement: sequential } = await measureScan(
      root,
      DEFAULT_SCAN_ENGINE_TUNING,
      `${spec.label}-sequential`,
      { readDirectory: readDirectoryTypeScript },
    );
    const parallelStart = performance.now();
    await runScanParallel({
      scanId: `${spec.label}-parallel`,
      rootPath: root,
      readDirectory: readDirectoryTypeScript,
      workerCount,
    });
    const parallelMs = performance.now() - parallelStart;
    console.log(formatMeasurement(`${spec.label} sequential`, sequential));
    console.log(
      `[bench] ${spec.label} parallel (${workerCount} workers): ${parallelMs.toFixed(1)}ms | ${(sequential.fileCount / (parallelMs / 1000)).toFixed(0)} files/sec`,
    );
    console.log(
      `[bench] ${spec.label} parallel speedup: ${speedupRatio(sequential.elapsedMs, parallelMs).toFixed(2)}×`,
    );
  }
}

async function main(): Promise<void> {
  const profile = parseProfile();
  console.log(`Scan benchmark (platform: ${process.platform}, cpus: ${os.cpus().length}, profile: ${profile})`);
  console.log('---');

  for (const spec of CASES) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `diskscope-bench-${spec.label}-`));
    try {
      await runCase(root, spec, profile);
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
    console.log('---');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
