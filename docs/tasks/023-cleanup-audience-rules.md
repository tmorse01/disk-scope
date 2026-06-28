# Task 023 — Cleanup audience rules

## Goal

Reorient cleanup detection toward everyday users with conservative temp/cache rules by default, opt-in developer cleanup in Settings, and stricter project-context matching so generic folders like `dist`/`build` no longer flag installed apps.

## Dependencies (must be complete first)

- Task 009 (cleanup candidate rules engine and UI)

## Files likely to change

- `docs/tasks/023-cleanup-audience-rules.md` (this doc)
- `src/scanner/cleanup-rules.ts`
- `src/scanner/scan-engine.ts`, `scan-engine-slice.ts`, `scan-types.ts`, workers
- `src/shared/types.ts`
- `src/main/services/preferences-store.ts`, `scan-coordinator.ts`
- `src/renderer/stores/preferences-store.ts`
- `src/renderer/features/settings/SettingsView.tsx`
- `src/renderer/features/cleanup-candidates/CleanupCandidatesView.tsx`
- `src/renderer/features/overview/OverviewView.tsx`
- `tests/cleanup-rules/`, `tests/scanner/`, `tests/main/`, `tests/renderer/`

## Implementation plan

1. Add `developerCleanupEnabled` preference (default `false`)
2. Tag rules as `general` or `developer`; gate developer rules behind preference
3. Require dev project context for `dist`, `build`, `coverage` (sibling markers + `.git`)
4. Add general rules: user `AppData\Local\Temp`, Steam `steamapps\downloading`
5. Pass preference and sibling directory names through scan engine and workers
6. Settings toggle; reframe Cleanup and Overview copy for general users
7. Videos/games discovery remains on Largest Files and File Types views

## Tests to add/update

- Rule matching: dist/build without context → no match; with context + dev mode → match
- Developer rules gated by preference
- General rules match regardless of preference
- Scan engine integration with `developerCleanupEnabled: true`
- Preferences normalization default
- Renderer copy tests

## Acceptance criteria

- Default scan surfaces conservative temp/cache cleanup targets only
- `dist`/`build` in installed apps (no project markers) are not flagged
- Developer cleanup is opt-in via Settings; rescan required after toggle
- Cleanup UI copy targets normal users; File Types / Largest Files referenced for media
- Quality gate passes

## Risks / assumptions

- Existing users lose automatic dev folder detection until they opt in and rescan
- General rules are intentionally conservative (no browser or Recycle Bin rules in this task)
