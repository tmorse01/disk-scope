import { describe, expect, it } from 'vitest';
import {
  computeFilesPerSec,
  computeScanDurationMs,
  formatFilesPerSec,
} from '../../src/shared/scan-duration';

describe('scan-duration helpers', () => {
  describe('computeScanDurationMs', () => {
    it('uses durationMs when provided', () => {
      expect(
        computeScanDurationMs({
          startedAt: '2026-01-01T00:00:00.000Z',
          completedAt: '2026-01-01T00:00:10.000Z',
          durationMs: 1234,
        }),
      ).toBe(1234);
    });

    it('derives duration from ISO timestamps', () => {
      expect(
        computeScanDurationMs({
          startedAt: '2026-01-01T00:00:00.000Z',
          completedAt: '2026-01-01T00:00:05.000Z',
        }),
      ).toBe(5000);
    });

    it('returns zero for invalid timestamps', () => {
      expect(
        computeScanDurationMs({
          startedAt: 'invalid',
          completedAt: 'also-invalid',
        }),
      ).toBe(0);
    });
  });

  describe('computeFilesPerSec', () => {
    it('computes throughput from file count and duration', () => {
      expect(computeFilesPerSec(1000, 2000)).toBe(500);
    });

    it('returns zero for invalid inputs', () => {
      expect(computeFilesPerSec(0, 1000)).toBe(0);
      expect(computeFilesPerSec(100, 0)).toBe(0);
    });
  });

  describe('formatFilesPerSec', () => {
    it('formats rounded throughput', () => {
      expect(formatFilesPerSec(1234.6)).toBe('1,235 files/sec');
    });

    it('handles zero throughput', () => {
      expect(formatFilesPerSec(0)).toBe('0 files/sec');
    });
  });
});
