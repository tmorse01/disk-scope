# Task 026 — Persist scan history and last targets

## Goal

Survive app restarts with **recent scan results** and **last selected scan targets** so users are not forced to rescan after closing DiskScope. Builds on Task 024 session history with disk persistence in the main process.

## Dependencies (must be complete first)

- Task 024 (in-memory scan history and overview picker toggle)
- Task 011 (export report — reuse `ScanResult` JSON shape for serialization)
- Task 010 (preferences persistence pattern in main)

## Files likely to change

- `docs/tasks/026-persist-scan-history.md` (this file)
- `src/main/services/scan-history-store.ts` (new) — read/write history file under userData
- `src/main/services/scan-coordinator.ts` — persist on scan complete/cancel; load on startup
- `src/main/ipc/scan-ipc.ts` — handlers to load history, clear history (optional)
- `src/main/main.ts` — hydrate renderer on ready
- `src/preload/disk-scope-api.ts` — `getScanHistory`, `onScanHistoryHydrated` or equivalent
- `src/shared/types.ts` — `PersistedScanHistoryEntry`, payload types (no duplicate of `ScanResult`)
- `src/shared/ipc-channels.ts` — history channels
- `src/renderer/stores/scan-store.ts` — hydrate from main on init; persist triggers via IPC events
- `src/renderer/features/scan-picker/ScanHistoryPanel.tsx` — stale/missing path indicator if root gone
- `src/renderer/features/scan-picker/ScanTargetPanel.tsx` — restore last `selectedPaths` when opening picker
- `tests/main/scan-history-store.test.ts` (new)
- `tests/renderer/scan-store.test.ts` — hydration cases

## Implementation plan

### 1. Storage format and location

- Path: `%APPDATA%/DiskScope/scan-history.json` (via `app.getPath('userData')`)
- Max entries: **10** (match Task 024 `MAX_SCAN_HISTORY`)
- Each entry stores full `ScanResult` plus metadata:

```ts
// Illustrative — finalize in src/shared/types.ts
type PersistedScanHistoryEntry = {
  scanId: ScanSessionId;
  status: 'completed' | 'cancelled';
  developerCleanupEnabledAtScan: boolean;
  savedAt: string; // ISO
  result: ScanResult;
};
```

- Also persist `lastSelectedPaths: string[]` at top level of the same file or a sibling `scan-session.json` — keep one service if possible.

Use atomic write (temp file + rename) like preferences store.

### 2. Main-process scan history store

- `loadScanHistory(): Promise<ScanHistoryFile | null>`
- `appendScanHistory(entry): Promise<void>` — prepend, trim to max, dedupe by `scanId`
- `saveLastSelectedPaths(paths: string[]): Promise<void>`
- `clearScanHistory(): Promise<void>` (optional — Settings or debug)
- Normalize/validate on read; corrupt file → log warning, start empty (do not crash)

### 3. Write triggers

- On **scan complete** and **scan cancelled** (if partial `ScanResult` exists): append entry
- On **selected paths change** when user confirms targets or starts scan: save last paths
- Debounce path saves if needed (≤ 1 write per user action)

### 4. Hydrate renderer on startup

- After preferences load, main sends history snapshot to renderer (single IPC event or pull via `getScanHistory()`)
- `scan-store` initializes `scanHistory`, restores **most recent completed** entry as active `result` + `scanId` + `overviewMode: 'summary'` when appropriate
- If no history: behavior unchanged (picker idle state)
- If history entry’s `rootPath` no longer exists on disk: still show summary with a **warning chip** (“Scan target missing — rescan recommended”); do not auto-delete entry in v1

### 5. UI adjustments

- `ScanHistoryPanel`: show persisted entries immediately on cold start
- `ScanTargetPanel`: when opening picker with no in-flight scan, pre-fill `lastSelectedPaths` if paths still exist
- Settings (optional stretch): “Clear scan history” button — out of scope unless trivial; document as follow-up

### 6. Size and performance guardrails

- Full `ScanResult` can be large; acceptable for ≤10 entries on MVP
- If single file exceeds ~50 MB, log warning and skip persisting that entry (do not crash)
- Do **not** introduce SQLite in this task (Task 018 owns that)

## Tests to add/update

- `scan-history-store`: round-trip, max-10 trim, dedupe, corrupt file recovery, atomic write
- `scan-store`: hydrates history; activates most recent; handles empty file
- `scan-coordinator` or IPC: persist called on complete event (mock store)

## Acceptance criteria

- Complete a scan, quit app, relaunch → Overview shows previous summary without rescanning
- Recent scans list populated from disk with same entries as before quit
- Last selected paths restored in picker when starting a new scan flow
- Up to 10 entries retained; oldest dropped when exceeded
- Missing scan root on disk shows non-blocking warning; app remains usable
- Renderer still has no direct filesystem access
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass

## Risks / assumptions

- Large scan results may produce a large JSON file — monitor size; Task 018 may later move to SQLite
- Task 024 session-only behavior is replaced for persistence; in-memory actions still work within session
- Concurrent writes unlikely (single main process); no file locking beyond atomic rename
- **Captain approval** required for `src/shared/types.ts` changes

## Follow-up (out of scope)

- Persist in-progress scan / resume partial scan
- Scan compare over time
- User-facing “Clear history” in Settings
- Cross-machine sync

---

## Fleet handoff (Wave 6)

| Field | Value |
| --- | --- |
| **Wave** | 6 (parallel with Tasks 022, 025) |
| **Worktree** | `.worktrees/task-026/` |
| **Branch** | `task/026-persist-scan-history` |
| **Deck mate** | `.cursor/agents/task-026-persist-scan-history.md` |
| **Create worktree** | `.cursor/scripts/new-task-worktree.ps1 -TaskNum 026 -ShortName persist-scan-history` |

### Owned paths

- `src/main/services/scan-history-store.ts` (new)
- `src/main/services/scan-coordinator.ts` (persist/hydrate hooks)
- `src/main/ipc/scan-ipc.ts` (history handlers)
- `src/main/main.ts` (startup hydrate only)
- `src/preload/disk-scope-api.ts` (history API slice)
- `src/shared/types.ts` — persisted history types only
- `src/shared/ipc-channels.ts` — history channels only
- `src/renderer/stores/scan-store.ts`
- `src/renderer/features/scan-picker/ScanHistoryPanel.tsx`, `ScanTargetPanel.tsx`
- `tests/main/scan-history-store.test.ts`, `tests/renderer/scan-store.test.ts`

### Do not touch

- Auto-update service or Settings Updates card (Task 022)
- `tests/e2e/**` (Task 025)
- Scanner engine internals (`src/scanner/**`) except types flowing through coordinator

### Merge order (Wave 6)

Merge **first** in Wave 6:

1. **`task/026-persist-scan-history`** — this task
2. `task/022-auto-update`
3. `task/025-e2e-smoke-test`

### Quality gate (task branch)

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

Plus manual: scan → quit → relaunch → summary visible; history list intact.

### Stop conditions

- Halt if persisted JSON exceeds practical limits — implement skip-with-warning per plan before merge
- Coordinate with captain before changing shared `ScanResult` shape
