# DiskScope Agent Fleet Playbook

Operational guide for running parallel task implementation with Cursor subagents.

## Roles

| Role | Who | Responsibility |
| --- | --- | --- |
| **Captain** | You | Approve wave launches, merges to `master`, shared-type changes, manual UI/Electron verification |
| **First mate** | `diskscope-first-mate` subagent | Create worktrees, launch deck mates in parallel, monitor progress, merge in order, run quality gates |
| **Deck mates** | `task-NNN-*` subagents | Implement one task doc in an isolated worktree |

Subagent definitions live in [`.cursor/agents/`](../.cursor/agents/).

## Prerequisites

- Foundation (Tasks 001–002) merged to `master`
- `pnpm install` completed
- Git worktree support enabled (default in Git for Windows)

## Quick start — Wave 1

Tell the first mate:

```text
Use diskscope-first-mate to launch Wave 1 (tasks 003, 004, 005)
```

The first mate will:

1. Run `.cursor/scripts/new-task-worktree.ps1` for each task
2. Launch three background deck mates in parallel
3. Report status until all three complete
4. Recommend merges in order: **003 → 005 → 004**

You approve merges, then say:

```text
First mate: status report and launch Wave 2
```

## Wave schedule

| Wave | Tasks | Parallel | Gate before next wave |
| --- | --- | --- | --- |
| 1 | 003, 004, 005 | Yes (3) | lint + typecheck + test; app starts |
| 2 | 006 | No | pick → scan → progress visible |
| 3 | 007, 008, 009, 010 | Yes (4) | lint + typecheck + test; results views |
| 4 | 011 | No | export JSON/CSV works |
| 5 | 012 | No | `pnpm make` + packaged smoke test |
| 6 | 022, 025, 026 | Yes (3) | lint + typecheck + test; E2E passes; manual persist + update checks |

## Wave 6 — Production readiness (Tasks 022, 025, 026)

Parallel deck mates for auto-update, E2E smoke tests, and persisted scan history.

**Prerequisites:** Task 024 merged (session scan history). Tasks 012 + release pipeline stable.

**Launch:**

```text
Use diskscope-first-mate to launch Wave 6 (tasks 022, 025, 026)
```

**Worktrees:**

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 026 -ShortName persist-scan-history
.cursor/scripts/new-task-worktree.ps1 -TaskNum 022 -ShortName auto-update
.cursor/scripts/new-task-worktree.ps1 -TaskNum 025 -ShortName e2e-smoke-test
```

**Merge order (captain approval required — shared types + release pipeline):**

1. `task/026-persist-scan-history` — scan history store, scan-store hydration
2. `task/022-auto-update` — updater service, release assets, Settings Updates card
3. `task/025-e2e-smoke-test` — E2E + CI job last

**Gate before marking Wave 6 done:**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

Plus manual: scan → quit → relaunch (026); packaged update check (022).

**Task specs:** [`022-auto-update.md`](tasks/022-auto-update.md), [`025-e2e-smoke-test.md`](tasks/025-e2e-smoke-test.md), [`026-persist-scan-history.md`](tasks/026-persist-scan-history.md)

## Captain commands

| Intent | Example message |
| --- | --- |
| Launch a wave | `Use diskscope-first-mate to launch Wave N (tasks …)` — e.g. Wave 6: `(tasks 022, 025, 026)` |
| Fleet status | `First mate: fleet status report` |
| Approve merge | `First mate: merge task/003-material-shell to master` |
| Launch next wave | `First mate: launch Wave 2` |
| Run integration gate | `First mate: run quality gate on master` |
| Clean up worktree | `First mate: remove worktree for task 003` |

## Worktree script

Create a worktree manually:

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 003 -ShortName material-shell
.cursor/scripts/new-task-worktree.ps1 004 directory-picker
.cursor/scripts/new-task-worktree.ps1 005 scanner-worker
```

Worktrees live under `.worktrees/task-NNN/` (gitignored). Branches are `task/NNN-short-name`.

Remove after merge:

```powershell
git worktree remove .worktrees/task-003
git branch -d task/003-material-shell
```

## Merge order

### Wave 1

1. `task/003-material-shell` — owns `App.tsx` / shell layout
2. `task/005-scanner-worker` — owns scanner + scan IPC
3. `task/004-directory-picker` — picker + scan-store path state

### Wave 3

1. `task/009-cleanup-rules`
2. `task/010-exclusions` (resolve `scan-engine.ts` conflicts with 009 if needed)
3. `task/007-largest-folders` and `task/008-largest-files` (order flexible)

### Wave 6

1. `task/026-persist-scan-history` — scan history store + `scan-store` hydration
2. `task/022-auto-update` — updater service + release pipeline
3. `task/025-e2e-smoke-test` — E2E + CI (merge last)

Waves 2, 4, 5: single branch, merge when quality gate passes.

## Captain approval checkpoints

Require explicit approval before:

- Any merge to `master`
- Any change to `src/shared/types.ts`
- Launching Wave 3+ (manual vertical slice check after Wave 2)
- Launching Wave 5 (MVP feature-complete check)
- Launching Wave 6 (shared types + release pipeline + E2E — captain approval on each merge)

## Unmonitored mode

Deck mates run in background. Re-engage only at:

- Wave completion (first mate status report)
- Blocker reported (dependency missing, quality gate failure)
- Merge approval prompts

## Stop conditions

Halt the fleet if:

- `pnpm lint`, `typecheck`, or `test` fails on merge candidate
- Shared-type conflict between deck mates
- Deck mate reports **blocked on dependency**
- Two agents edited the same file outside ownership rules

## Quality gate (every merge)

```powershell
pnpm lint
pnpm typecheck
pnpm test
```

Plus manual verification when UI or Electron behavior changes (Waves 1, 2, 3, 5, 6).

Wave 6 also requires `pnpm test:e2e` on the merge candidate branch.

## Direct deck mate invocation

Launch a single task without the first mate:

```text
Use the task-005-scanner-worker subagent to implement Task 005 in .worktrees/task-005/
```

Always create the worktree first.

## Related docs

- Task specs: [`docs/tasks/`](tasks/)
- Agent contract: [`AGENTS.md`](../AGENTS.md)
- Project scope: [`docs/disk-scope-project-scope.md`](disk-scope-project-scope.md)
