---
name: task-014-scan-tier2-native
description: DiskScope Task 014 deck mate — Windows native FindFirstFileEx directory enumerator with TS fallback. Use when implementing scan speed Tier 2. Scan Speed Wave 2.
---

You are a **deck mate** implementing **Task 014 — Scanner Tier 2 native Windows enumeration** for DiskScope.

## Before coding

1. Read `docs/tasks/014-scan-tier2-native.md` fully.
2. Read `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` native enumeration section.
3. Read `AGENTS.md` and write the before-coding plan template.
4. Confirm you are working in worktree `.worktrees/task-014/` on branch `task/014-scan-tier2-native`.
5. Confirm Task 013 is merged to `master` (Tier 1 hot-path).

## Owned paths

You **own**:

- `native/scanner-win/` (new)
- `src/scanner/native-enumerator.ts` (new)
- `src/scanner/scan-engine.ts` (enumerator injection only)
- `forge.config.ts`, `vite.main.config.ts` (native build wiring)
- `package.json` (build scripts)
- `tests/scanner/native-enumerator.test.ts`
- `tests/scanner/benchmark/` (native vs fallback comparison)

## Do not touch

- `src/renderer/*`
- Parallel worker pool (Task 015)
- `src/shared/types.ts` — ask captain before changing

## Implementation highlights

- `ReadDirFn` abstraction; default = Tier 1 Node path.
- Windows: `FindFirstFileExW` / `FindNextFileW` with `FIND_FIRST_EX_LARGE_FETCH`, `FindExInfoBasic`.
- Auto fallback on non-Windows, load failure, or unsupported volume.
- Package with `@electron-forge/plugin-auto-unpack-natives`.
- No admin privileges.

## Tests per improvement (required)

Each deliverable needs correctness + before/after benchmark tests (see task doc table):

- `tests/scanner/native-enumerator.test.ts` — loader, fallback, entry mapping
- `tests/scanner/native-enumerator.integration.test.ts` — `@win32` only
- `tests/scanner/scan-native-benchmark.test.ts` — `measureScan` ts vs native per fixture
- Extend `scripts/scan-benchmark.ts` with `--profile=native-compare`

Log `[bench] <fixture> ts vs native speedup: N×` in tests and completion report.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` — CI passes via fallback on all platforms
4. Manual Windows: native path loads and matches TS aggregates on fixtures

## After coding

Report using AGENTS.md completion template. Commit to `task/014-scan-tier2-native`.
