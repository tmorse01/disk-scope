# Task 008 — Largest files and file types

## Goal

Add Largest Files and File Types analysis views with extension grouping.

## Dependencies (must be complete first)

- Task 006 (scan results available)

## Files likely to change

- `src/renderer/features/largest-files/` (new)
- `src/renderer/features/file-types/` (new)
- `tests/renderer/` or `tests/shared/` (extension grouping)

## Implementation plan

1. Largest files table: name, path, size, extension, modified
2. File type summary: group by extension, total size, file count, sort by size
3. Handle `[no extension]` group
4. Empty states when no scan data
5. Use data from `ScanResult.largestFiles` and `extensionSummaries`

## Tests to add/update

- Extension grouping tests
- Top N largest files tests
- Sorting tests

## Acceptance criteria

- User can find giant individual files
- User can see which file types consume the most space
- Tables sort correctly

## Risks / assumptions

- Parallelizable with Tasks 007 and 009
- Top 500 files limit from scanner (Task 005)
