# Task 016 — File browser and safe delete

## Goal

Let users browse individual files inside scanned directories and delete them from DiskScope with safety-first defaults: confirmation dialogs on by default, Recycle Bin as the default delete method, and optional permanent delete configured in Settings.

## Dependencies (must be complete first)

- Task 006 (completed scan result in renderer store)
- Task 007 (folder drill-down UX and reveal/copy actions)
- Task 010 (preferences persistence)

Soft dependencies:

- Task 008 (Largest Files view for row-level delete actions)
- Task 009 (Cleanup Candidates view for folder delete actions)

## Files likely to change

- `src/shared/types.ts` — listing/delete types, preference fields, preload API
- `src/shared/ipc-channels.ts` — `LIST_DIRECTORY_CONTENTS`, `DELETE_PATH`
- `src/main/services/file-actions.ts` — `listDirectoryContents`, `deletePath`
- `src/main/services/scan-coordinator.ts` — `getProtectedScanRootPaths()`
- `src/main/services/preferences-store.ts` — `confirmBeforeDelete`, `defaultDeleteMethod`
- `src/main/ipc/validators.ts` — `validateDeletePathOptions`
- `src/main/ipc/scan-ipc.ts` — IPC handlers
- `src/preload/disk-scope-api.ts` — expose new API methods
- `src/renderer/features/file-actions/` — delete hook, row actions, target type
- `src/renderer/features/largest-folders/folder-tree-utils.ts` — WinDirStat-style `<Files>` group rows
- `src/renderer/features/largest-folders/LargestFoldersView.tsx` — lazy file listing + delete in tree
- `src/renderer/features/largest-folders/useLazyFolderFiles.ts` — directory file cache hook
- `src/renderer/features/largest-files/LargestFilesView.tsx` — delete actions column
- `src/renderer/features/cleanup-candidates/CleanupCandidatesView.tsx` — delete folder action
- `src/renderer/features/settings/SettingsView.tsx` — Safety card
- `src/renderer/components/DsDeleteConfirmDialog.tsx` — confirmation dialog
- `src/renderer/stores/preferences-store.ts` — safety preference setters
- `src/renderer/stores/scan-store.ts` — `removeDeletedPathFromScanResult`
- `tests/main/file-actions.test.ts`, `tests/renderer/useDeleteWithConfirmation.test.tsx`
- `docs/disk-scope-project-scope.md`, `docs/tech-stack-and-ux.md`, `AGENTS.md`

## Implementation plan

1. **Shared types and IPC** — listing/delete types, preferences, preload API, validators, IPC handlers.
2. **Main-process file actions** — `listDirectoryContents`, `deletePath` (Recycle Bin + permanent), protected scan root blocking.
3. **Settings — safety controls** — confirm before delete (default ON), default delete method (Recycle Bin default).
4. **Delete confirmation UX** — `DsDeleteConfirmDialog`, `useDeleteWithConfirmation`, `FileRowActions`.
5. **WinDirStat-style folder tree browse** — when a folder is expanded, inject a lazy `<Files>` group row; expanding it loads direct file children via `listDirectoryContents`.
6. **Delete on existing views** — `FileRowActions` on file rows under `<Files>`, Largest Files, and Cleanup Candidates.
7. **Scan store sync** — `removeDeletedPathFromScanResult` patches in-memory scan totals after delete.

## Tests to add/update

- `tests/main/file-actions.test.ts` — listing sort order, recycle vs permanent delete, protected root blocking
- `tests/main/preferences-store.test.ts` — new default fields
- `tests/main/validators.test.ts` — `validateDeletePathOptions`
- `tests/renderer/useDeleteWithConfirmation.test.tsx` — confirm on vs off
- `tests/renderer/folder-tree-utils.test.ts` — `<Files>` group row injection
- `tests/renderer/LargestFilesView.test.tsx` — delete action buttons render

## Acceptance criteria

- User can expand `<Files>` in the folder tree to browse direct file children lazily
- User can delete files from Largest Folders (`<Files>` rows), Largest Files, and Cleanup Candidates
- Confirm before deleting defaults to ON and persists across restarts
- Default delete method defaults to Recycle Bin; permanent delete is opt-in via Settings
- Delete operations run only through main-process IPC; scan root path cannot be deleted
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass

## Risks / assumptions

- Scan totals after delete are best-effort in memory; a rescan may be needed for fully accurate rollups
- Very large directories may be slow to list when `<Files>` is expanded; pagination is a follow-up
- Windows-first Recycle Bin behavior via `shell.trashItem`

## Completed

Implemented on branch `task/016-file-browser-safe-delete` in worktree `.worktrees/task-016`.

## Tests run

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`

## Known gaps

- Directory listing is single-level and uncached across sessions; very large folders may feel slow
- Scan rollup math after folder delete is best-effort, not a full tree rebuild

## Follow-up tasks

- Paginate or virtualize large directory listings under `<Files>`
- Optional “Rescan for accurate totals” banner after destructive actions
- Cross-platform Recycle Bin / trash behavior verification
