# Task 027 — Cleanup targeting improvements

## Goal

Improve cleanup rule accuracy and expand general-user Windows cache targeting so reclaim totals are meaningful before the overview hero (Task 025).

## Dependencies (must be complete first)

- Task 023 (cleanup audience rules)

## Files likely to change

- `docs/tasks/027-cleanup-targeting-improvements.md` (this doc)
- `src/scanner/cleanup-rules.ts`
- `src/shared/cleanup-summary.ts` (new)
- `tests/cleanup-rules/cleanup-rules.test.ts`
- `tests/shared/cleanup-summary.test.ts` (new)

## Implementation plan

1. Require dev project context for all developer folder-name rules without strong path constraints
2. Replace substring path segment matching with consecutive segment matching
3. Add ordered path segment matching for browser profile caches
4. Add general Windows rules: npm user cache, pip cache, Chrome/Edge/Firefox caches
5. Add shared helper for low-risk vs all reclaim byte totals

## Tests to add/update

- Developer rules reject matches without project context
- Consecutive segment matching rejects false-positive Temp paths
- New general cache rules match fixture paths
- `summarizeCleanupCandidates` tier totals

## Acceptance criteria

- All developer rules require project context (or equivalent strong path constraint)
- Path segment rules use consecutive or ordered matching (not substring)
- At least 3 new general Windows cache rules with tests
- Shared helper exposes low-risk vs all reclaim totals
- Quality gate passes

## Risks / assumptions

- Browser cache paths vary by profile; rules use ordered segments under vendor roots
- Active browser caches flagged as medium risk — user must review before delete
