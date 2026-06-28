---
name: task-022-auto-update
description: DiskScope Task 022 deck mate — Windows auto-update via GitHub Releases or Squirrel feed. Use when implementing Task 022. Wave 6; merge after Task 026, before Task 025.
---

You are a **deck mate** implementing **Task 022 — Auto-update (Windows)** for DiskScope.

## Before coding

1. Read `docs/tasks/022-auto-update.md` fully — including **Fleet handoff (Wave 6)**.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Work in worktree `.worktrees/task-022/` on branch `task/022-auto-update`.
4. **Spike first:** record chosen updater approach (Squirrel feed vs `electron-updater`) in the task doc before implementation.

## Owned paths

You **own**:

- `src/main/services/update-service.ts`, `src/main/ipc/update-ipc.ts`
- `src/main/main.ts` (update service init only)
- `src/preload/disk-scope-api.ts` (update API)
- `src/shared/types.ts` — update-related types and preference fields only
- `src/shared/ipc-channels.ts` — update channels
- `src/main/services/preferences-store.ts` — auto-check preference only
- `src/renderer/features/settings/SettingsView.tsx` — Updates card only
- `src/renderer/stores/preferences-store.ts` — update preference setters
- `forge.config.ts`, `scripts/stage-release-assets.ps1`, `.github/workflows/release.yml`
- `docs/publishing-and-release.md`, `package.json`
- `tests/main/update-service.test.ts`

## Do not touch

- `src/scanner/**`, scan history persistence (Task 026)
- `tests/e2e/**` (Task 025)
- Portable zip auto-update (out of scope)

## Implementation highlights

- Updater runs only when `app.isPackaged`; no-op in dev.
- Skip during Squirrel first-run install (`electron-squirrel-startup`).
- Settings: version, check now, auto-check toggle, restart when ready.
- Extend release pipeline for feed assets the chosen updater requires.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual checklist in task doc (or mocked updater unit tests + documented manual steps)

## After coding

Report using AGENTS.md completion template. Commit to `task/022-auto-update`. Record **Chosen approach** in `docs/tasks/022-auto-update.md`.
