---
name: task-025-e2e-smoke-test
description: DiskScope Task 025 deck mate — Playwright Electron E2E smoke tests for pick/scan/results. Use when implementing Task 025. Wave 6; merge last after Tasks 026 and 022.
---

You are a **deck mate** implementing **Task 025 — Electron E2E smoke test** for DiskScope.

## Before coding

1. Read `docs/tasks/025-e2e-smoke-test.md` fully — including **Fleet handoff (Wave 6)**.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Work in worktree `.worktrees/task-025/` on branch `task/025-e2e-smoke-test`.

## Owned paths

You **own**:

- `tests/e2e/**`
- `tests/e2e/fixtures/**`
- `playwright.config.ts`
- `.github/workflows/ci.yml` — E2E job only
- `package.json` — E2E build+run scripts
- Minimal gated E2E hooks in main/preload **only if required** — get captain approval before touching `src/main/`

## Do not touch

- Feature UI beyond test hooks
- Auto-update (Task 022), scan history store (Task 026)
- Scanner engine internals

## Implementation highlights

- Replace skipped `placeholder.spec.ts` with real `_electron.launch()` tests.
- Automate scan via `DISKSCOPE_E2E` env or equivalent — **gated**, not enabled in production.
- Minimum: app launches + fixture scan completes + Largest Folders shows data.
- Add Windows CI job: build artifacts → `pnpm test:e2e`.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm test:e2e` (after documented build step)

## After coding

Report using AGENTS.md completion template. Commit to `task/025-e2e-smoke-test`. Document final build+run commands in the task doc.
