# Task 006 — Scan progress UI

## Goal

Show clear scan progress while scanning: counts, bytes, current path, errors, elapsed time, and cancel.

## Dependencies (must be complete first)

- Task 004 (selected target)
- Task 005 (live scan + progress events)

## Files likely to change

- `src/renderer/features/scan-progress/` (new)
- `src/renderer/stores/scan-store.ts`
- `src/renderer/app-root.ts` (persistent progress region)
- `tests/renderer/` (store tests)

## Implementation plan

1. Subscribe to `onScanProgress`, `onScanComplete`, `onScanError` via preload API
2. Update scan store with throttled/batched UI updates (avoid per-file renders)
3. Progress region: files, directories, bytes, current path (shortened), error count, elapsed
4. Cancel button calls `cancelScan`
5. Transition to completed/failed/cancelled states
6. Show brief result summary on complete (total size, counts)

## Tests to add/update

- Store tests for progress update merging
- Manual long-scan verification

## Acceptance criteria

- Progress updates visible and not noisy
- Cancel button works
- UI does not freeze during scan
- Completed scan shows summary metrics

## Risks / assumptions

- Depends on Task 005 event payload shape — align with `ScanProgressEvent` type
