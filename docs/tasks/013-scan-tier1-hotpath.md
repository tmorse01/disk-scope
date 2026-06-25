# Task 013 — Scanner Tier 1 hot-path optimizations

## Goal

Speed up the recursive scanner 2–5× by reducing syscalls and per-file CPU work in pure TypeScript, without changing `ScanResult` shape or scan semantics.

## Dependencies (must be complete first)

- Scanner worker MVP (Task 005) merged
- Exclusions (010) and cleanup rules (009) integrated in `scan-engine.ts`

## Reference

- Brainstorm: `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` — Tier 1 section
- Current engine: `src/scanner/scan-engine.ts`

## Files likely to change

- `src/scanner/scan-engine.ts`
- `src/scanner/top-files-tracker.ts` (new — min-heap top-N)
- `src/scanner/exclusions.ts` (subtree short-circuit helpers, if needed)
- `tests/scanner/scan-engine.test.ts` (correctness unchanged)
- `tests/scanner/scan-benchmark.test.ts` (new — optional CI subset)
- `scripts/scan-benchmark.ts` or `tests/scanner/benchmark/` (new harness)

## Implementation plan

1. **Benchmark harness (baseline first)**
   - Script or vitest bench that runs `runScan` on synthetic fixtures: shallow-wide, deep-narrow, ~1k–10k files (CI-friendly).
   - Report: files/sec, dirs/sec, elapsed ms, optional peak RSS.
   - Capture baseline numbers in a comment or small markdown snapshot in the test file (not user-facing).

2. **Skip redundant `lstat`**
   - Use `Dirent` type from `readdir({ withFileTypes: true })` when definitive.
   - Call `lstat`/`stat` only for unknown types or when file size is not available from dirent.
   - Preserve: no symlink follow, skip symlinks.

3. **Post-order size aggregation**
   - Replace per-file `addFileSizeToAncestors` with local accumulation + bubble-up when leaving a directory.
   - Verify nested aggregation matches existing fixture tests exactly.

4. **Min-heap top-500**
   - Extract `TopFilesTracker` to `top-files-tracker.ts`; use binary min-heap (size 500).
   - Same output ordering as today (descending by size).

5. **Cheaper hot-path metadata**
   - Defer `mtime.toISOString()` until finalize (or only for entries in top-N).
   - Move `emitProgress()` checks to directory boundaries or every N files (keep ≤250ms batching).

6. **Smarter loop detection**
   - Replace per-directory `realpath` with `(dev, ino)` / Windows file index tracking from stat where possible.
   - Fall back to `realpath` only when needed.

7. **Subtree exclusion short-circuit**
   - When a directory matches a folder-name exclusion, skip `readdir` entirely.
   - Record excluded stub node; document behavior if size is unknown vs zero.

## Tests to add/update

- All existing `scan-engine.test.ts` cases must pass unchanged (same aggregates).
- **Per-optimization correctness** in `tests/scanner/scan-optimization.test.ts` (one describe block per tuning flag).
- **Per-optimization benchmarks** using `LEGACY_SCAN_ENGINE_TUNING` vs `tuningWithOnly(key)` vs `DEFAULT_SCAN_ENGINE_TUNING`; log before/after via `measureScan` / `formatMeasurement`.
- Benchmark harness: `tests/scanner/benchmark/measure.ts`, `tuning-presets.ts`, `scripts/scan-benchmark.ts --profile=per-opt`.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- Existing scanner fixture tests pass with identical `ScanResult` aggregates.
- Benchmark shows measurable improvement on synthetic large fixture (document before/after in PR/commit message).
- No new runtime dependencies.
- Progress still batched ≤250ms; cancellation still works.
- UI/renderer unchanged.

## Risks / assumptions

- `Dirent` metadata availability differs by platform; Windows path must be validated manually.
- Post-order rollup must handle unreadable directories and partial subtrees correctly.
- Exclusion short-circuit may leave `sizeBytes` as 0 for excluded folders — confirm UX is acceptable or add `excluded` flag later (out of scope unless trivial).
