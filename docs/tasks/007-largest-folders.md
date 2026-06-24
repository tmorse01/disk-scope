# Task 007 — Largest folders view

## Goal

Make the main cleanup workflow useful with a sortable tree table, drilldown, and file actions.

## Dependencies (must be complete first)

- Task 006 (scan results in store)

## Files likely to change

- `src/renderer/features/largest-folders/` (new)
- `src/renderer/stores/scan-store.ts`
- `src/shared/format-bytes.ts` (use existing)
- `tests/renderer/` (sort, tree flattening)

## Implementation plan

1. Tree table: name, size, % of root, file count, dir count, modified, risk label placeholder
2. Default sort: size descending
3. Expand/collapse rows; click to select
4. Breadcrumb drilldown into selected directory
5. Reveal in explorer and copy path via `window.diskScope`
6. Compact size bars optional

## Tests to add/update

- Sort tests
- Percent of root calculation
- Tree flattening/expansion tests
- Manual reveal/copy verification

## Acceptance criteria

- User can identify largest folders quickly
- Drilldown workflow is clear
- Reveal in file explorer works
- Copy path works

## Risks / assumptions

- Risk labels fully populated in Task 009; show empty or placeholder until then
- Parallelizable with Tasks 008 and 009
