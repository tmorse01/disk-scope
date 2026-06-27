import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

vi.mock('node:child_process', () => ({
  spawn: vi.fn(),
}));

import { spawn } from 'node:child_process';
import { dropWindowsStandbyCache } from '../../src/main/services/filesystem-cache';

type MockChild = EventEmitter & {
  stderr: EventEmitter;
};

function createMockChild(): MockChild {
  const child = new EventEmitter() as MockChild;
  child.stderr = new EventEmitter();
  return child;
}

describe('dropWindowsStandbyCache', () => {
  it('no-ops on non-Windows platforms', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'linux' });

    const result = await dropWindowsStandbyCache();

    Object.defineProperty(process, 'platform', { value: originalPlatform });
    expect(result).toEqual({ ok: true, value: undefined });
    expect(spawn).not.toHaveBeenCalled();
  });

  it('returns success when PowerShell exits with code 0 on Windows', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const child = createMockChild();
    vi.mocked(spawn).mockReturnValue(child as never);

    const promise = dropWindowsStandbyCache();
    child.emit('close', 0);

    await expect(promise).resolves.toEqual({ ok: true, value: undefined });

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  it('maps access denied exit codes to a helpful message', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });

    const child = createMockChild();
    vi.mocked(spawn).mockReturnValue(child as never);

    const promise = dropWindowsStandbyCache();
    child.emit('close', 5);

    await expect(promise).resolves.toEqual({
      ok: false,
      error: {
        code: 'ACCESS_DENIED',
        message:
          'Could not clear filesystem cache. Run DiskScope as Administrator for cold-scan benchmarks.',
      },
    });

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });
});
