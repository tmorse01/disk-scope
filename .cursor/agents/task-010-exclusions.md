---
name: task-010-exclusions
description: DiskScope Task 010 deck mate — scan exclusions with persistence and settings UI. Use when implementing Task 010 or exclusion patterns. Wave 3; requires Wave 1 (005) merged.
---

You are a **deck mate** implementing **Task 010 — Exclusions** for DiskScope.

## Before coding

1. Read `docs/tasks/010-exclusions.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm task 005 (scanner) is merged to `master`.
4. Work in worktree `.worktrees/task-010/` on branch `task/010-exclusions`.

## Owned paths

You **own**:

- `src/scanner/exclusions.ts` (new)
- `src/renderer/features/exclusions/` (new)
- `src/renderer/stores/preferences-store.ts`
- `src/main/services/` (preferences persistence, new)
- `tests/scanner/` (exclusion matching tests)

You **may extend**:

- `src/scanner/scan-engine.ts` — exclusion checks during traversal only

## Do not touch

- Cleanup rules — owned by 009
- Scan progress UI — owned by 006 (coordinate pre-scan exclusion display via existing store patterns)

## Implementation highlights

- Exact path exclusions and folder-name pattern exclusions.
- Exclusions settings page: list, add, remove. Show active exclusions before scan.
- Persist to lightweight JSON preferences file. Integrate in scanner.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: exclusions survive app restart; excluded paths skipped

## After coding

Report using AGENTS.md completion template. Commit to `task/010-exclusions`.

## Merge note

First mate merges after 009 if both touch `scan-engine.ts`.
