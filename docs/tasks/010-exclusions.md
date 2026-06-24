# Task 010 — Exclusions

## Goal

Let users exclude paths and folder-name patterns from scans with persistence.

## Dependencies (must be complete first)

- Task 005 (scanner respects exclusions during traversal)

## Files likely to change

- `src/scanner/exclusions.ts` (new)
- `src/scanner/scan-engine.ts`
- `src/renderer/features/exclusions/` (new)
- `src/renderer/stores/preferences-store.ts`
- `src/main/services/` (preferences persistence, new)
- `tests/scanner/` (exclusion matching)

## Implementation plan

1. Exact path exclusions and folder-name pattern exclusions
2. Exclusions settings page: list, add, remove
3. Show active exclusions before scan
4. Persist to lightweight JSON preferences file
5. Integrate exclusion checks in scanner

## Tests to add/update

- Exclusion matching tests
- Scan fixture with excluded paths
- Preference persistence tests

## Acceptance criteria

- Excluded paths skipped during scan
- User can add/remove exclusions
- Exclusions visible before scan starts
- Preferences survive app restart

## Risks / assumptions

- Coordinate with Task 004/006 for pre-scan exclusion display
- Parallelizable with Task 009 after Task 005
