import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
import { runScanParallel } from '../../src/scanner/scan-engine-parallel';
import { readDirectoryTypeScript } from '../../src/scanner/native-enumerator';
import { resolveWorkerCount } from '../../src/scanner/scan-types';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import { createTempFixture, removeFixture, writeFileWithSize } from './fixture-utils';

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
  sequential: Awaited<ReturnType<typeof runScan>>['result'],
  parallel: Awaited<ReturnType<typeof runScan>>['result'],
): void {
  expect(parallel.fileCount).toBe(sequential.fileCount);
  expect(parallel.directoryCount).toBe(sequential.directoryCount);
  expect(parallel.totalSizeBytes).toBe(sequential.totalSizeBytes);
  expect(parallel.errorCount).toBe(sequential.errorCount);
  expect(parallel.largestFiles.map((entry) => entry.sizeBytes)).toEqual(
    sequential.largestFiles.map((entry) => entry.sizeBytes),
  );
  expect(parallel.extensionSummaries).toEqual(sequential.extensionSummaries);
  expect(parallel.cleanupCandidates.map((entry) => entry.sizeBytes)).toEqual(
    sequential.cleanupCandidates.map((entry) => entry.sizeBytes),
  );
}

async function runBoth(root: string, scanId: string, workerCount = 4) {
  const { result: sequential } = await runScan({
    scanId: `${scanId}-seq`,
    rootPath: root,
    readDirectory: readDirectoryTypeScript,
  });

  const { result: parallel } = await runScanParallel({
    scanId: `${scanId}-par`,
    rootPath: root,
    readDirectory: readDirectoryTypeScript,
    workerCount,
  });

  return { sequential, parallel };
}

describe('scan-parallel equivalence', () => {
  it('matches sequential aggregates on nested fixture', async () => {
    const root = await trackFixture('diskscope-par-nested-');
    await writeFileWithSize(path.join(root, 'a.txt'), 100);
    await writeFileWithSize(path.join(root, 'child', 'b.txt'), 250);
    await writeFileWithSize(path.join(root, 'child', 'grandchild', 'c.txt'), 50);

    const { sequential, parallel } = await runBoth(root, 'par-nested');

    expectSameAggregates(sequential, parallel);

    const rootNode = parallel.directoriesById[parallel.rootNodeId];
    const childNode = parallel.directoriesById[path.normalize(path.join(root, 'child'))];
    expect(rootNode?.sizeBytes).toBe(400);
    expect(childNode?.sizeBytes).toBe(300);
  });

  it('matches sequential aggregates on empty directory', async () => {
    const root = await trackFixture('diskscope-par-empty-');
    const { sequential, parallel } = await runBoth(root, 'par-empty');
    expectSameAggregates(sequential, parallel);
  });

  it('matches sequential aggregates with exclusions', async () => {
    const root = await trackFixture('diskscope-par-excl-');
    await writeFileWithSize(path.join(root, 'keep.txt'), 64);
    await fs.mkdir(path.join(root, 'node_modules'), { recursive: true });
    await writeFileWithSize(path.join(root, 'node_modules', 'dep.txt'), 999);

    const exclusions = [{ id: '1', kind: 'folder-name' as const, value: 'node_modules' }];
    const { result: sequential } = await runScan({
      scanId: 'par-excl-seq',
      rootPath: root,
      exclusions,
      readDirectory: readDirectoryTypeScript,
    });
    const { result: parallel } = await runScanParallel({
      scanId: 'par-excl-par',
      rootPath: root,
      exclusions,
      readDirectory: readDirectoryTypeScript,
      workerCount: 4,
    });

    expectSameAggregates(sequential, parallel);
  });

  it('supports cancellation with partial results', async () => {
    const root = await trackFixture('diskscope-par-cancel-');
    for (let index = 0; index < 30; index += 1) {
      const dir = path.join(root, `dir-${index}`);
      await fs.mkdir(dir);
      await writeFileWithSize(path.join(dir, 'file.txt'), 10);
    }

    let cancelRequested = false;
    const { cancelled } = await runScanParallel({
      scanId: 'par-cancel',
      rootPath: root,
      readDirectory: readDirectoryTypeScript,
      workerCount: 2,
      shouldCancel: () => cancelRequested,
      onProgress: (event) => {
        if (event.directoriesScanned >= 3) {
          cancelRequested = true;
        }
      },
    });

    expect(cancelled).toBe(true);
  });

  it('matches sequential on benchmark shallow-wide fixture', async () => {
    const root = await trackFixture('diskscope-par-bench-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 400 });

    const { sequential, parallel } = await runBoth(root, 'par-bench', 4);
    expectSameAggregates(sequential, parallel);
  });

  it('resolveWorkerCount returns 1 when SCAN_WORKER_COUNT=1', () => {
    const previous = process.env.SCAN_WORKER_COUNT;
    process.env.SCAN_WORKER_COUNT = '1';
    expect(resolveWorkerCount()).toBe(1);
    process.env.SCAN_WORKER_COUNT = previous;
  });
});
