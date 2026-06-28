import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatBytes } from '../../../shared/format-bytes';
import { fonts, radii } from '../../theme/tokens';
import { formatPercentOfRoot } from '../largest-folders/folder-tree-utils';
import type { TreemapItem } from './disk-map-utils';
import { layoutSquarifiedTreemap } from './treemap-layout';
import {
  buildTreemapSpectrum,
  countFolderLikeTiles,
  folderLikeRankById,
  tileStyleForItem,
} from './treemap-colors';

const MIN_LABEL_WIDTH = 46;
const MIN_LABEL_HEIGHT = 22;
const MIN_SIZE_LABEL_HEIGHT = 38;
const TILE_GAP = 6;
const TILE_RADIUS = radii.md;
const LABEL_PADDING = 7;

type DiskMapTreemapProps = {
  items: TreemapItem[];
  focusTotalBytes: number;
  onDirectoryClick: (nodeId: string) => void;
};

type PlacedTile = TreemapItem & {
  x: number;
  y: number;
  width: number;
  height: number;
};

function tileTooltip(item: TreemapItem, focusTotalBytes: number): string {
  const percent = formatPercentOfRoot(item.sizeBytes, focusTotalBytes);
  const size = formatBytes(item.sizeBytes);

  if (item.kind === 'other' && item.omittedCount) {
    const preview = item.omittedNames?.join(', ') ?? '';
    const suffix = item.omittedCount > (item.omittedNames?.length ?? 0) ? '…' : '';
    return `${item.name}: ${size} (${percent})\n${item.omittedCount} smaller folders${preview ? `: ${preview}${suffix}` : ''}`;
  }

  if (item.kind === 'files') {
    return `${item.name}: ${size} (${percent})\nDirect files in this folder`;
  }

  return `${item.name}\n${size} (${percent})`;
}

function hoverHint(item: TreemapItem, focusTotalBytes: number): string {
  const percent = formatPercentOfRoot(item.sizeBytes, focusTotalBytes);
  return `${item.name} — ${formatBytes(item.sizeBytes)} (${percent})`;
}

export function DiskMapTreemap({ items, focusTotalBytes, onDirectoryClick }: DiskMapTreemapProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredTile, setHoveredTile] = useState<TreemapItem | null>(null);

  const spectrum = useMemo(() => buildTreemapSpectrum(theme), [theme]);
  const folderLikeCount = useMemo(() => countFolderLikeTiles(items), [items]);
  const folderLikeRanks = useMemo(() => folderLikeRankById(items), [items]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }

      const { width, height } = entry.contentRect;
      setSize({ width: Math.floor(width), height: Math.floor(height) });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const placedTiles = useMemo((): PlacedTile[] => {
    if (size.width <= 0 || size.height <= 0 || items.length === 0) {
      return [];
    }

    const layout = layoutSquarifiedTreemap(
      items.map((item) => ({ id: item.id, value: item.sizeBytes })),
      size.width,
      size.height,
    );

    const itemById = new Map(items.map((item) => [item.id, item]));

    return layout
      .map((rect) => {
        const item = itemById.get(rect.id);
        if (!item) {
          return null;
        }

        return {
          ...item,
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        };
      })
      .filter((tile): tile is PlacedTile => tile != null);
  }, [items, size.height, size.width]);

  const tileStroke = theme.palette.background.paper;
  const accentStroke = theme.palette.primary.main;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        flex: 1,
        minHeight: 420,
        height: '100%',
        gap: 1,
      }}
    >
      {items.length > 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ flexShrink: 0, minHeight: 20 }}>
          {hoveredTile ? hoverHint(hoveredTile, focusTotalBytes) : 'Hover a folder for details'}
        </Typography>
      ) : null}

      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        {size.width > 0 && size.height > 0 ? (
          <Box
            component="svg"
            width={size.width}
            height={size.height}
            role="img"
            aria-label="Disk usage treemap"
            sx={{ display: 'block' }}
          >
            {placedTiles.map((tile) => {
              const inset = TILE_GAP / 2;
              const width = Math.max(0, tile.width - TILE_GAP);
              const height = Math.max(0, tile.height - TILE_GAP);
              const showName = width >= MIN_LABEL_WIDTH && height >= MIN_LABEL_HEIGHT;
              const showSize = showName && height >= MIN_SIZE_LABEL_HEIGHT;
              const isDrillable = tile.kind === 'directory';
              const isHovered = hoveredTile?.id === tile.id;
              const folderRank = folderLikeRanks.get(tile.id) ?? 0;
              const tileColors = tileStyleForItem(
                tile.kind,
                folderRank,
                folderLikeCount,
                spectrum,
                theme,
              );
              const nameY = height - (showSize ? 28 : 14);
              const sizeY = height - 10;
              const clipId = `treemap-clip-${tile.id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

              return (
                <g
                  key={tile.id}
                  transform={`translate(${tile.x + inset},${tile.y + inset})`}
                  role={isDrillable ? 'button' : undefined}
                  tabIndex={isDrillable ? 0 : undefined}
                  aria-label={tileTooltip(tile, focusTotalBytes)}
                  style={{ cursor: isDrillable ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (isDrillable) {
                      onDirectoryClick(tile.id);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (isDrillable && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      onDirectoryClick(tile.id);
                    }
                  }}
                  onMouseEnter={() => setHoveredTile(tile)}
                  onMouseLeave={() =>
                    setHoveredTile((current) => (current?.id === tile.id ? null : current))
                  }
                  onFocus={() => setHoveredTile(tile)}
                  onBlur={() =>
                    setHoveredTile((current) => (current?.id === tile.id ? null : current))
                  }
                >
                  <title>{tileTooltip(tile, focusTotalBytes)}</title>
                  {showName ? (
                    <clipPath id={clipId}>
                      <rect
                        width={Math.max(0, width - LABEL_PADDING * 2)}
                        height={height - 6}
                        x={LABEL_PADDING - 2}
                        y={3}
                      />
                    </clipPath>
                  ) : null}
                  <rect
                    width={width}
                    height={height}
                    fill={tileColors.fill}
                    fillOpacity={isHovered ? 1 : 0.86}
                    stroke={isHovered && isDrillable ? accentStroke : tileStroke}
                    strokeWidth={isHovered && isDrillable ? 2.5 : 1}
                    rx={TILE_RADIUS}
                  />
                  {showName ? (
                    <>
                      <text
                        clipPath={`url(#${clipId})`}
                        x={LABEL_PADDING}
                        y={nameY}
                        fill={tileColors.label}
                        fontSize={12}
                        fontWeight={600}
                        fontFamily={theme.typography.fontFamily}
                        pointerEvents="none"
                      >
                        {tile.name}
                      </text>
                      {showSize ? (
                        <text
                          clipPath={`url(#${clipId})`}
                          x={LABEL_PADDING}
                          y={sizeY}
                          fill={tileColors.labelMuted}
                          fontSize={11}
                          fontFamily={fonts.mono}
                          pointerEvents="none"
                        >
                          {formatBytes(tile.sizeBytes)}
                        </text>
                      ) : null}
                    </>
                  ) : null}
                </g>
              );
            })}
          </Box>
        ) : null}

        {items.length === 0 ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              px: 3,
            }}
          >
            <Typography variant="body2" color="text.secondary" align="center">
              No sized items to display in this folder.
            </Typography>
          </Box>
        ) : null}
      </Box>
    </Box>
  );
}
