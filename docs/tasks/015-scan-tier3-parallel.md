# Task 015 — Scanner Tier 3 parallel worker pool

## Goal

Multiply Tier 1–2 scan throughput with a directory work-stealing pool (4–8 workers), merging partial results into the same `ScanResult` shape. Target 2–8× on top of Tier 2 on SSD; conservative defaults on HDD.

## Dependencies (must be complete first)

- Task 014 (Tier 2 native) merged to `master`

## Reference

- Brainstorm: `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` — Tier 2 section (parallel traversal)
- Coordinator: `src/main/services/scan-coordinator.ts`

## Files likely to change

- `src/scanner/scan-engine-parallel.ts` (new) or extend `scan-engine.ts` with parallel mode
- `src/scanner/scan-merge.ts` (new — merge trees, top-N, extensions, cleanup candidates)
- `src/scanner/scan-worker-pool.ts` (new)
- `src/main/services/scan-coordinator.ts` (spawn pool vs single worker)
- `src/scanner/scan-types.ts` (pool config: concurrency, optional)
- `tests/scanner/scan-merge.test.ts`, `tests/scanner/scan-engine.test.ts`
- `tests/scanner/benchmark/` (parallel vs single-thread)

## Implementation plan

1. **Merge layer**
   - Merge disjoint `directoriesById` maps from workers.
   - Merge top-500 heaps (same min-heap structure from Task 013).
   - Merge extension summaries and cleanup candidates.
   - Recompute root totals from merged tree.

2. **Work queue**
   - Shared directory queue (in coordinator or pool master worker).
   - Workers pop dirs, enumerate children, push subdirs back.
   - Initial seed: root directory only.

3. **Worker pool in main process**
   - Option A: N `worker_threads` each running scan slice (preferred — keeps renderer free).
   - Option B: pool inside single worker with async concurrency (simpler but limited by one thread for CPU).
   - Recommend N workers in main coordinator posting dir batches to pool.

4. **Cancellation**
   - Broadcast cancel to all workers; drain within ~2s (existing target).
   - Partial results discarded on cancel (match current behavior).

5. **Adaptive concurrency**
   - Default: `min(4, os.cpus().length - 1)`.
   - Env flag or constant for `SCAN_WORKER_COUNT`; document HDD caution (concurrency 1–2).

6. **Correctness gate**
   - Compare parallel vs single-thread `runScan` on all existing fixtures — identical `ScanResult` aggregates.

## Tests to add/update

- Merge unit tests (synthetic partial trees).
- Parallel vs sequential equivalence on fixtures.
- Cancellation with active pool.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- Parallel mode produces identical aggregates to sequential mode on fixtures.
- Default concurrency works on Windows dev machine without UI regression.
- Fallback to single worker via flag or `SCAN_WORKER_COUNT=1`.
- Benchmark documents parallel speedup on multi-core + SSD fixture.
- **Pause point:** Tier 4 (MFT) and Tier 5 (cache/USN) explicitly out of scope.

## Risks / assumptions

- Parallel reads may hurt HDD — document default and tuning.
- Memory spikes with N partial trees in flight.
- `scan-engine.ts` conflict surface — coordinate with Tier 1/2 ownership.
- Cleanup rules (`parentHasDotNetProject`) remain per-directory local computation.
