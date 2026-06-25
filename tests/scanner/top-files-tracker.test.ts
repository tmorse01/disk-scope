import { describe, expect, it } from 'vitest';
import { TopFilesTracker } from '../../src/scanner/top-files-tracker';

describe('TopFilesTracker', () => {
  it('keeps only the largest N files in descending order', () => {
    const tracker = new TopFilesTracker(2);
    tracker.add({
      path: '/a',
      name: 'a',
      extension: null,
      sizeBytes: 10,
    });
    tracker.add({
      path: '/b',
      name: 'b',
      extension: null,
      sizeBytes: 100,
    });
    tracker.add({
      path: '/c',
      name: 'c',
      extension: null,
      sizeBytes: 1_000,
    });

    expect(tracker.toArray().map((entry) => entry.sizeBytes)).toEqual([1_000, 100]);
  });

  it('formats modifiedAt only when mtimeMs is present', () => {
    const tracker = new TopFilesTracker(1);
    const mtimeMs = Date.parse('2024-06-01T12:00:00.000Z');
    tracker.add({
      path: '/dated',
      name: 'dated',
      extension: '.txt',
      sizeBytes: 42,
      mtimeMs,
    });

    expect(tracker.toArray()[0]?.modifiedAt).toBe('2024-06-01T12:00:00.000Z');
  });
});
