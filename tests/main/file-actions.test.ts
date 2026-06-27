import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  deletePath,
  listDirectoryContents,
} from '../../src/main/services/file-actions';

vi.mock('electron', () => ({
  clipboard: { writeText: vi.fn() },
  shell: { showItemInFolder: vi.fn(), trashItem: vi.fn() },
}));

const { shell } = await import('electron');

describe('listDirectoryContents', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-list-'));
    await fs.writeFile(path.join(tempDir, 'b.txt'), 'bb');
    await fs.writeFile(path.join(tempDir, 'a.txt'), 'aaa');
    await fs.mkdir(path.join(tempDir, 'nested'));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('sorts directories before files then by name', async () => {
    const result = await listDirectoryContents(tempDir);
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.value.map((entry) => `${entry.kind}:${entry.name}`)).toEqual([
      'directory:nested',
      'file:a.txt',
      'file:b.txt',
    ]);
  });
});

describe('deletePath', () => {
  let tempDir: string;
  let targetFile: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-delete-'));
    targetFile = path.join(tempDir, 'remove-me.txt');
    await fs.writeFile(targetFile, 'delete me');
    vi.mocked(shell.trashItem).mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    vi.mocked(shell.trashItem).mockReset();
  });

  it('blocks protected scan root paths', async () => {
    const result = await deletePath(tempDir, 'recycle-bin', [tempDir]);
    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.error.code).toBe('PROTECTED_PATH');
  });

  it('uses recycle bin by default path', async () => {
    const result = await deletePath(targetFile, 'recycle-bin', []);
    expect(result.ok).toBe(true);
    expect(shell.trashItem).toHaveBeenCalledWith(targetFile);
  });

  it('permanently deletes files', async () => {
    const result = await deletePath(targetFile, 'permanent', []);
    expect(result.ok).toBe(true);
    await expect(fs.stat(targetFile)).rejects.toThrow();
  });
});
