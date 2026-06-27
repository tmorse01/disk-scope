import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatBytes } from '../../../shared/format-bytes';
import { formatPercentOfRoot } from '../largest-folders/folder-tree-utils';
import type { TreemapItem } from './disk-map-utils';
import { layoutSquarifiedTreemap } from './treemap-layout';
import { OTHER_TILE_COLOR, colorForFolderName } from './treemap-colors';

const MIN_LABEL_WIDTH = 48;
const MIN_LABEL_HEIGHT = 28;
const TILE_GAP = 1;

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

function tileFill(item: TreemapItem, filesColor: string): string {
  if (item.kind === 'files') {
    return filesColor;
  }

  if (item.kind === 'other') {
    return OTHER_TILE_COLOR;
  }

  return colorForFolderName(item.name);
}

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

function truncateLabel(label: string, maxChars: number): string {
  if (label.length <= maxChars) {
    return label;
  }

  return `${label.slice(0, Math.max(1, maxChars - 1))}…`;
}

export function DiskMapTreemap({ items, focusTotalBytes, onDirectoryClick }: DiskMapTreemapProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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

  const filesColor = theme.palette.primary.main;

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: 420,
        height: 'min(70vh, 640px)',
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
            const x = tile.x + inset;
            const y = tile.y + inset;
            const width = Math.max(0, tile.width - TILE_GAP);
            const height = Math.max(0, tile.height - TILE_GAP);
            const showLabel = width >= MIN_LABEL_WIDTH && height >= MIN_LABEL_HEIGHT;
            const maxChars = Math.max(4, Math.floor(width / 7));
            const isDrillable = tile.kind === 'directory';

            return (
              <g
                key={tile.id}
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
              >
                <title>{tileTooltip(tile, focusTotalBytes)}</title>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  fill={tileFill(tile, filesColor)}
                  stroke={theme.palette.background.paper}
                  strokeWidth={1}
                  rx={2}
                />
                {showLabel ? (
                  <text
                    x={x + 6}
                    y={y + 16}
                    fill={theme.palette.common.white}
                    fontSize={12}
                    fontFamily={theme.typography.fontFamily}
                    pointerEvents="none"
                  >
                    {truncateLabel(tile.name, maxChars)}
                  </text>
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
  );
}
