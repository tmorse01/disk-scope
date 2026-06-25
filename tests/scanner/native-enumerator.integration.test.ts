import fs from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { runScan } from '../../src/scanner/scan-engine';
import {
  readDirectoryTypeScript,
  resetNativeEnumeratorCacheForTests,
  tryLoadNativeReadDirectory,
} from '../../src/scanner/native-enumerator';
import { DEFAULT_SCAN_ENGINE_TUNING } from '../../src/scanner/scan-types';
import { createBenchmarkFixture } from './benchmark/fixture-generator';
import { createTempFixture, removeFixture, writeFileWithSize } from './fixture-utils';

const fixtures: string[] = [];
const isWin32 = process.platform === 'win32';
const describeWin32 = isWin32 ? describe : describe.skip;

afterEach(async () => {
  resetNativeEnumeratorCacheForTests();
  await Promise.all(fixtures.splice(0).map((fixture) => removeFixture(fixture)));
});

async function trackFixture(prefix: string): Promise<string> {
  const fixturePath = await createTempFixture(prefix);
  fixtures.push(fixturePath);
  return fixturePath;
}

describeWin32('@win32 native-enumerator integration', () => {
  it('loads native addon when built', () => {
    const native = tryLoadNativeReadDirectory();
    if (!native) {
      console.log('[integration] native addon not built — skipping native assertions');
      return;
    }
    expect(typeof native).toBe('function');
  });

  it('native readDirectory returns entries for a simple directory', async () => {
    const native = tryLoadNativeReadDirectory();
    if (!native) {
      return;
    }

    const root = await trackFixture('diskscope-native-int-simple-');
    await writeFileWithSize(path.join(root, 'sample.dat'), 96);

    const entries = await native(root);
    const sample = entries.find((entry) => entry.name === 'sample.dat');
    expect(sample?.isDirectory).toBe(false);
    expect(sample?.isSymlink).toBe(false);
    expect(sample?.sizeBytes).toBe(96);
  });

  it('native vs TS enumerator produce identical scan aggregates on shallow-wide fixture', async () => {
    const native = tryLoadNativeReadDirectory();
    if (!native) {
      return;
    }

    const root = await trackFixture('diskscope-native-int-wide-');
    await createBenchmarkFixture(root, { kind: 'shallow-wide', fileCount: 120 });

    const { result: tsResult } = await runScan({
      scanId: 'int-ts',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: readDirectoryTypeScript,
    });
    const { result: nativeResult } = await runScan({
      scanId: 'int-native',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: native,
    });

    expect(nativeResult.fileCount).toBe(tsResult.fileCount);
    expect(nativeResult.directoryCount).toBe(tsResult.directoryCount);
    expect(nativeResult.totalSizeBytes).toBe(tsResult.totalSizeBytes);
    expect(nativeResult.extensionSummaries).toEqual(tsResult.extensionSummaries);
  });

  it('native vs TS enumerator produce identical scan aggregates on balanced-tree fixture', async () => {
    const native = tryLoadNativeReadDirectory();
    if (!native) {
      return;
    }

    const root = await trackFixture('diskscope-native-int-tree-');
    await createBenchmarkFixture(root, { kind: 'balanced-tree', fileCount: 100 });

    const { result: tsResult } = await runScan({
      scanId: 'int-tree-ts',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: readDirectoryTypeScript,
    });
    const { result: nativeResult } = await runScan({
      scanId: 'int-tree-native',
      rootPath: root,
      tuning: DEFAULT_SCAN_ENGINE_TUNING,
      readDirectory: native,
    });

    expect(nativeResult.fileCount).toBe(tsResult.fileCount);
    expect(nativeResult.totalSizeBytes).toBe(tsResult.totalSizeBytes);
  });

  it('native readDirectory entry fields align with TS on nested fixture', async () => {
    const native = tryLoadNativeReadDirectory();
    if (!native) {
      return;
    }

    const root = await trackFixture('diskscope-native-int-fields-');
    await fs.mkdir(path.join(root, 'child'), { recursive: true });
    await writeFileWithSize(path.join(root, 'top.dat'), 48);
    await writeFileWithSize(path.join(root, 'child', 'nested.dat'), 72);

    const tsEntries = await readDirectoryTypeScript(root);
    const nativeEntries = await native(root);

    for (const tsEntry of tsEntries) {
      const nativeEntry = nativeEntries.find((entry) => entry.name === tsEntry.name);
      expect(nativeEntry).toBeDefined();
      expect(nativeEntry?.isDirectory).toBe(tsEntry.isDirectory);
      expect(nativeEntry?.isSymlink).toBe(tsEntry.isSymlink);
      if (!tsEntry.isDirectory && !tsEntry.isSymlink) {
        expect(nativeEntry?.sizeBytes).toBe(tsEntry.sizeBytes);
      }
    }
  });
});
