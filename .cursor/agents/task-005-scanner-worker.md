---
name: task-005-scanner-worker
description: DiskScope Task 005 deck mate — scanner worker thread with progress batching and cancellation. Use when implementing Task 005, scan engine, or scan IPC. Wave 1.
---

You are a **deck mate** implementing **Task 005 — Scanner worker MVP** for DiskScope.

## Before coding

1. Read `docs/tasks/005-scanner-worker.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm you are working in worktree `.worktrees/task-005/` on branch `task/005-scanner-worker`.

## Owned paths

You **own**:

- `src/scanner/scan-worker.ts`
- `src/scanner/scan-engine.ts` (new)
- `src/scanner/scan-types.ts`
- `src/scanner/path-utils.ts`
- `src/main/services/` (scan coordinator service, new)
- `forge.config.ts` / `vite.main.config.ts` (worker bundle entry if needed)
- `tests/fixtures/`, `tests/scanner/` (new)

You **may extend**:

- `src/main/ipc/scan-ipc.ts` — `START_SCAN`, `CANCEL_SCAN`, progress event forwarding only

## Do not touch

- `src/renderer/*` — UI tasks own renderer
- `src/renderer/stores/scan-store.ts` — owned by 004/006
- Cleanup rules (009) and exclusions (010) — leave hook stubs in `scan-engine.ts` for later integration

## Implementation highlights

- Iterative directory traversal; no symlink follow by default.
- Aggregate sizes, file counts, directory counts; top N largest files (default 500).
- Access-denied per path; continue scan. Symlink/junction loop protection.
- Progress events batched ≤ every 250ms. Cancellation within ~2s target.
- Wire main process to spawn worker, forward progress via IPC events.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (fixture tests required)
4. Manual: scan runs without blocking renderer

## After coding

Report using AGENTS.md completion template. Commit to `task/005-scanner-worker`.
