import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { PersistedScanHistoryEntry, ScanResult } from '../../src/shared/types';
import {
  appendScanHistory,
  clearScanHistory,
  configureScanHistoryFilePath,
  loadScanHistory,
  MAX_SCAN_HISTORY,
  normalizeScanHistoryFile,
  resetScanHistoryFilePathConfiguration,
  saveLastSelectedPaths,
} from '../../src/main/services/scan-history-store';

function makeScanResult(scanId: string, rootPath: string): ScanResult {
  return {
    scanId,
    rootPath,
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:05.000Z',
    durationMs: 5000,
    totalSizeBytes: 1024,
    fileCount: 10,
    directoryCount: 2,
    errorCount: 0,
    rootNodeId: 'root',
    directoriesById: {},
    largestFiles: [],
    extensionSummaries: [],
    cleanupCandidates: [],
    errors: [],
  };
}

function makeEntry(scanId: string, rootPath: string): Omit<PersistedScanHistoryEntry, 'savedAt'> {
  return {
    scanId,
    status: 'completed',
    developerCleanupEnabledAtScan: false,
    result: makeScanResult(scanId, rootPath),
  };
}

describe('scan-history-store', () => {
  let tempDir: string;
  let historyFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-history-'));
    historyFilePath = path.join(tempDir, 'scan-history.json');
    configureScanHistoryFilePath(() => historyFilePath);
  });

  afterEach(async () => {
    resetScanHistoryFilePathConfiguration();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns empty history when no file exists', async () => {
    const file = await loadScanHistory();

    expect(file.entries).toEqual([]);
    expect(file.lastSelectedPaths).toEqual([]);
  });

  it('round-trips scan history entries', async () => {
    await appendScanHistory(makeEntry('scan-1', 'C:\\Demo'));

    resetScanHistoryFilePathConfiguration();
    configureScanHistoryFilePath(() => historyFilePath);

    const reloaded = await loadScanHistory();
    expect(reloaded.entries).toHaveLength(1);
    expect(reloaded.entries[0]?.scanId).toBe('scan-1');
    expect(reloaded.entries[0]?.result.rootPath).toBe('C:\\Demo');
    expect(reloaded.entries[0]?.savedAt).toMatch(/^\d{4}-/);
  });

  it('prepends entries and trims to max history', async () => {
    for (let index = 0; index < MAX_SCAN_HISTORY + 2; index += 1) {
      await appendScanHistory(makeEntry(`scan-${index}`, `C:\\Demo\\${index}`));
    }

    const file = await loadScanHistory();
    expect(file.entries).toHaveLength(MAX_SCAN_HISTORY);
    expect(file.entries[0]?.scanId).toBe(`scan-${MAX_SCAN_HISTORY + 1}`);
    expect(file.entries[MAX_SCAN_HISTORY - 1]?.scanId).toBe('scan-2');
  });

  it('dedupes entries by scan id', async () => {
    await appendScanHistory(makeEntry('scan-a', 'C:\\First'));
    await appendScanHistory(makeEntry('scan-b', 'C:\\Second'));
    await appendScanHistory({
      ...makeEntry('scan-a', 'C:\\First-Updated'),
      status: 'cancelled',
    });

    const file = await loadScanHistory();
    expect(file.entries).toHaveLength(2);
    expect(file.entries[0]?.scanId).toBe('scan-a');
    expect(file.entries[0]?.status).toBe('cancelled');
    expect(file.entries[0]?.result.rootPath).toBe('C:\\First-Updated');
  });

  it('persists last selected paths', async () => {
    await saveLastSelectedPaths(['C:\\Projects', 'D:\\Archive']);

    resetScanHistoryFilePathConfiguration();
    configureScanHistoryFilePath(() => historyFilePath);

    const file = await loadScanHistory();
    expect(file.lastSelectedPaths).toEqual(['C:\\Projects', 'D:\\Archive']);
  });

  it('clears scan history entries while keeping last selected paths', async () => {
    await appendScanHistory(makeEntry('scan-1', 'C:\\Demo'));
    await saveLastSelectedPaths(['C:\\Demo']);
    await clearScanHistory();

    const file = await loadScanHistory();
    expect(file.entries).toEqual([]);
    expect(file.lastSelectedPaths).toEqual(['C:\\Demo']);
  });

  it('recovers from corrupt file content', async () => {
    await fs.writeFile(historyFilePath, '{ not valid json', 'utf-8');

    resetScanHistoryFilePathConfiguration();
    configureScanHistoryFilePath(() => historyFilePath);

    const file = await loadScanHistory();
    expect(file.entries).toEqual([]);
  });

  it('drops invalid entries when normalizing', () => {
    expect(
      normalizeScanHistoryFile({
        version: 1,
        lastSelectedPaths: ['C:\\Valid', '', 42],
        entries: [
          {
            scanId: 'ok',
            status: 'completed',
            developerCleanupEnabledAtScan: false,
            savedAt: '2026-01-01T00:00:00.000Z',
            result: makeScanResult('ok', 'C:\\Valid'),
          },
          {
            scanId: 'bad',
            status: 'completed',
            developerCleanupEnabledAtScan: false,
            savedAt: '2026-01-01T00:00:00.000Z',
            result: { scanId: 'mismatch' },
          },
        ],
      }),
    ).toEqual({
      version: 1,
      lastSelectedPaths: ['C:\\Valid'],
      entries: [
        expect.objectContaining({
          scanId: 'ok',
          result: expect.objectContaining({ rootPath: 'C:\\Valid' }),
        }),
      ],
    });
  });

  it('writes atomically via temp file rename', async () => {
    await appendScanHistory(makeEntry('scan-1', 'C:\\Demo'));

    const raw = await fs.readFile(historyFilePath, 'utf-8');
    const parsed = JSON.parse(raw);
    expect(parsed.entries[0].scanId).toBe('scan-1');

    const tempFiles = await fs.readdir(tempDir);
    expect(tempFiles.some((name) => name.endsWith('.tmp'))).toBe(false);
  });
});
