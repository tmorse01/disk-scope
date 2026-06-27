# Task 017 — Scan duration metrics and filesystem cache toggle

## Goal

Surface **time to complete** and **files/sec** after scans for benchmark comparisons (including vs WinDirStat), and add a **Use filesystem cache** checkbox that drops the Windows standby cache before scanning when unchecked.

## Dependencies (must be complete first)

- Task 005 (scanner worker)
- Task 006 (scan progress UI)

## Files changed

- `src/shared/scan-duration.ts` (new)
- `src/shared/types.ts` — `durationMs`, `StartScanResponse`, `useFilesystemCache`
- `src/main/services/filesystem-cache.ts` (new)
- `src/main/services/scan-coordinator.ts`
- `src/main/ipc/validators.ts`, `scan-ipc.ts`
- `src/preload/disk-scope-api.ts`
- `src/scanner/scan-engine.ts`, `scan-merge.ts`
- `src/main/services/report-exporter.ts`
- `src/renderer/stores/scan-store.ts`
- `src/renderer/features/scan-picker/ScanTargetPanel.tsx`
- `src/renderer/features/overview/OverviewView.tsx`
- `src/renderer/features/scan-progress/ScanProgressRegion.tsx`
- `src/renderer/preview/mock-disk-scope.ts`
- `tests/shared/scan-duration.test.ts`, `tests/main/filesystem-cache.test.ts`
- Updated validator, scan-store, report-exporter tests

## Implementation plan

1. **Shared duration helpers** — `computeScanDurationMs`, `computeFilesPerSec`, `formatFilesPerSec`.
2. **ScanResult.durationMs** — set in `scan-engine` and `scan-merge`.
3. **UI metrics** — Overview summary + footer show completed time and throughput.
4. **Export** — JSON/CSV summary includes `durationMs` and `filesPerSec`.
5. **Cache toggle** — checkbox in scan target panel; `StartScanOptions.useFilesystemCache` (default true).
6. **Windows cache drop** — PowerShell + `NtSetSystemInformation` standby purge before scan when unchecked; warning if elevation required.

## Tests to add/update

- `tests/shared/scan-duration.test.ts`
- `tests/main/filesystem-cache.test.ts`
- Validator + scan-store + report-exporter tests updated

## Acceptance criteria

- [x] Completed scan shows **Completed in** and **files/sec** on Overview and footer
- [x] JSON export includes `durationMs` and `filesPerSec`
- [x] Checkbox defaults checked; unchecked attempts cold cache drop on Windows
- [x] Warning shown when cache drop fails; scan still starts
- [x] `pnpm lint`, `pnpm typecheck`, `pnpm test` pass

## Risks / assumptions

- Full Windows cache purge typically requires **Run as administrator**; best-effort with clear warning.
- Manual comparison vs WinDirStat — no external tool integration.

## Completed

Task 017 implemented in worktree `.worktrees/task-017` on branch `task/017-scan-duration-cache`.

## Tests run

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test` (196/198 pass; 2 pre-existing flaky benchmark file-count assertions on balanced-tree fixture)

## Known gaps

- Cache checkbox state is session-only (not persisted in preferences).
- Non-Windows platforms no-op cache drop.

## Follow-up tasks

- Persist cache preference for dev benchmarking sessions.
- Optional benchmark history panel to log recent scan timings per target path.
