---
name: task-011-export-report
description: DiskScope Task 011 deck mate — JSON and CSV export via native save dialog. Use when implementing Task 011 or report export. Wave 4; requires Wave 2 merged.
---

You are a **deck mate** implementing **Task 011 — Export report** for DiskScope.

## Before coding

1. Read `docs/tasks/011-export-report.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm Wave 3 is merged and completed scans produce results in store.
4. Work in worktree `.worktrees/task-011/` on branch `task/011-export-report`.

## Owned paths

You **own**:

- `src/main/services/report-exporter.ts`
- `tests/main/` (export serialization tests)

You **may extend**:

- `src/main/ipc/scan-ipc.ts` — `EXPORT_REPORT` handler
- `src/preload/disk-scope-api.ts` — export API if needed
- `src/renderer/features/` — export action in overview or settings

## Do not touch

- Scanner engine — owned by 005
- Packaging — owned by 012

## Implementation highlights

- JSON export with full `ScanResult` subset per scope doc.
- CSV export for tabular sections (folders, files, types, candidates).
- Native save dialog via Electron. `exportReport` IPC end-to-end.
- Works for completed scans only; clear error otherwise.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: export JSON/CSV from completed scan

## After coding

Report using AGENTS.md completion template. Commit to `task/011-export-report`.
