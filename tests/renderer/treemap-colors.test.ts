import { describe, expect, it } from 'vitest';
import {
  buildTreemapSpectrum,
  countFolderLikeTiles,
  directoryTileStyle,
  folderLikeRankById,
  tileStyleForItem,
} from '../../src/renderer/features/disk-map/treemap-colors';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

describe('buildTreemapSpectrum', () => {
  it('returns blue-to-gray anchor fills and a distinct files style', () => {
    const spectrum = buildTreemapSpectrum(muiTheme);

    expect(spectrum.directoryAnchorFills.length).toBeGreaterThan(1);
    expect(spectrum.directoryAnchorFills[0]).not.toBe(
      spectrum.directoryAnchorFills[spectrum.directoryAnchorFills.length - 1],
    );
    expect(spectrum.files.fill).not.toBe(spectrum.directoryAnchorFills[0]);
  });

  it('does not use light surface greys as anchor endpoints', () => {
    const spectrum = buildTreemapSpectrum(muiTheme);
    const lightGreys = ['#e7e8e9', '#edeeef', '#f3f4f5', '#ffffff'];

    for (const fill of spectrum.directoryAnchorFills) {
      expect(lightGreys).not.toContain(fill.toLowerCase());
    }
  });
});

describe('directoryTileStyle', () => {
  const spectrum = buildTreemapSpectrum(muiTheme);

  it('uses the blue end for a single visible folder', () => {
    const style = directoryTileStyle(0, 1, spectrum, muiTheme);
    expect(style.fill).toBe(spectrum.directoryAnchorFills[0]);
  });

  it('spreads two folders across blue and gray endpoints', () => {
    const largest = directoryTileStyle(0, 2, spectrum, muiTheme);
    const smallest = directoryTileStyle(1, 2, spectrum, muiTheme);

    expect(largest.fill).toBe(spectrum.directoryAnchorFills[0]);
    expect(smallest.fill).toBe(spectrum.directoryAnchorFills[spectrum.directoryAnchorFills.length - 1]);
    expect(largest.fill).not.toBe(smallest.fill);
  });

  it('uses intermediate colors for middle ranks in a larger set', () => {
    const count = 5;
    const fills = Array.from({ length: count }, (_, rank) =>
      directoryTileStyle(rank, count, spectrum, muiTheme).fill,
    );

    expect(fills[0]).toBe(spectrum.directoryAnchorFills[0]);
    expect(fills[count - 1]).toBe(spectrum.directoryAnchorFills[spectrum.directoryAnchorFills.length - 1]);
    expect(new Set(fills).size).toBeGreaterThan(2);
  });

  it('assigns readable label colors for interpolated fills', () => {
    const style = directoryTileStyle(2, 5, spectrum, muiTheme);
    expect(style.label).toBeTruthy();
    expect(style.label).not.toBe(style.fill);
  });
});

describe('folderLikeRankById', () => {
  it('ranks directories and other by visible sort order, skipping files', () => {
    const ranks = folderLikeRankById([
      { id: 'a', kind: 'directory' },
      { id: 'b', kind: 'files' },
      { id: 'c', kind: 'other' },
      { id: 'd', kind: 'directory' },
    ]);

    expect(ranks.get('a')).toBe(0);
    expect(ranks.get('c')).toBe(1);
    expect(ranks.get('d')).toBe(2);
    expect(ranks.has('b')).toBe(false);
  });
});

describe('countFolderLikeTiles', () => {
  it('counts directories and other but not files', () => {
    expect(
      countFolderLikeTiles([
        { kind: 'directory' },
        { kind: 'directory' },
        { kind: 'other' },
        { kind: 'files' },
      ]),
    ).toBe(3);
  });
});

describe('tileStyleForItem', () => {
  const spectrum = buildTreemapSpectrum(muiTheme);

  it('returns the fixed files style regardless of rank', () => {
    expect(tileStyleForItem('files', 0, 3, spectrum, muiTheme)).toEqual(spectrum.files);
    expect(tileStyleForItem('files', 2, 3, spectrum, muiTheme)).toEqual(spectrum.files);
  });

  it('distributes other tiles along the folder spectrum', () => {
    const onlyOther = tileStyleForItem('other', 0, 1, spectrum, muiTheme);
    const grayEnd = directoryTileStyle(1, 2, spectrum, muiTheme);

    expect(onlyOther.fill).toBe(spectrum.directoryAnchorFills[0]);
    expect(tileStyleForItem('other', 1, 2, spectrum, muiTheme).fill).toBe(grayEnd.fill);
  });
});
