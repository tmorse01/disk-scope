import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
import {
  getNativeEnumeratorStatus,
  readDirectoryTypeScript,
  resetNativeEnumeratorCacheForTests,
  resolveReadDirectory,
  tryLoadNativeReadDirectory,
} from '../../src/scanner/native-enumerator';
import { DEFAULT_SCAN_ENGINE_TUNING } from '../../src/scanner/scan-types';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import { createTempFixture, removeFixture, writeFileWithSize } from './fixture-utils';

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
  expect(right.extensionSummaries).toEqual(left.extensionSummaries);
}

describe('native-enumerator loader', () => {
  it('returns null when native addon is not built', () => {
    const native = tryLoadNativeReadDirectory();
    if (process.platform === 'win32') {
      expect(native === null || typeof native === 'function').toBe(true);
    } else {
      expect(native).toBeNull();
      expect(getNativeEnumeratorStatus()).toBe('typescript');
    }
  });

  it('resolveReadDirectory falls back to typescript enumerator', async () => {
    const reader = resolveReadDirectory();
    const root = await trackFixture('diskscope-native-fallback-');
    await writeFileWithSize(path.join(root, 'a.txt'), 32);

    const entries = await reader(root);
    expect(entries.some((entry) => entry.name === 'a.txt' && entry.sizeBytes === 32)).toBe(true);
  });

  it('readDirectoryTypeScript maps directory entries with sizes', async () => {
    const root = await trackFixture('diskscope-native-ts-map-');
    await fs.mkdir(path.join(root, 'child'), { recursive: true });
    await writeFileWithSize(path.join(root, 'root.dat'), 64);
    await writeFileWithSize(path.join(root, 'child', 'nested.dat'), 128);

    const entries = await readDirectoryTypeScript(root);
    const fileEntry = entries.find((entry) => entry.name === 'root.dat');
    const dirEntry = entries.find((entry) => entry.name === 'child');

    expect(fileEntry?.isDirectory).toBe(false);
    expect(fileEntry?.sizeBytes).toBe(64);
    expect(dirEntry?.isDirectory).toBe(true);
    expect(dirEntry?.isSymlink).toBe(false);
  });
});

describe('readDirectory injection', () => {
  it('uses injected readDirectory without changing legacy default path', async () => {
    const root = await trackFixture('diskscope-native-inject-');
    await writeFileWithSize(path.join(root, 'injected.txt'), 50);

    const { result: legacyDefault } = await runScan({
      scanId: 'inject-legacy-default',
      rootPath: root,
    });
    const { result: withTsEnumerator } = await runScan({
      scanId: 'inject-ts-enum',
      rootPath: root,
      readDirectory: readDirectoryTypeScript,
    });

    expectSameAggregates(legacyDefault, withTsEnumerator);
  });

  it('end-to-end scan with TS enumerator matches legacy aggregates on balanced-tree', async () => {
    const root = await trackFixture('diskscope-native-e2e-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 80 });

    const { result: legacy } = await runScan({
      scanId: 'e2e-legacy',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
    });
    const { result: withEnumerator } = await runScan({
      scanId: 'e2e-ts-enum',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: readDirectoryTypeScript,
    });

    expectSameAggregates(legacy, withEnumerator);
  });
});

describe('auto fallback', () => {
  it('fallback readDirectory timing matches Tier 1 baseline order of magnitude', async () => {
    const root = await trackFixture('diskscope-native-fallback-perf-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 200 });

    const startLegacy = performance.now();
    await runScan({
      scanId: 'fallback-legacy',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
    });
    const legacyMs = performance.now() - startLegacy;

    const startFallback = performance.now();
    await runScan({
      scanId: 'fallback-ts-enum',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: readDirectoryTypeScript,
    });
    const fallbackMs = performance.now() - startFallback;

    expect(fallbackMs).toBeLessThan(legacyMs * 3);
  });
});

describe('reparse/symlink skip', () => {
  it('readDirectoryTypeScript marks symlinks and scan skips them (unix)', async () => {
    if (process.platform === 'win32') {
      return;
    }

    const root = await trackFixture('diskscope-native-symlink-');
    const realDir = path.join(root, 'real');
    const linkedDir = path.join(root, 'linked');
    await fs.mkdir(realDir, { recursive: true });
    await writeFileWithSize(path.join(realDir, 'inside.txt'), 200);
    await fs.symlink(realDir, linkedDir, 'dir');

    const entries = await readDirectoryTypeScript(root);
    const linked = entries.find((entry) => entry.name === 'linked');
    expect(linked?.isSymlink).toBe(true);

    const { result } = await runScan({
      scanId: 'native-symlink-scan',
      rootPath: root,
      readDirectory: readDirectoryTypeScript,
    });
    expect(result.fileCount).toBe(1);
    expect(result.totalSizeBytes).toBe(200);
  });
});

describe('FindFirstFileEx entry mapping', () => {
  it('TS enumerator lists same file names as fs.readdir on fixture dir', async () => {
    const root = await trackFixture('diskscope-native-listing-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 40 });

    const dirents = await fs.readdir(root, { withFileTypes: true });
    const tsEntries = await readDirectoryTypeScript(root);

    expect(tsEntries.map((entry) => entry.name).sort()).toEqual(
      dirents.map((entry) => entry.name).sort(),
    );
  });
});
