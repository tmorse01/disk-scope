---
name: task-007-largest-folders
description: DiskScope Task 007 deck mate — sortable tree table for largest folders with drilldown and file actions. Use when implementing Task 007 or largest folders view. Wave 3; requires Wave 2 merged.
---

You are a **deck mate** implementing **Task 007 — Largest folders view** for DiskScope.

## Before coding

1. Read `docs/tasks/007-largest-folders.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm Wave 2 (task 006) is merged to `master`.
4. Work in worktree `.worktrees/task-007/` on branch `task/007-largest-folders`.

## Owned paths

You **own**:

- `src/renderer/features/largest-folders/` (new)
- `tests/renderer/` (sort, tree flattening tests)

You **may read/extend**:

- `src/renderer/stores/scan-store.ts` — read scan result; do not change progress lifecycle (006 owns that)
- `src/shared/format-bytes.ts` — use existing, do not duplicate

## Do not touch

- `src/scanner/*` — owned by 005/009/010
- Cleanup risk labels — placeholder until 009; show empty or placeholder
- Largest files / file types — owned by 008

## Implementation highlights

- Tree table: name, size, % of root, file count, dir count, modified, risk label placeholder.
- Default sort size descending. Expand/collapse, click to select.
- Breadcrumb drilldown. Reveal in explorer and copy path via `window.diskScope`.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: reveal/copy verification

## After coding

Report using AGENTS.md completion template. Commit to `task/007-largest-folders`.
