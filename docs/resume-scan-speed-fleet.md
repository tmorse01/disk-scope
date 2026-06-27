# Resume — Scan Speed Fleet (Tiers 1–3)

**Status:** Tiers 1–2 merged to `master` — Tier 3 (parallel pool) queued  
**Master:** check `git log -1` for current tip  
**Brainstorm:** `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md`  
**Pause after:** Task 015 merge — Tier 4 (MFT) and Tier 5 (cache/USN) are post-pause

---

## Fleet overview

Sequential waves (each gates the next — all touch `scan-engine.ts`):

| Wave | Task | Agent | Branch | Expected gain |
| --- | --- | --- | --- | --- |
| **Scan-1** | 013 Tier 1 hot-path | `task-013-scan-tier1-hotpath` | `task/013-scan-tier1-hotpath` | 2–5× |
| **Scan-2** | 014 Tier 2 native | `task-014-scan-tier2-native` | `task/014-scan-tier2-native` | 5–20× (Windows) |
| **Scan-3** | 015 Tier 3 parallel | `task-015-scan-tier3-parallel` | `task/015-scan-tier3-parallel` | 2–8× on top |

**Not in this fleet:** Tier 4 NTFS MFT, Tier 5 SQLite/USN incremental.

---

## Wave Scan-1 — Tier 1 (COMPLETE — awaiting merge)

Per-optimization tests: `tests/scanner/scan-optimization.test.ts`  
Benchmark script: `pnpm exec tsx scripts/scan-benchmark.ts --profile=per-opt`

| Optimization | Correctness test | Benchmark (balanced-tree 800 files, win32) |
| --- | --- | --- |
| All (legacy → default) | Aggregate equivalence | ~2.2× total |
| post-order rollup | `postOrderRollup` describe | ~1.5× alone |
| skip redundant lstat | `skipRedundantLstat` describe | ~1.9× alone |
| min-heap top-N | `minHeapTopFiles` describe | ~2.2× alone |
| deferred mtime | (equivalence) | ~2.1× alone |
| inode loop detection | `inodeLoopDetection` describe | ~2.8× alone |
| exclusion short-circuit | `exclusionShortCircuit` describe | ~3.5× alone |
| batched progress | `batchedProgress` describe | ~3.6× alone |

### Worktree

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 013 -ShortName scan-tier1-hotpath
```

Path: `.worktrees/task-013/`

### Launch deck mate

```text
Use the task-013-scan-tier1-hotpath subagent to implement Task 013 in .worktrees/task-013/
```

Or via first mate:

```text
Use diskscope-first-mate to launch Scan Speed Wave 1 (task 013)
```

### Pre-flight (captain)

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

### Merge when ready

```text
First mate: merge task/013-scan-tier1-hotpath to master
```

### Captain checkpoint (after merge)

- [ ] All existing scan-engine tests pass
- [ ] Benchmark harness runs in CI
- [ ] `pnpm dev` → scan folder → results match pre-optimization aggregates
- [ ] Review benchmark ratio in deck mate completion report

---

## Wave Scan-2 — Tier 2 (COMPLETE — awaiting merge)

Branch: `task/014-scan-tier2-native` @ `a2de3fe`

Native speedup benchmarks require local build on Windows:

```powershell
pnpm build:native
pnpm benchmark:scan:native
```

Until built, CI/all tests pass via TS fallback (148 tests).

### Worktree

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 014 -ShortName scan-tier2-native
```

### Launch

```text
Use the task-014-scan-tier2-native subagent to implement Task 014 in .worktrees/task-014/
```

### Notes

- Requires Windows dev machine for native integration testing
- CI uses TS fallback — native tests may be `@win32` only
- `pnpm install` in worktree before quality gate

### Merge

```text
First mate: merge task/014-scan-tier2-native to master
```

### Captain checkpoint

- [ ] Native addon loads on Windows (`pnpm dev`)
- [ ] Fallback works when native unavailable
- [ ] Benchmark documents native vs Tier 1 on Windows fixture

---

## Wave Scan-3 — Tier 3 (BLOCKED on Scan-2 merge)

### Worktree

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 015 -ShortName scan-tier3-parallel
```

### Launch

```text
Use the task-015-scan-tier3-parallel subagent to implement Task 015 in .worktrees/task-015/
```

### Merge

```text
First mate: merge task/015-scan-tier3-parallel to master
```

### Captain checkpoint (final — fleet pause)

- [ ] Parallel vs sequential equivalence on fixtures
- [ ] Cancel mid-scan with worker pool
- [ ] UI responsive during parallel scan
- [ ] `SCAN_WORKER_COUNT=1` restores single-thread behavior

**When all three checkpoints pass → fleet paused.** Tier 4+ requires new task specs and captain approval.

---

## Captain commands

| Intent | Message |
| --- | --- |
| Launch Tier 1 | `Use diskscope-first-mate to launch Scan Speed Wave 1 (task 013)` |
| Fleet status | `First mate: scan speed fleet status report` |
| Approve merge | `First mate: merge task/013-scan-tier1-hotpath to master` |
| Launch Tier 2 | `First mate: launch Scan Speed Wave 2 (task 014)` |
| Launch Tier 3 | `First mate: launch Scan Speed Wave 3 (task 015)` |
| Quality gate | `First mate: run quality gate on master` |

---

## Stop conditions

Halt if:

- Scan-engine fixture tests fail or aggregates diverge from baseline
- Shared-type conflict (`src/shared/types.ts`)
- Native addon breaks `pnpm make` / packaging (Tier 2)
- Parallel merge produces different totals than sequential (Tier 3)

---

## Related docs

- Task specs: [`docs/tasks/013-scan-tier1-hotpath.md`](tasks/013-scan-tier1-hotpath.md), [014](tasks/014-scan-tier2-native.md), [015](tasks/015-scan-tier3-parallel.md)
- Agents: [`.cursor/agents/task-013-scan-tier1-hotpath.md`](../.cursor/agents/task-013-scan-tier1-hotpath.md), [014](../.cursor/agents/task-014-scan-tier2-native.md), [015](../.cursor/agents/task-015-scan-tier3-parallel.md)
- General fleet playbook: [`docs/agent-fleet-playbook.md`](agent-fleet-playbook.md)
