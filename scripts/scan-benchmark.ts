import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { runScan } from '../src/scanner/scan-engine';
import { createBenchmarkFixture, type BenchmarkFixtureKind } from '../tests/scanner/benchmark/fixture-generator';

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

async function runCase(root: string, spec: BenchmarkCase): Promise<{
  label: string;
  elapsedMs: number;
  filesPerSec: number;
  fileCount: number;
  directoryCount: number;
}> {
  await createBenchmarkFixture(root, { kind: spec.kind, fileCount: spec.fileCount });

  const start = performance.now();
  const { result } = await runScan({
    scanId: `bench-${spec.label}`,
    rootPath: root,
    progressIntervalMs: 250,
  });
  const elapsedMs = performance.now() - start;

  return {
    label: spec.label,
    elapsedMs,
    filesPerSec: result.fileCount / (elapsedMs / 1000),
    fileCount: result.fileCount,
    directoryCount: result.directoryCount,
  };
}

async function main(): Promise<void> {
  console.log(`Scan benchmark (platform: ${process.platform}, cpus: ${os.cpus().length})`);
  console.log('---');

  for (const spec of CASES) {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), `diskscope-bench-${spec.label}-`));
    try {
      const result = await runCase(root, spec);
      console.log(
        `${result.label}: ${result.elapsedMs.toFixed(1)}ms | ` +
          `${result.filesPerSec.toFixed(0)} files/sec | ` +
          `files=${result.fileCount} dirs=${result.directoryCount}`,
      );
    } finally {
      await fs.rm(root, { recursive: true, force: true });
    }
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
