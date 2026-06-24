# Task 011 — Export report

## Goal

Let users save scan results as JSON or CSV via native save dialog.

## Dependencies (must be complete first)

- Task 006 (completed scan result available)

## Files likely to change

- `src/main/services/report-exporter.ts`
- `src/main/ipc/scan-ipc.ts`
- `src/preload/disk-scope-api.ts`
- `src/renderer/features/` (export action in overview or settings)
- `tests/main/` (export serialization)

## Implementation plan

1. Implement JSON export with full `ScanResult` subset per scope
2. Implement CSV export for tabular sections (folders, files, types, candidates)
3. Native save dialog via Electron
4. `exportReport` IPC end-to-end
5. Minimum fields: root path, timestamp, totals, top folders/files, types, candidates, errors

## Tests to add/update

- JSON schema/shape test
- CSV content test
- Manual export verification

## Acceptance criteria

- Export files are valid JSON/CSV
- Export contains required sections from scope doc
- Works for completed scans only (clear error otherwise)

## Risks / assumptions

- Large scans may need streaming CSV later — MVP full in-memory export OK
- Parallelizable with Task 010 after Task 006
