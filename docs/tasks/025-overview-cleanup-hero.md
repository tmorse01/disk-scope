# Task 025 — Overview reclaim hero

## Goal

Show a prominent reclaimable-space hero on the scan-complete overview. Clicking navigates to Cleanup suggestions. When no rule matches exist, show a soft hint toward Largest Files and File Types.

## Dependencies (must be complete first)

- Task 027 (cleanup targeting + `summarizeCleanupCandidates`)

## Files likely to change

- `docs/tasks/025-overview-cleanup-hero.md` (this doc)
- `src/renderer/features/cleanup-candidates/CleanupReclaimHero.tsx` (new)
- `src/renderer/features/overview/OverviewView.tsx`
- `src/renderer/features/cleanup-candidates/CleanupCandidatesView.tsx`
- `tests/renderer/OverviewView.test.tsx`

## Implementation plan

1. Extract shared `CleanupReclaimHero` (filled + empty variants)
2. Overview: insert clickable hero between scan summary and "What's next?"
3. Cleanup view: reuse hero in detail (non-clickable) mode
4. Primary byte total prefers low-risk sum; show full total when higher
5. Remove duplicate cleanup count from scan summary grid

## Tests to add/update

- Overview hero shows formatted reclaim total when candidates exist
- Click hero navigates to cleanup-candidates
- Zero candidates shows soft hint without byte hero

## Acceptance criteria

- Overview highlights reclaimable bytes as primary post-scan CTA
- Hero click opens Cleanup suggestions sorted by size (existing behavior)
- Empty scan shows exploration hint, not "0 B"
- Quality gate passes

## Risks / assumptions

- Copy uses "potential" wording — totals are rule-matched folders only
