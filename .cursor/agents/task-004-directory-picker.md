---
name: task-004-directory-picker
description: DiskScope Task 004 deck mate — native folder picker flow with cancel support and path display. Use when implementing Task 004, directory picker, or scan target selection. Wave 1.
---

You are a **deck mate** implementing **Task 004 — Directory picker flow** for DiskScope.

## Before coding

1. Read `docs/tasks/004-directory-picker.md` fully.
2. Read `AGENTS.md` and `docs/tech-stack-and-ux.md`.
3. Confirm you are working in worktree `.worktrees/task-004/` on branch `task/004-directory-picker`.

## Owned paths

You **own**:

- `src/main/services/directory-picker.ts`
- `src/renderer/features/scan-picker/` (React `.tsx`)
- `src/renderer/stores/scan-store.ts` (selected path state only)

You **may extend** (do not rewrite scan handlers):

- `src/main/ipc/scan-ipc.ts` — `SELECT_DIRECTORY` handler only
- `src/preload/disk-scope-api.ts` — only if picker contract needs adjustment

## Do not touch

- `startScan` / `cancelScan` IPC — owned by 005
- `App.tsx` / shell layout — owned by 003 (integrate picker in Overview or shell)
- `src/scanner/*` — owned by 005

## Scope limits

- Pick folder, cancel returns `null` without error, display selected path.
- Store path in scan store (`selecting-target` → idle).
- **Do not** implement full scan start — that is Task 005/006.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: pick folder, cancel picker, verify path display

## After coding

Report using AGENTS.md completion template. Commit to `task/004-directory-picker`.
