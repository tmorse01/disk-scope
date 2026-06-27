# Task 018 — Scanner Tier 5 incremental cache and USN delta scans (post-MVP)

**Status:** Deferred — implement after captain approval. Prefer Task 017 (MFT) design alignment; can start independently for folder-only rescans.

## Goal

Make **repeat scans** of the same target near-instant by caching directory fingerprints in **SQLite** and optionally applying **NTFS USN journal deltas**, without changing the first-scan `ScanResult` contract. Target: rescans ≪ full scan time on unchanged or lightly changed trees.

## Dependencies (must be complete first)

- Task 015 (Tier 3 parallel pool) merged to `master`
- Task 017 (MFT) recommended but not strictly required — USN/MFT share NTFS volume concepts; cache layer should work with standard walker first

## Reference

- Brainstorm: `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` — Tier 5 (incremental / cached scans)
- Project scope: [`docs/disk-scope-project-scope.md`](../disk-scope-project-scope.md) §15 — SQLite-backed scan storage post-MVP
- Fleet resume: [`docs/resume-scan-speed-fleet.md`](../resume-scan-speed-fleet.md)
- Existing scan output: `src/shared/types.ts` (`ScanResult`), `src/scanner/scan-merge.ts`

## Files likely to change

- `src/main/services/scan-cache-store.ts` (new) — SQLite schema, open/close, migrations
- `src/scanner/incremental-scan-engine.ts` (new) — cache-aware scan orchestration
- `src/scanner/directory-fingerprint.ts` (new) — hash/mtime/size fingerprint per directory
- `src/scanner/usn-journal-reader.ts` (new) — Windows USN delta enumeration (native addon)
- `native/scanner-win/` — USN IOCTL bindings (may extend Task 017 native crate)
- `src/main/services/scan-coordinator.ts` — scan mode: full | incremental
- `src/scanner/scan-types.ts` — cache options, invalidation flags
- `src/renderer/features/scan-progress/` (optional) — “Using cache” / “Updating N changed folders”
- `tests/scanner/incremental-scan.test.ts`, `tests/scanner/scan-cache-store.test.ts`
- `tests/scanner/usn-delta.test.ts` — `@win32`
- `package.json` — `better-sqlite3` or approved embedded DB (justify in task plan before adding)

## Implementation plan

1. **SQLite cache schema**
   - Tables: `scan_sessions`, `directory_nodes`, `directory_fingerprints` (path, mtime, fileCount, totalSizeBytes, fingerprint, lastScanId).
   - Store enough to hydrate `directoriesById` for unchanged subtrees without `readdir`.
   - TTL or manual invalidation policy; cache keyed by normalized root path + volume id.

2. **Fingerprint and skip logic**
   - On rescan: `lstat` directory (cheap) → compare fingerprint.
   - If unchanged: load cached subtree aggregates into merge layer.
   - If changed: walk only that subtree (Tier 3 pool); update cache entries post-scan.

3. **USN delta path (Windows NTFS, optional phase)**
   - `FSCTL_ENUM_USN_DATA` or read USN journal since last checkpoint FRN/USN.
   - Map changed FRNs to paths; mark affected directories dirty; skip untouched cache entries.
   - Fallback to fingerprint diff when USN unavailable (non-admin, non-NTFS).

4. **Merge with live scan**
   - Reuse `scan-merge.ts` patterns to combine cached partial trees + freshly walked partials.
   - Recompute root totals, top-500, extensions, cleanup candidates from merged view.
   - Invalidate cache entries on exclusion rule changes or user “force full rescan”.

5. **Coordinator integration**
   ```text
   if (cacheHit && !forceFullRescan)
     → incremental engine (fingerprint + optional USN)
   else
     → full scan (Tier 3); write cache on complete
   ```
   - Cancel discards in-flight merge; do not write partial cache (match Task 015 cancel semantics).

6. **Storage limits**
   - Cap cache size or prune oldest sessions; document disk use in settings.
   - Do not cache scan targets user marked sensitive (future preference hook).

## Tests to add/update

- Unit tests: fingerprint stability, cache hit/miss, merge cached + fresh partials.
- Integration: scan → mutate one file → rescan → only affected subtree walked (mock or spy on `readDirectory`).
- `@win32` USN tests on dev NTFS volume (skip CI Linux).
- Equivalence: incremental rescan with no changes === full scan aggregates.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- Second scan of unchanged tree completes in **substantially less time** than first (benchmark logged; target order-of-magnitude on large unchanged trees).
- After single-file change, aggregates match full rescan; only changed path ancestry re-walked (observable in tests via call counts).
- Non-NTFS / no cache: behavior identical to Task 015 path.
- “Force full rescan” bypasses cache; cache rebuilds on success.
- SQLite DB lives in app user data dir; no renderer access to raw DB file.
- No new dependency without justification recorded in completion report.

## Risks / assumptions

- Fingerprint false negatives (same mtime/size but content changed) — document limits; optional content hash not in v1.
- Cache invalidation on external tools deleting files while app closed — USN helps on NTFS; otherwise full rescan on stale detection.
- Memory: hydrating large cached trees may rival full scan memory — batch/lazy load for drill-down views.
- **Dependency:** SQLite native module adds Forge rebuild matrix — evaluate `better-sqlite3` vs main-process only access.
- Coordinate with Task 016 (file browser delete) — deletes should invalidate cache entries for affected paths.

## Out of scope

- Cross-machine sync or cloud backup of cache
- Scan history UI / compare-over-time (separate product feature)
- MFT full-volume first scan (Task 017) — this task optimizes **rescans**
- Tier 6 lazy tree / streaming top-K (brainstorm only)
