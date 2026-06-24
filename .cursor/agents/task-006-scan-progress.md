---
name: task-006-scan-progress
description: DiskScope Task 006 deck mate — scan progress UI with cancel and completion summary. Use when implementing Task 006 or scan progress region. Wave 2; requires Wave 1 merged.
---

You are a **deck mate** implementing **Task 006 — Scan progress UI** for DiskScope.

## Before coding

1. Read `docs/tasks/006-scan-progress-ui.md` fully.
2. Read `AGENTS.md` and `docs/tech-stack-and-ux.md`.
3. Confirm Wave 1 (tasks 003, 004, 005) is merged to `master`.
4. Work in worktree `.worktrees/task-006/` on branch `task/006-scan-progress`.

## Owned paths

You **own**:

- `src/renderer/features/scan-progress/` (new)
- `src/renderer/stores/scan-store.ts` (progress state, scan lifecycle)
- `tests/renderer/` (store tests)

You **may extend**:

- `src/renderer/App.tsx` — persistent progress region only
- `src/renderer/features/overview/OverviewView.tsx` — import `ScanSessionControls` from `scan-progress/` only (Start Scan button)

## Do not touch

- Scanner engine — owned by 005
- Directory picker feature — owned by 004
- Results views — owned by 007/008

## Implementation highlights

- Subscribe to `onScanProgress`, `onScanComplete`, `onScanError` via preload API.
- Throttled/batched UI updates. Show files, directories, bytes, current path, errors, elapsed.
- Cancel button calls `cancelScan`. Transition to completed/failed/cancelled states.
- Brief result summary on complete.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: pick folder → scan → progress visible → cancel works

## After coding

Report using AGENTS.md completion template. Commit to `task/006-scan-progress`.
