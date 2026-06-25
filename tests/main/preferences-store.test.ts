import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  configurePreferencesFilePath,
  loadPreferences,
  normalizePreferences,
  resetPreferencesFilePathConfiguration,
  savePreferences,
} from '../../src/main/services/preferences-store';

describe('preferences-store', () => {
  let tempDir: string;
  let preferencesFilePath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-prefs-'));
    preferencesFilePath = path.join(tempDir, 'preferences.json');
    configurePreferencesFilePath(() => preferencesFilePath);
  });

  afterEach(async () => {
    resetPreferencesFilePathConfiguration();
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns defaults when no file exists', async () => {
    const preferences = await loadPreferences();

    expect(preferences).toEqual({
      theme: 'light',
      exclusions: [],
    });
  });

  it('persists and reloads exclusions', async () => {
    await savePreferences({
      theme: 'dark',
      exclusions: [
        { id: 'ex-1', kind: 'folder-name', value: 'node_modules' },
        { id: 'ex-2', kind: 'path', value: 'C:\\Temp\\skip' },
      ],
    });

    resetPreferencesFilePathConfiguration();
    configurePreferencesFilePath(() => preferencesFilePath);

    const reloaded = await loadPreferences();
    expect(reloaded.theme).toBe('dark');
    expect(reloaded.exclusions).toEqual([
      { id: 'ex-1', kind: 'folder-name', value: 'node_modules' },
      { id: 'ex-2', kind: 'path', value: 'C:\\Temp\\skip' },
    ]);
  });

  it('drops invalid exclusion entries when normalizing', () => {
    expect(
      normalizePreferences({
        theme: 'light',
        exclusions: [
          { id: 'ok', kind: 'path', value: 'C:\\valid' },
          { id: '', kind: 'path', value: 'C:\\invalid' },
          { id: 'bad-kind', kind: 'regex', value: '.*' },
        ],
      }),
    ).toEqual({
      theme: 'light',
      exclusions: [{ id: 'ok', kind: 'path', value: 'C:\\valid' }],
    });
  });
});
