# Task 025 — Disk Map treemap visual polish

## Goal

Polish the Disk Map treemap tiles to align with the reference [JoJoLaBagarre/diskscope](https://github.com/JoJoLaBagarre/diskscope) treemap: visible gutters, rounded blue tiles, two-line bottom-left labels (name + size), hover highlight, and a cohesive ranked blue palette normalized to the visible folder set.

## Dependencies (must be complete first)

- Task 021 (Disk Map treemap baseline)

## Files likely to change

- `docs/tasks/025-disk-map-treemap-polish.md` (this file)
- `src/renderer/features/disk-map/treemap-colors.ts`
- `src/renderer/features/disk-map/DiskMapTreemap.tsx`
- `tests/renderer/treemap-colors.test.ts` (new)
- `tests/renderer/DiskMapTreemap.test.tsx` (new)

## Implementation plan

1. Replace per-name hash hues with view-normalized M3 blue→gray spectrum
2. Increase tile gap and corner radius; bottom-left name + size labels with clip paths
3. Hover/focus opacity lift and in-component hint row
4. Unit tests for palette; render test with mocked `ResizeObserver`

## Tests to add/update

- Rank 0 directory → blue end; spread across endpoints for N folders
- DiskMapTreemap renders name and size for a large mock tile

## Acceptance criteria

- Treemap tiles have visible gaps and rounded corners
- Blue→gray range spans the visible folder tiles at each drill level
- Tiles show folder name and formatted size when large enough
- Hover highlights tile and shows name, size, and percent in hint row
- Quality gate passes

## Risks / assumptions

- Treemap-only scope; Disk Map page chrome unchanged
- Keep custom squarified layout (no `d3-hierarchy` dependency)
