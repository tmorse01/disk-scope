# Task 005 — Scanner worker MVP

## Goal

Implement recursive scanner in a worker thread with directory aggregation, progress batching, and cancellation.

## Dependencies (must be complete first)

- Foundation (Tasks 001–002) complete
- Shared types in `src/shared/types.ts`

## Files likely to change

- `src/scanner/scan-worker.ts`
- `src/scanner/scan-engine.ts` (new)
- `src/scanner/scan-types.ts`
- `src/scanner/path-utils.ts`
- `src/main/ipc/scan-ipc.ts`
- `src/main/services/` (scan coordinator service, new)
- `forge.config.ts` / `vite.main.config.ts` (worker bundle entry if needed)
- `tests/fixtures/` (temp dir fixtures)
- `tests/scanner/` (new)

## Implementation plan

1. Implement iterative directory traversal (no symlink follow by default)
2. Aggregate sizes, file counts, directory counts per folder
3. Track top N largest files (default 500)
4. Handle access-denied per path; continue scan
5. Symlink/junction loop protection
6. Progress events batched ≤ every 250ms
7. Cancellation checks; complete within ~2s target
8. Wire main process to spawn worker, forward progress to renderer via IPC events
9. Implement `startScan` / `cancelScan` IPC (replace stubs)

## Tests to add/update

- Fixture tests: nested dirs, empty dir, size aggregation
- Unreadable path handling where practical
- Symlink loop test where supported
- Cancellation test
- `pnpm test`

## Acceptance criteria

- Scanner returns correct aggregate sizes for fixtures
- Scanner does not crash on unreadable paths
- Scanner can be cancelled
- Renderer remains responsive during scan (no main-thread traversal)
- Progress IPC events emitted to renderer

## Risks / assumptions

- Worker bundling with Electron Forge may need separate Vite entry
- Cleanup rules (Task 009) and exclusions (Task 010) integrate later — stub hooks OK
