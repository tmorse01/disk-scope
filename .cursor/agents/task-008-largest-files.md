---
name: task-008-largest-files
description: DiskScope Task 008 deck mate — largest files table and file type summary views. Use when implementing Task 008, largest files, or file types analysis. Wave 3; requires Wave 2 merged.
---

You are a **deck mate** implementing **Task 008 — Largest files and file types** for DiskScope.

## Before coding

1. Read `docs/tasks/008-largest-files-file-types.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm Wave 2 (task 006) is merged to `master`.
4. Work in worktree `.worktrees/task-008/` on branch `task/008-largest-files`.

## Owned paths

You **own**:

- `src/renderer/features/largest-files/` (new)
- `src/renderer/features/file-types/` (new)
- `tests/renderer/` or `tests/shared/` (extension grouping tests)

## Do not touch

- `src/scanner/*` — owned by 005/009/010
- Largest folders view — owned by 007
- `src/shared/types.ts` — coordinate with first mate if changes needed

## Implementation highlights

- Largest files table: name, path, size, extension, modified.
- File type summary: group by extension, total size, file count, sort by size.
- Handle `[no extension]` group. Empty states when no scan data.
- Use `ScanResult.largestFiles` and `extensionSummaries`.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: tables sort correctly after scan

## After coding

Report using AGENTS.md completion template. Commit to `task/008-largest-files`.
