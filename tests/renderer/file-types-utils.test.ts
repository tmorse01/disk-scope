import { describe, expect, it } from 'vitest';
import type { ExtensionSummary } from '../../src/shared/types';
import { sortExtensionSummaries } from '../../src/renderer/features/file-types/file-types-utils';
import { formatExtensionLabel } from '../../src/renderer/features/file-types/extension-label';

const sampleSummaries: ExtensionSummary[] = [
  { extension: '.txt', sizeBytes: 300, fileCount: 3 },
  { extension: null, sizeBytes: 120, fileCount: 2 },
  { extension: '.zip', sizeBytes: 900, fileCount: 1 },
];

describe('extension grouping display', () => {
  it('labels files without an extension', () => {
    expect(formatExtensionLabel(null)).toBe('[no extension]');
  });

  it('keeps distinct extension groups including no-extension rows', () => {
    const labels = sampleSummaries.map((summary) => formatExtensionLabel(summary.extension));
    expect(labels).toEqual(['.txt', '[no extension]', '.zip']);
  });
});

describe('sortExtensionSummaries', () => {
  it('sorts by total size descending', () => {
    const sorted = sortExtensionSummaries(sampleSummaries, 'sizeBytes', 'desc');
    expect(sorted.map((summary) => summary.extension)).toEqual(['.zip', '.txt', null]);
  });

  it('sorts by file count ascending', () => {
    const sorted = sortExtensionSummaries(sampleSummaries, 'fileCount', 'asc');
    expect(sorted.map((summary) => summary.fileCount)).toEqual([1, 2, 3]);
  });

  it('sorts by extension name ascending with no-extension last', () => {
    const sorted = sortExtensionSummaries(sampleSummaries, 'extension', 'asc');
    expect(sorted.map((summary) => formatExtensionLabel(summary.extension))).toEqual([
      '.txt',
      '.zip',
      '[no extension]',
    ]);
  });

  it('returns a new array without mutating the input', () => {
    const input = [...sampleSummaries];
    const sorted = sortExtensionSummaries(input, 'sizeBytes', 'asc');

    expect(sorted).not.toBe(input);
    expect(input.map((summary) => summary.extension)).toEqual(['.txt', null, '.zip']);
  });
});
