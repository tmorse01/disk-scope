import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import type { AppPreferences, ExclusionKind, ScanExclusion } from '../../shared/types';

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'light',
  exclusions: [],
  confirmBeforeDelete: true,
  defaultDeleteMethod: 'recycle-bin',
  developerCleanupEnabled: false,
  autoCheckForUpdates: true,
};

let cachedPreferences: AppPreferences | null = null;
let preferencesPathResolver: (() => string) | null = null;

function defaultPreferencesPath(): string {
  return path.join(app.getPath('userData'), 'preferences.json');
}

export function resolvePreferencesFilePath(): string {
  return preferencesPathResolver?.() ?? defaultPreferencesPath();
}

export function configurePreferencesFilePath(resolver: () => string): void {
  preferencesPathResolver = resolver;
  cachedPreferences = null;
}

export function resetPreferencesFilePathConfiguration(): void {
  preferencesPathResolver = null;
  cachedPreferences = null;
}

function isExclusionKind(value: unknown): value is ExclusionKind {
  return value === 'path' || value === 'folder-name';
}

function normalizeExclusion(value: unknown): ScanExclusion | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  const id = typeof record.id === 'string' ? record.id.trim() : '';
  const kind = record.kind;
  const rawValue = typeof record.value === 'string' ? record.value.trim() : '';

  if (!id || !isExclusionKind(kind) || !rawValue) {
    return null;
  }

  return {
    id,
    kind,
    value: rawValue,
  };
}

export function normalizePreferences(value: unknown): AppPreferences {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const record = value as Record<string, unknown>;
  const theme = record.theme === 'dark' ? 'dark' : 'light';
  const exclusions = Array.isArray(record.exclusions)
    ? record.exclusions
        .map((entry) => normalizeExclusion(entry))
        .filter((entry): entry is ScanExclusion => entry !== null)
    : [];

  const confirmBeforeDelete = record.confirmBeforeDelete !== false;
  const defaultDeleteMethod =
    record.defaultDeleteMethod === 'permanent' ? 'permanent' : 'recycle-bin';
  const developerCleanupEnabled = record.developerCleanupEnabled === true;
  const autoCheckForUpdates = record.autoCheckForUpdates !== false;

  return {
    theme,
    exclusions,
    confirmBeforeDelete,
    defaultDeleteMethod,
    developerCleanupEnabled,
    autoCheckForUpdates,
  };
}

export async function loadPreferences(): Promise<AppPreferences> {
  if (cachedPreferences) {
    return cachedPreferences;
  }

  try {
    const raw = await fs.readFile(resolvePreferencesFilePath(), 'utf-8');
    cachedPreferences = normalizePreferences(JSON.parse(raw));
  } catch {
    cachedPreferences = { ...DEFAULT_PREFERENCES };
  }

  return cachedPreferences;
}

export function getPreferencesSync(): AppPreferences {
  return cachedPreferences ?? { ...DEFAULT_PREFERENCES };
}

export async function savePreferences(preferences: AppPreferences): Promise<AppPreferences> {
  const normalized = normalizePreferences(preferences);
  cachedPreferences = normalized;

  const filePath = resolvePreferencesFilePath();
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf-8');

  return normalized;
}

export async function initPreferencesStore(): Promise<void> {
  await loadPreferences();
}
