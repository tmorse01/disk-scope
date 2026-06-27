# Task 021 — Disk Map (treemap visualization)

## Goal

Add a **Disk Map** sidebar tab that shows a squarified treemap of folder sizes from the scan tree, with drill-down navigation and a grouped **Files** tile for direct file bytes in each folder.

## Dependencies (must be complete first)

- Task 006 (scan results in store)
- Task 007 (folder tree utilities — breadcrumb, percent of root)

## Files likely to change

- `docs/tasks/021-disk-map-treemap.md` (this file)
- `src/renderer/features/disk-map/` (new)
- `src/renderer/routes.ts`
- `src/renderer/features/overview/OverviewView.tsx`
- `tests/renderer/disk-map-utils.test.ts` (new)
- `tests/renderer/treemap-layout.test.ts` (new)
- `tests/renderer/routes.test.ts`
- `tests/renderer/App.test.tsx`

## Implementation plan

1. `disk-map-utils.ts` — build treemap items from focused node; Files bytes; Other bucket when >39 folders
2. `treemap-layout.ts` — squarified layout (pure TypeScript)
3. `treemap-colors.ts` — deterministic folder hues
4. `DiskMapTreemap.tsx` — responsive SVG + hover tooltips
5. `DiskMapView.tsx` — focus state, breadcrumb via shell overrides, empty states
6. Register `disk-map` route after Largest Folders
7. Unit tests for utils and layout

## Tests to add/update

- Files bytes calculation; Other bucket; empty folder
- Layout: rects fill container, no overlaps, skip zero-size
- Routes count → 8; App nav label

## Acceptance criteria

- Disk Map tab shows proportional folder tiles after a completed scan
- Click folder tile to drill in; breadcrumb navigates up
- **Files** tile sized to direct-file bytes when present
- 40+ children render an **Other** bucket
- Hover shows name, size, % of focus total
- Quality gate passes

## Risks / assumptions

- File-level treemap (WinDirStat leaf view) deferred to follow-up
- Max 39 folder tiles + Files + Other per level for performance
