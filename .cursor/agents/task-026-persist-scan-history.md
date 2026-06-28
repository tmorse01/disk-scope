---
name: task-026-persist-scan-history
description: DiskScope Task 026 deck mate — persist scan history and last targets across app restarts. Use when implementing Task 026. Wave 6; merge first before Tasks 022 and 025.
---

You are a **deck mate** implementing **Task 026 — Persist scan history and last targets** for DiskScope.

## Before coding

1. Read `docs/tasks/026-persist-scan-history.md` fully — including **Fleet handoff (Wave 6)**.
2. Read `docs/tasks/024-scan-history-overview.md` for in-memory history behavior.
3. Read `AGENTS.md` and write the before-coding plan template.
4. Work in worktree `.worktrees/task-026/` on branch `task/026-persist-scan-history`.

## Owned paths

You **own**:

- `src/main/services/scan-history-store.ts` (new)
- `src/main/services/scan-coordinator.ts` (persist/hydrate)
- `src/main/ipc/scan-ipc.ts`, `src/main/main.ts` (hydrate on ready)
- `src/preload/disk-scope-api.ts` (history API)
- `src/shared/types.ts` — persisted history types only
- `src/shared/ipc-channels.ts` — history channels
- `src/renderer/stores/scan-store.ts`
- `src/renderer/features/scan-picker/ScanHistoryPanel.tsx`, `ScanTargetPanel.tsx`
- `tests/main/scan-history-store.test.ts`, `tests/renderer/scan-store.test.ts`

## Do not touch

- Auto-update (Task 022), E2E tests (Task 025)
- `src/scanner/**` except data flowing through coordinator
- SQLite / Task 018 incremental cache

## Implementation highlights

- JSON file under userData; max 10 entries; atomic writes.
- Hydrate renderer on startup; restore most recent completed scan to overview summary.
- Save last selected paths for picker pre-fill.
- Warning UI when persisted root path missing on disk.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: scan → quit → relaunch → summary and history intact

## After coding

Report using AGENTS.md completion template. Commit to `task/026-persist-scan-history`.
