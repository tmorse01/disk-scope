import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type {
  PersistedScanHistoryEntry,
  ScanHistoryFile,
  ScanHistoryHydrationPayload,
  ScanHistoryHydrationEntry,
  ScanResult,
  ScanSessionId,
} from '../../shared/types';

export const MAX_SCAN_HISTORY = 10;
export const MAX_ENTRY_BYTES = 50 * 1024 * 1024;

const SCAN_HISTORY_FILE_VERSION = 1;

const EMPTY_FILE: ScanHistoryFile = {
  version: SCAN_HISTORY_FILE_VERSION,
  lastSelectedPaths: [],
  entries: [],
};

let cachedFile: ScanHistoryFile | null = null;
let historyPathResolver: (() => string) | null = null;

function defaultHistoryFilePath(): string {
  return path.join(app.getPath('userData'), 'scan-history.json');
}

export function resolveScanHistoryFilePath(): string {
  return historyPathResolver?.() ?? defaultHistoryFilePath();
}

export function configureScanHistoryFilePath(resolver: () => string): void {
  historyPathResolver = resolver;
  cachedFile = null;
}

export function resetScanHistoryFilePathConfiguration(): void {
  historyPathResolver = null;
  cachedFile = null;
}

function isScanResult(value: unknown): value is ScanResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.scanId === 'string' &&
    typeof record.rootPath === 'string' &&
    typeof record.startedAt === 'string' &&
    typeof record.completedAt === 'string' &&
    typeof record.durationMs === 'number' &&
    typeof record.totalSizeBytes === 'number' &&
    typeof record.fileCount === 'number' &&
    typeof record.directoryCount === 'number' &&
    typeof record.errorCount === 'number' &&
    typeof record.rootNodeId === 'string' &&
    typeof record.directoriesById === 'object' &&
    Array.isArray(record.largestFiles) &&
    Array.isArray(record.extensionSummaries) &&
    Array.isArray(record.cleanupCandidates) &&
    Array.isArray(record.errors)
  );
}

function normalizeEntry(value: unknown): PersistedScanHistoryEntry | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const scanId = typeof record.scanId === 'string' ? record.scanId.trim() : '';
  const status = record.status === 'cancelled' ? 'cancelled' : record.status === 'completed' ? 'completed' : null;
  const savedAt = typeof record.savedAt === 'string' ? record.savedAt : '';
  const developerCleanupEnabledAtScan = record.developerCleanupEnabledAtScan === true;

  if (!scanId || !status || !savedAt || !isScanResult(record.result)) {
    return null;
  }

  if (record.result.scanId !== scanId) {
    return null;
  }

  return {
    scanId,
    status,
    developerCleanupEnabledAtScan,
    savedAt,
    result: record.result,
  };
}

export function normalizeScanHistoryFile(value: unknown): ScanHistoryFile {
  if (!value || typeof value !== 'object') {
    return { ...EMPTY_FILE, entries: [] };
  }

  const record = value as Record<string, unknown>;
  const lastSelectedPaths = Array.isArray(record.lastSelectedPaths)
    ? record.lastSelectedPaths.filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
    : [];
  const entries = Array.isArray(record.entries)
    ? record.entries
        .map((entry) => normalizeEntry(entry))
        .filter((entry): entry is PersistedScanHistoryEntry => entry !== null)
        .slice(0, MAX_SCAN_HISTORY)
    : [];

  return {
    version: SCAN_HISTORY_FILE_VERSION,
    lastSelectedPaths,
    entries,
  };
}

async function atomicWriteJson(filePath: string, data: unknown): Promise<void> {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = `${filePath}.${process.pid}.tmp`;
  const content = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(tempPath, content, 'utf-8');
  await fs.rename(tempPath, filePath);
}

async function readHistoryFile(): Promise<ScanHistoryFile> {
  if (cachedFile) {
    return cachedFile;
  }

  try {
    const raw = await fs.readFile(resolveScanHistoryFilePath(), 'utf-8');
    cachedFile = normalizeScanHistoryFile(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.warn('[scan-history-store] Corrupt scan history file; starting empty.');
    }
    cachedFile = { ...EMPTY_FILE, entries: [] };
  }

  return cachedFile;
}

async function writeHistoryFile(file: ScanHistoryFile): Promise<void> {
  cachedFile = file;
  await atomicWriteJson(resolveScanHistoryFilePath(), file);
}

export async function loadScanHistory(): Promise<ScanHistoryFile> {
  return readHistoryFile();
}

export async function pathExistsOnDisk(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function filterExistingPaths(paths: string[]): Promise<string[]> {
  const existing: string[] = [];
  for (const entry of paths) {
    if (await pathExistsOnDisk(entry)) {
      existing.push(entry);
    }
  }
  return existing;
}

export async function buildScanHistoryHydrationPayload(): Promise<ScanHistoryHydrationPayload> {
  const file = await loadScanHistory();
  const lastSelectedPaths = await filterExistingPaths(file.lastSelectedPaths);

  const entries: ScanHistoryHydrationEntry[] = [];
  for (const entry of file.entries) {
    entries.push({
      scanId: entry.scanId,
      status: entry.status,
      developerCleanupEnabledAtScan: entry.developerCleanupEnabledAtScan,
      savedAt: entry.savedAt,
      result: entry.result,
      rootPathMissing: !(await pathExistsOnDisk(entry.result.rootPath)),
    });
  }

  return {
    entries,
    lastSelectedPaths,
  };
}

export function entryExceedsSizeLimit(entry: PersistedScanHistoryEntry): boolean {
  try {
    return Buffer.byteLength(JSON.stringify(entry), 'utf-8') > MAX_ENTRY_BYTES;
  } catch {
    return true;
  }
}

export async function appendScanHistory(entry: Omit<PersistedScanHistoryEntry, 'savedAt'>): Promise<void> {
  if (entryExceedsSizeLimit({ ...entry, savedAt: new Date().toISOString() })) {
    console.warn(
      `[scan-history-store] Skipping persist for scan ${entry.scanId}: entry exceeds ${MAX_ENTRY_BYTES} bytes.`,
    );
    return;
  }

  const file = await readHistoryFile();
  const savedAt = new Date().toISOString();
  const persisted: PersistedScanHistoryEntry = { ...entry, savedAt };

  const entries = [
    persisted,
    ...file.entries.filter((existing) => existing.scanId !== entry.scanId),
  ].slice(0, MAX_SCAN_HISTORY);

  await writeHistoryFile({
    ...file,
    entries,
  });
}

export async function saveLastSelectedPaths(paths: string[]): Promise<void> {
  const normalized = paths.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
  const file = await readHistoryFile();

  await writeHistoryFile({
    ...file,
    lastSelectedPaths: normalized,
  });
}

export async function clearScanHistory(): Promise<void> {
  const file = await readHistoryFile();
  await writeHistoryFile({
    ...file,
    entries: [],
  });
}

export async function initScanHistoryStore(): Promise<ScanHistoryFile> {
  return loadScanHistory();
}

export function getPersistedScanResults(): Map<ScanSessionId, ScanResult> {
  const results = new Map<ScanSessionId, ScanResult>();
  if (!cachedFile) {
    return results;
  }

  for (const entry of cachedFile.entries) {
    results.set(entry.scanId, entry.result);
  }

  return results;
}
