import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  getE2eAutostartConfig,
  getE2eScanRoot,
  isE2eMode,
} from '../../src/main/services/e2e-autostart';

describe('e2e-autostart', () => {
  const originalEnv = { ...process.env };
  let tempRoot: string;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-e2e-unit-'));
  });

  afterEach(async () => {
    process.env = { ...originalEnv };
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it('is disabled without DISKSCOPE_E2E', () => {
    delete process.env.DISKSCOPE_E2E;
    expect(isE2eMode()).toBe(false);
    expect(getE2eScanRoot()).toBeNull();
    expect(getE2eAutostartConfig()).toBeNull();
  });

  it('returns autostart config when env and scan root are set', async () => {
    process.env.DISKSCOPE_E2E = '1';
    process.env.DISKSCOPE_E2E_SCAN_ROOT = tempRoot;

    expect(isE2eMode()).toBe(true);
    expect(getE2eScanRoot()).toBe(tempRoot);
    expect(getE2eAutostartConfig()).toEqual({ rootPath: tempRoot });
  });

  it('returns null when scan root path is missing', () => {
    process.env.DISKSCOPE_E2E = '1';
    delete process.env.DISKSCOPE_E2E_SCAN_ROOT;

    expect(getE2eAutostartConfig()).toBeNull();
  });
});
