import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
import { createTempFixture, removeFixture } from './fixture-utils';
import { createBenchmarkFixture } from './benchmark/fixture-generator';

/**
 * Baseline snapshot (pre-Tier-1 engine, win32 vitest):
 *   shallow-wide-2k:     110.6ms, 18086 files/sec
 *   balanced-tree-1.5k:  360.5ms, 4161 files/sec
 *
 * Tier-1 optimized (task/013, win32 vitest):
 *   shallow-wide-2k:     88.6ms, 22571 files/sec (~1.25×)
 *   balanced-tree-1.5k:  229.1ms, 6549 files/sec (~1.57×)
 */

const fixtures: string[] = [];

afterEach(async () => {
  await Promise.all(fixtures.splice(0).map((fixture) => removeFixture(fixture)));
});

async function trackFixture(prefix: string): Promise<string> {
  const fixturePath = await createTempFixture(prefix);
  fixtures.push(fixturePath);
  return fixturePath;
}

describe('scan-benchmark', () => {
  it('measures shallow-wide fixture throughput', async () => {
    const root = await trackFixture('diskscope-bench-wide-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 2_000 });

    const start = performance.now();
    const { result } = await runScan({
      scanId: 'bench-wide',
      rootPath: root,
    });
    const elapsedMs = performance.now() - start;

    expect(result.fileCount).toBe(2_000);
    expect(elapsedMs).toBeLessThan(30_000);

    const filesPerSec = result.fileCount / (elapsedMs / 1000);
    console.log(
      `[bench] shallow-wide-2k: ${elapsedMs.toFixed(1)}ms, ${filesPerSec.toFixed(0)} files/sec`,
    );
  }, 60_000);

  it('measures balanced-tree fixture throughput', async () => {
    const root = await trackFixture('diskscope-bench-tree-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 1_500 });

    const start = performance.now();
    const { result } = await runScan({
      scanId: 'bench-tree',
      rootPath: root,
    });
    const elapsedMs = performance.now() - start;

    expect(result.fileCount).toBe(1_500);
    expect(elapsedMs).toBeLessThan(30_000);

    const filesPerSec = result.fileCount / (elapsedMs / 1000);
    console.log(
      `[bench] balanced-tree-1.5k: ${elapsedMs.toFixed(1)}ms, ${filesPerSec.toFixed(0)} files/sec`,
    );
  }, 60_000);
});

describe('scan-benchmark exclusion short-circuit', () => {
  it('skips readdir for folder-name excluded directories', async () => {
    const root = await trackFixture('diskscope-bench-excl-');
    const nodeModules = path.join(root, 'app', 'node_modules');
    await fs.mkdir(nodeModules, { recursive: true });
    for (let index = 0; index < 50; index += 1) {
      await fs.writeFile(path.join(nodeModules, `pkg-${index}.js`), 'x'.repeat(1024));
    }
    await fs.writeFile(path.join(root, 'app', 'index.js'), 'main');

    const { result } = await runScan({
      scanId: 'bench-excl',
      rootPath: root,
      exclusions: [{ id: 'nm', kind: 'folder-name', value: 'node_modules' }],
    });

    expect(result.fileCount).toBe(1);
    expect(result.totalSizeBytes).toBe(4);
    expect(result.directoriesById[nodeModules]).toBeUndefined();
  });
});
