import { alpha, getLuminance, type Theme } from '@mui/material/styles';
import type { TreemapItemKind } from './disk-map-utils';

export type TreemapTileStyle = {
  fill: string;
  label: string;
  labelMuted: string;
};

/** Blue (largest) → gray (smallest) anchor fills; interpolated per visible folder set. */
export type TreemapSpectrum = {
  directoryAnchorFills: readonly string[];
  files: TreemapTileStyle;
};

function tileStyle(fill: string, label: string): TreemapTileStyle {
  return {
    fill,
    label,
    labelMuted: alpha(label, 0.85),
  };
}

function labelForFill(fill: string, theme: Theme): Pick<TreemapTileStyle, 'label' | 'labelMuted'> {
  const label = getLuminance(fill) > 0.5 ? theme.palette.text.primary : theme.palette.common.white;
  return { label, labelMuted: alpha(label, 0.85) };
}

function directoryAnchorFills(theme: Theme): string[] {
  const { palette: p } = theme;

  if (theme.palette.mode === 'dark') {
    return [
      p.primary.light,
      p.tertiaryContainer?.main ?? p.primary.light,
      p.tertiary?.main ?? p.info.main,
      p.secondary.light,
      p.surfaceContainerHigh?.main ?? p.secondary.main,
      p.outlineVariant?.main ?? p.secondary.main,
    ].filter((color): color is string => Boolean(color));
  }

  return [
    p.primary.main,
    p.primary.light,
    p.tertiary?.main ?? p.info.main,
    p.tertiaryContainer?.main ?? p.primary.light,
    p.secondary.main,
    p.outline?.main ?? p.secondary.main,
  ].filter((color): color is string => Boolean(color));
}

function parseHexColor(color: string): [number, number, number] | null {
  const hex = color.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    return null;
  }

  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ];
}

function toHexChannel(value: number): string {
  return Math.round(value).toString(16).padStart(2, '0');
}

function blendHexColors(start: string, end: string, fraction: number): string {
  const from = parseHexColor(start);
  const to = parseHexColor(end);

  if (!from || !to) {
    return fraction < 0.5 ? start : end;
  }

  const mix = (left: number, right: number) => left + (right - left) * fraction;
  return `#${toHexChannel(mix(from[0], to[0]))}${toHexChannel(mix(from[1], to[1]))}${toHexChannel(mix(from[2], to[2]))}`;
}

function directoryFillAt(t: number, anchors: readonly string[]): string {
  if (anchors.length === 0) {
    return '#005bbf';
  }

  if (anchors.length === 1 || t <= 0) {
    return anchors[0];
  }

  if (t >= 1) {
    return anchors[anchors.length - 1];
  }

  const scaled = t * (anchors.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, anchors.length - 1);
  const fraction = scaled - lower;

  if (fraction === 0 || lower === upper) {
    return anchors[lower];
  }

  return blendHexColors(anchors[lower], anchors[upper], fraction);
}

/** Theme-derived spectrum endpoints plus a fixed style for the Files tile. */
export function buildTreemapSpectrum(theme: Theme): TreemapSpectrum {
  const { palette: p } = theme;
  const anchors = directoryAnchorFills(theme);

  const files =
    theme.palette.mode === 'dark'
      ? tileStyle(p.secondary.light, p.secondary.dark)
      : tileStyle(p.outline?.main ?? p.secondary.main, p.common.white);

  return {
    directoryAnchorFills: anchors.length > 0 ? anchors : [p.primary.main],
    files,
  };
}

/** Maps rank within the current folder-like tile set onto the blue→gray spectrum. */
export function directoryTileStyle(
  rankIndex: number,
  folderLikeCount: number,
  spectrum: TreemapSpectrum,
  theme: Theme,
): TreemapTileStyle {
  const normalized =
    folderLikeCount <= 1 ? 0 : Math.min(1, Math.max(0, rankIndex / (folderLikeCount - 1)));
  const fill = directoryFillAt(normalized, spectrum.directoryAnchorFills);

  return {
    fill,
    ...labelForFill(fill, theme),
  };
}

export function tileStyleForItem(
  kind: TreemapItemKind,
  rankIndex: number,
  folderLikeCount: number,
  spectrum: TreemapSpectrum,
  theme: Theme,
): TreemapTileStyle {
  if (kind === 'files') {
    return spectrum.files;
  }

  return directoryTileStyle(rankIndex, folderLikeCount, spectrum, theme);
}

export function countFolderLikeTiles(items: ReadonlyArray<{ kind: TreemapItemKind }>): number {
  return items.filter((item) => item.kind === 'directory' || item.kind === 'other').length;
}

export function folderLikeRankById(
  items: ReadonlyArray<{ id: string; kind: TreemapItemKind }>,
): Map<string, number> {
  const ranks = new Map<string, number>();
  let rank = 0;

  for (const item of items) {
    if (item.kind !== 'directory' && item.kind !== 'other') {
      continue;
    }

    ranks.set(item.id, rank);
    rank += 1;
  }

  return ranks;
}
