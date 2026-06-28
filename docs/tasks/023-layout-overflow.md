# Task 023 — Layout overflow and scroll regions

## Goal

Fix renderer layout so window chrome (title bar, sidebar, context bar/breadcrumb, scan footer) never scrolls. Route content fills the main pane with scroll confined to the right places: table body with sticky headers on data tabs, scrollable body on form/overview tabs. Breadcrumb stays always visible at compact height.

## Dependencies (must be complete first)

- Task 003 (app shell)
- Task 020 (custom window frame)

## Files likely to change

- `src/renderer/index.css`, `src/renderer/App.tsx`
- `src/renderer/theme/tokens.ts`
- `src/renderer/components/DsContextBar.tsx`, `DsViewLayout.tsx`, `DsDataTable.tsx`
- `src/renderer/features/*/` (all route views)
- `tests/renderer/`

## Implementation plan

1. Lock document height chain (`html`, `body`, `#app`, App root) — no document scroll
2. Main pane `overflow: hidden`; views fill height via `DsViewLayout`
3. Compact context bar (48px); keep sticky + flexShrink 0
4. `DsViewLayout` page mode (Settings, Overview, Exclusions) vs data mode (tables, disk map)
5. `DsDataTable` scroll + stickyHeader for table routes
6. Migrate all eight routes

## Tests to add/update

- `DsViewLayout.test.tsx` — page and data modes
- `DsDataTable` scroll/stickyHeader
- `App.test.tsx` — shell structure

## Acceptance criteria

- Title bar, sidebar, breadcrumb, scan footer remain visible when content overflows
- Breadcrumb always visible; long paths scroll horizontally inside bar
- Data tabs: page header + toolbar fixed; table rows scroll; column headers sticky
- Form/overview tabs: content scrolls inside main pane only
- Disk map treemap fills content area, not raw viewport height
- Quality gate passes

## Risks / assumptions

- MUI stickyHeader + resizable columns may need z-index tuning
- Scan footer hidden while scanning — unchanged
