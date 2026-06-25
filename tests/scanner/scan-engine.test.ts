import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
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

describe('scan-engine', () => {
  it('aggregates nested directory sizes', async () => {
    const root = await trackFixture('diskscope-nested-');
    await writeFileWithSize(path.join(root, 'a.txt'), 100);
    await writeFileWithSize(path.join(root, 'child', 'b.txt'), 250);
    await writeFileWithSize(path.join(root, 'child', 'grandchild', 'c.txt'), 50);

    const { result } = await runScan({
      scanId: 'scan-nested',
      rootPath: root,
    });

    expect(result.totalSizeBytes).toBe(400);
    expect(result.fileCount).toBe(3);
    expect(result.directoryCount).toBe(3);
    expect(result.largestFiles[0]?.sizeBytes).toBe(250);
    expect(result.extensionSummaries).toEqual([
      { extension: '.txt', sizeBytes: 400, fileCount: 3 },
    ]);

    const rootNode = result.directoriesById[result.rootNodeId];
    const childNode = result.directoriesById[path.normalize(path.join(root, 'child'))];
    expect(rootNode?.sizeBytes).toBe(400);
    expect(rootNode?.fileCount).toBe(1);
    expect(rootNode?.directoryCount).toBe(1);
    expect(childNode?.sizeBytes).toBe(300);
    expect(childNode?.fileCount).toBe(1);
    expect(childNode?.directoryCount).toBe(1);
  });

  it('handles an empty directory', async () => {
    const root = await trackFixture('diskscope-empty-');

    const { result } = await runScan({
      scanId: 'scan-empty',
      rootPath: root,
    });

    expect(result.totalSizeBytes).toBe(0);
    expect(result.fileCount).toBe(0);
    expect(result.directoryCount).toBe(1);
    expect(result.largestFiles).toEqual([]);
    expect(result.errors).toEqual([]);
  });

  it('continues when a nested directory is unreadable', async () => {
    const root = await trackFixture('diskscope-unreadable-');
    const blockedDir = path.join(root, 'blocked');
    await fs.mkdir(blockedDir);
    await writeFileWithSize(path.join(blockedDir, 'secret.txt'), 128);
    await writeFileWithSize(path.join(root, 'visible.txt'), 64);

    if (process.platform !== 'win32') {
      await fs.chmod(blockedDir, 0o000);
    } else {
      return;
    }

    const { result } = await runScan({
      scanId: 'scan-unreadable',
      rootPath: root,
    });

    expect(result.fileCount).toBeGreaterThanOrEqual(1);
    expect(result.totalSizeBytes).toBeGreaterThanOrEqual(64);
    expect(result.errorCount).toBeGreaterThanOrEqual(1);

    await fs.chmod(blockedDir, 0o755);
  });

  it('does not follow directory symlinks', async () => {
    if (process.platform === 'win32') {
      return;
    }

    const root = await trackFixture('diskscope-symlink-');
    const realDir = path.join(root, 'real');
    const linkedDir = path.join(root, 'linked');
    await writeFileWithSize(path.join(realDir, 'inside.txt'), 200);
    await fs.symlink(realDir, linkedDir, 'dir');

    const { result } = await runScan({
      scanId: 'scan-symlink',
      rootPath: root,
    });

    expect(result.fileCount).toBe(1);
    expect(result.totalSizeBytes).toBe(200);
    expect(result.directoriesById[linkedDir]).toBeUndefined();
  });

  it('supports cancellation with partial results', async () => {
    const root = await trackFixture('diskscope-cancel-');
    for (let index = 0; index < 40; index += 1) {
      await writeFileWithSize(path.join(root, `file-${index}.bin`), 1024);
    }

    let cancelRequested = false;
    const { result, cancelled } = await runScan({
      scanId: 'scan-cancel',
      rootPath: root,
      progressIntervalMs: 0,
      shouldCancel: () => cancelRequested,
      onProgress: (event) => {
        if (event.filesScanned >= 3) {
          cancelRequested = true;
        }
      },
    });

    expect(cancelled).toBe(true);
    expect(result.fileCount).toBeLessThan(40);
    expect(result.fileCount).toBeGreaterThan(0);
  });

  it('batches progress events', async () => {
    const root = await trackFixture('diskscope-progress-');
    for (let index = 0; index < 10; index += 1) {
      await writeFileWithSize(path.join(root, `p-${index}.dat`), 16);
    }

    const progressEvents: number[] = [];
    await runScan({
      scanId: 'scan-progress',
      rootPath: root,
      progressIntervalMs: 1_000,
      onProgress: (event) => {
        progressEvents.push(event.filesScanned);
      },
    });

    expect(progressEvents.length).toBeLessThan(10);
    expect(progressEvents.at(-1)).toBe(10);
  });

  it('tracks only the top N largest files', async () => {
    const root = await trackFixture('diskscope-topn-');
    await writeFileWithSize(path.join(root, 'small.txt'), 10);
    await writeFileWithSize(path.join(root, 'medium.txt'), 100);
    await writeFileWithSize(path.join(root, 'large.txt'), 1_000);

    const { result } = await runScan({
      scanId: 'scan-topn',
      rootPath: root,
      topFilesLimit: 2,
    });

    expect(result.largestFiles).toHaveLength(2);
    expect(result.largestFiles.map((entry) => entry.sizeBytes)).toEqual([1_000, 100]);
  });

  it('records errors for missing scan roots without crashing', async () => {
    const root = await trackFixture('diskscope-missing-');
    const missingRoot = path.join(root, 'does-not-exist');

    const { result } = await runScan({
      scanId: 'scan-missing',
      rootPath: missingRoot,
    });

    expect(result.errorCount).toBeGreaterThanOrEqual(1);
    expect(result.totalSizeBytes).toBe(0);
    expect(result.errors[0]?.operation).toBe('stat');
  });

  it('skips excluded paths and folder name patterns', async () => {
    const root = await trackFixture('diskscope-exclusions-');
    await writeFileWithSize(path.join(root, 'keep.txt'), 100);
    await writeFileWithSize(path.join(root, 'skip-dir', 'hidden.txt'), 500);
    await writeFileWithSize(path.join(root, 'node_modules', 'pkg', 'index.js'), 900);

    const excludedDir = path.join(root, 'skip-dir');
    const { result } = await runScan({
      scanId: 'scan-exclusions',
      rootPath: root,
      exclusions: [
        { id: 'path', kind: 'path', value: excludedDir },
        { id: 'pattern', kind: 'folder-name', value: 'node_modules' },
      ],
    });

    expect(result.fileCount).toBe(1);
    expect(result.totalSizeBytes).toBe(100);
    expect(result.directoriesById[excludedDir]).toBeUndefined();
    expect(result.directoriesById[path.join(root, 'node_modules')]).toBeUndefined();
  });
});
