import { describe, expect, it } from 'vitest';
import type { LargestFileEntry } from '../../src/shared/types';
import {
  sortLargestFiles,
  type LargestFileSortKey,
} from '../../src/renderer/features/largest-files/largest-files-utils';

const sampleFiles: LargestFileEntry[] = [
  {
    path: 'C:\\data\\readme',
    name: 'readme',
    extension: null,
    sizeBytes: 50,
    modifiedAt: '2026-01-03T00:00:00.000Z',
  },
  {
    path: 'C:\\data\\archive.zip',
    name: 'archive.zip',
    extension: '.zip',
    sizeBytes: 500,
    modifiedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    path: 'C:\\data\\notes.txt',
    name: 'notes.txt',
    extension: '.txt',
    sizeBytes: 100,
    modifiedAt: '2026-01-02T00:00:00.000Z',
  },
];

describe('sortLargestFiles', () => {
  it('sorts by size descending by default usage', () => {
    const sorted = sortLargestFiles(sampleFiles, 'sizeBytes', 'desc');
    expect(sorted.map((entry) => entry.sizeBytes)).toEqual([500, 100, 50]);
  });

  it('sorts by name ascending', () => {
    const sorted = sortLargestFiles(sampleFiles, 'name', 'asc');
    expect(sorted.map((entry) => entry.name)).toEqual(['archive.zip', 'notes.txt', 'readme']);
  });

  it('groups null extensions under the no-extension label when sorting by extension', () => {
    const sorted = sortLargestFiles(sampleFiles, 'extension', 'asc');
    expect(sorted[0]?.extension).toBe('.txt');
    expect(sorted.at(-1)?.extension).toBeNull();
  });

  it('sorts by modified date descending', () => {
    const sorted = sortLargestFiles(sampleFiles, 'modifiedAt', 'desc');
    expect(sorted.map((entry) => entry.name)).toEqual(['readme', 'notes.txt', 'archive.zip']);
  });

  it('returns a new array without mutating the input', () => {
    const input = [...sampleFiles];
    const sorted = sortLargestFiles(input, 'path', 'asc');

    expect(sorted).not.toBe(input);
    expect(input.map((entry) => entry.name)).toEqual(['readme', 'archive.zip', 'notes.txt']);
  });

  it.each<[LargestFileSortKey]>([
    ['name'],
    ['path'],
    ['sizeBytes'],
    ['extension'],
    ['modifiedAt'],
  ])('supports ascending and descending order for %s', (sortKey) => {
    const ascending = sortLargestFiles(sampleFiles, sortKey, 'asc');
    const descending = sortLargestFiles(sampleFiles, sortKey, 'desc');

    expect(ascending).not.toEqual(descending);
    expect(ascending.toReversed()).toEqual(descending);
  });
});

describe('top N largest files presentation', () => {
  it('preserves scanner-provided top N ordering when sorted by size descending', () => {
    const topN: LargestFileEntry[] = [
      {
        path: 'C:\\data\\large.bin',
        name: 'large.bin',
        extension: '.bin',
        sizeBytes: 1_000,
      },
      {
        path: 'C:\\data\\medium.bin',
        name: 'medium.bin',
        extension: '.bin',
        sizeBytes: 100,
      },
    ];

    const sorted = sortLargestFiles(topN, 'sizeBytes', 'desc');
    expect(sorted).toHaveLength(2);
    expect(sorted.map((entry) => entry.sizeBytes)).toEqual([1_000, 100]);
  });
});
