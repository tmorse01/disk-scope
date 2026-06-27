# Task 017 — Scanner Tier 4 NTFS MFT fast path (post-MVP)

**Status:** Deferred — implement after captain approval. Requires Tasks 013–015 merged.

## Goal

Add an optional **NTFS MFT direct-read** scan engine for Windows that bypasses path-by-path directory traversal, targeting **50–500×** speedup on full NTFS volumes compared to the standard walker. Same `ScanResult` shape; hybrid fallback to Tier 2–3 (native enumerator + parallel pool) when MFT is unavailable.

## Dependencies (must be complete first)

- Task 015 (Tier 3 parallel pool) merged to `master`
- Packaging baseline (Task 012) stable for native addon shipping

## Reference

- Brainstorm: `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` — Tier 4 (NTFS MFT) section
- Project scope: [`docs/disk-scope-project-scope.md`](../disk-scope-project-scope.md) §8, §15 — MFT explicitly post-MVP
- Fleet resume: [`docs/resume-scan-speed-fleet.md`](../resume-scan-speed-fleet.md)
- Existing engines: `src/scanner/scan-engine.ts`, `scan-engine-parallel.ts`, `native/scanner-win/`

## Platform and volume matrix

| Condition | MFT path | Fallback |
| --- | --- | --- |
| Windows + NTFS + admin granted | Yes | — |
| Windows + NTFS, no admin | No | Tier 2–3 walker |
| Windows + exFAT / ReFS | No | Tier 2–3 walker |
| Network / mapped drives | No | Tier 2–3 walker |
| macOS / Linux | No | TS or platform-native walker (future) |

Works on **HDD, SATA SSD, and NVMe M.2** — gain is from algorithm (sequential MFT read), not drive type. Biggest wow factor on fast NVMe; still often beats tree walk on HDD.

## Files likely to change

- `native/scanner-win/` — MFT reader module (Rust + `napi-rs` or dedicated crate)
- `src/scanner/mft-engine.ts` (new) — orchestrates MFT scan → `ScanResult`
- `src/scanner/mft-path-resolver.ts` (new) — FRN → path under scan root
- `src/scanner/scan-volume-detect.ts` (new) — NTFS check, volume path for `\\.\X:`
- `src/main/services/scan-coordinator.ts` — engine selection (standard vs fast)
- `src/main/services/elevation-prompt.ts` (new, optional) — admin opt-in UX
- `src/scanner/scan-types.ts` — scan mode enum, MFT options
- `src/renderer/features/scan-picker/` (optional) — “Fast scan (admin)” toggle
- `tests/scanner/mft-engine.test.ts`, `tests/scanner/mft-fallback.test.ts`
- `tests/scanner/mft-benchmark.test.ts` — `@win32` manual / dev machine
- `forge.config.ts`, native build scripts

## Implementation plan

1. **Volume and privilege probe**
   - Detect whether `rootPath` resolves to an NTFS volume.
   - Attempt volume handle open (`\\.\C:`) — detect admin requirement without crashing.
   - Expose `canUseMftScan(rootPath): { supported, reason }` for UI and coordinator.

2. **MFT record reader (native)**
   - Sequential read of `$MFT` records or `FSCTL_GET_NTFS_FILE_RECORD`.
   - Parse: file name attribute, standard information (size), parent directory FRN, flags.
   - Skip deleted / directory-only records per spec; handle hard links policy (document: count once vs per path — match standard walker totals).

3. **Tree build and path resolution**
   - Build FRN parent map in memory or streaming batches.
   - Resolve full paths for entries under `rootPath`; apply exclusions on resolved paths.
   - Aggregate into existing `DirectoryNode` / `ScanResult` structures (reuse merge/rollup patterns from Task 015 where applicable).

4. **Hybrid coordinator routing**
   ```text
   if (userOptInFastScan && ntfs && adminGranted)
     → MFT engine
   else
     → existing parallel pool (Tier 3) or single worker
   ```
   - Log active engine once per scan (main/worker).
   - No silent admin escalation — user must opt in (UAC or pre-launched elevated instance).

5. **Semantics parity**
   - No-follow symlinks / reparse points (match Tier 1–3).
   - OneDrive cloud placeholders: document size behavior; align with native enumerator tests.
   - Error paths: unreadable volume → fallback, not hard fail.

6. **Benchmark gate**
   - Compare MFT vs Tier 3 on same NTFS fixture or manual full-volume checklist.
   - Report files/sec and total elapsed; gate on correctness first.

## Tests to add/update

- Unit tests for FRN path resolution on synthetic FRN trees (no real volume).
- `@win32` integration: MFT vs walker aggregates on dev NTFS folder (skip in CI Linux).
- Fallback tests: non-NTFS, missing admin, load failure → Tier 3 path unchanged.
- Property-style aggregate equivalence on shared fixtures where MFT applies.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- MFT engine produces **identical aggregates** to standard walker on equivalent NTFS fixtures (file count, total size, top-N sizes, extension summaries within defined hard-link policy).
- Non-NTFS and non-admin scans behave exactly as today (no regression).
- User-facing opt-in for fast scan documented; no mandatory admin for default scan.
- Native MFT module builds and packages via existing Forge + `AutoUnpackNativesPlugin` path.
- Benchmark documents MFT speedup on Windows dev machine (manual checklist acceptable for CI).

## Risks / assumptions

- **Admin UX** is the main product risk — scope explicitly deferred elevation from MVP.
- Hard links, junctions, and cloud placeholders need explicit policy and tests.
- Path string materialization for deep trees may be memory-heavy — consider lazy paths for drill-down (Tier 6 idea).
- Real-volume testing is hard to automate in CI; document manual verification on NTFS SSD + HDD.
- Task 016+ numbering: do not conflict with parallel feature work; coordinate `src/shared/types.ts` changes with captain.

## Out of scope

- macOS / Linux MFT equivalents (not applicable)
- USN incremental scans (Task 018)
- SQLite persistence (Task 018)
- Permanent delete or broad filesystem mutation APIs
