---
name: task-013-scan-tier1-hotpath
description: DiskScope Task 013 deck mate — scanner Tier 1 hot-path optimizations (benchmark harness, skip lstat, post-order rollup, min-heap top-500). Use when implementing scan speed Tier 1. Scan Speed Wave 1.
---

You are a **deck mate** implementing **Task 013 — Scanner Tier 1 hot-path optimizations** for DiskScope.

## Before coding

1. Read `docs/tasks/013-scan-tier1-hotpath.md` fully.
2. Read `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` Tier 1 section.
3. Read `AGENTS.md` and write the before-coding plan template.
4. Confirm you are working in worktree `.worktrees/task-013/` on branch `task/013-scan-tier1-hotpath`.

## Owned paths

You **own**:

- `src/scanner/scan-engine.ts`
- `src/scanner/top-files-tracker.ts` (new)
- `src/scanner/exclusions.ts` (subtree short-circuit only)
- `tests/scanner/scan-engine.test.ts`
- `tests/scanner/scan-benchmark.test.ts` or `tests/scanner/benchmark/` (new)
- `scripts/scan-benchmark.ts` (optional)

You **may extend**:

- `src/scanner/path-utils.ts` — small helpers only

## Do not touch

- `src/main/*`, `src/renderer/*`, `src/preload/*`
- Native addons (Task 014)
- Parallel pool (Task 015)
- `src/shared/types.ts` — ask captain before changing

## Implementation highlights

- Benchmark harness first; capture baseline before optimizations.
- Skip redundant `lstat` when `Dirent` is definitive.
- Post-order size aggregation instead of per-file ancestor walks.
- Min-heap for top-500 largest files.
- Defer mtime string formatting; reduce per-file progress checks.
- `(dev, ino)` loop detection instead of per-dir `realpath` where possible.
- Subtree exclusion short-circuit (skip `readdir` for excluded dirs).

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` — all existing scan-engine tests pass with identical aggregates
4. Benchmark shows improvement on synthetic fixture (note ratio in completion report)

## After coding

Report using AGENTS.md completion template. Commit to `task/013-scan-tier1-hotpath`.
