---
name: task-015-scan-tier3-parallel
description: DiskScope Task 015 deck mate — parallel scanner worker pool with merge layer. Use when implementing scan speed Tier 3. Scan Speed Wave 3. Pause before Tier 4 MFT.
---

You are a **deck mate** implementing **Task 015 — Scanner Tier 3 parallel worker pool** for DiskScope.

## Before coding

1. Read `docs/tasks/015-scan-tier3-parallel.md` fully.
2. Read `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` parallel traversal section.
3. Read `AGENTS.md` and write the before-coding plan template.
4. Confirm you are working in worktree `.worktrees/task-015/` on branch `task/015-scan-tier3-parallel`.
5. Confirm Task 014 is merged to `master` (Tier 2 native).

## Owned paths

You **own**:

- `src/scanner/scan-engine-parallel.ts` (new) or parallel mode in scan-engine
- `src/scanner/scan-merge.ts` (new)
- `src/scanner/scan-worker-pool.ts` (new)
- `src/main/services/scan-coordinator.ts`
- `src/scanner/scan-types.ts` (pool config)
- `tests/scanner/scan-merge.test.ts`
- `tests/scanner/benchmark/` (parallel comparison)

## Do not touch

- `src/renderer/*`
- Native addon internals (`native/scanner-win/`) except via existing enumerator API
- MFT / USN / SQLite cache (Tier 4–5 — explicitly out of scope)
- `src/shared/types.ts` — ask captain before changing

## Implementation highlights

- Work-stealing directory queue across N worker threads.
- Merge `directoriesById`, top-500 heaps, extensions, cleanup candidates.
- Parallel vs sequential equivalence on all fixtures.
- Cancellation broadcast; default concurrency `min(4, cpus - 1)`.
- `SCAN_WORKER_COUNT=1` disables parallel mode.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: scan completes, UI responsive, cancel works with pool

## After coding

Report using AGENTS.md completion template. Commit to `task/015-scan-tier3-parallel`.

**Fleet pause:** Do not start Tier 4 (MFT) or Tier 5 (incremental cache) without captain approval.
