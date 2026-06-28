# Task 024 — Scan history and overview picker toggle

## Goal

Let users return to the folder-picker overview after a scan and switch between recent scan results and starting a new scan.

## Dependencies (must be complete first)

- Task 006 (scan progress UI)
- Task 004 (directory picker)

## Files likely to change

- `src/renderer/stores/scan-store.ts`
- `src/renderer/features/overview/OverviewView.tsx`, `OverviewLandingView.tsx`
- `src/renderer/features/scan-picker/ScanHistoryPanel.tsx` (new)
- `tests/renderer/OverviewView.test.tsx`, `tests/renderer/scan-store.test.ts`

## Implementation plan

1. Keep in-memory scan history (max 10) with scan id, result, status, developer-cleanup flag
2. Add `overviewMode`: `picker` | `summary` — overview shows picker even when a result exists
3. `showOverviewPicker()`, `activateScanFromHistory(scanId)` store actions
4. Recent scans panel on picker and summary overview; "New scan" on summary header
5. All feature views continue to use active `result` from store

## Tests to add/update

- Overview toggles to picker via New scan
- Activating a history entry restores result and shows summary
- History recorded on scan complete

## Acceptance criteria

- After a scan, user can open Overview → New scan and see the folder picker again
- Recent scans list lets user switch active scan without rescanning
- Quality gate passes

## Risks / assumptions

- History is session-only (not persisted to disk in this task)
