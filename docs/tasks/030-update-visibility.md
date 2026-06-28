# Task 030 — Update visibility in the shell

## Goal

Make app version and update status visible outside Settings. Users should see their version at a glance, get prompted when an update is ready, and reach check/restart actions without hunting through preferences.

## Dependencies (must be complete first)

- Task 022 auto-update (UpdateService, IPC, Settings Updates card)

## Files likely to change

- `src/renderer/hooks/useUpdateStatus.ts` (new)
- `src/renderer/components/UpdateBanner.tsx` (new)
- `src/renderer/components/DsNavItem.tsx` — optional badge for Settings
- `src/renderer/components/DsSidebar.tsx` — version footer, Settings badge
- `src/renderer/App.tsx` — mount global update banner
- `src/renderer/features/settings/SettingsView.tsx` — reuse hook; move Updates card to top
- `tests/renderer/UpdateBanner.test.tsx` (new)

## Implementation plan

1. Extract `useUpdateStatus` hook (subscribe, check, install, derived flags).
2. Add `UpdateBanner` below the context bar when downloading or ready.
3. Show version + “Updates” link in sidebar footer; badge on Settings nav when ready.
4. Refactor Settings Updates card to use the hook; place Updates first in Settings.

## Tests to add/update

- `UpdateBanner` renders restart action when phase is `ready`
- App test asserts sidebar shows current version from mock API

## Acceptance criteria

- Current app version visible in the sidebar without opening Settings
- When an update is ready, a global banner offers **Restart to update** and Settings shows a nav badge
- Settings → Updates still supports manual check, auto-check toggle, and full status detail
- Dev / preview builds show version and dev-mode update message (no crash without updater)

## Risks / assumptions

- Banner is non-dismissible while update is ready (user can defer via ignore; restart remains in Settings)
- Portable builds continue to show reinstall guidance from existing Settings copy
