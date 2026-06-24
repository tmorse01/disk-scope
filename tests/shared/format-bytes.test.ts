import { describe, expect, it } from 'vitest';
import { formatBytes } from '../../src/shared/format-bytes';

describe('formatBytes', () => {
  it('formats zero bytes', () => {
    expect(formatBytes(0)).toBe('0 B');
  });

  it('formats bytes under one kilobyte', () => {
    expect(formatBytes(512)).toBe('512.0 B');
  });

  it('formats kilobytes', () => {
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
  });

  it('formats megabytes and gigabytes', () => {
    expect(formatBytes(1024 ** 2)).toBe('1.0 MB');
    expect(formatBytes(1024 ** 3)).toBe('1.0 GB');
  });

  it('handles non-finite values as zero', () => {
    expect(formatBytes(NaN)).toBe('0 B');
    expect(formatBytes(-100)).toBe('0 B');
  });
});
