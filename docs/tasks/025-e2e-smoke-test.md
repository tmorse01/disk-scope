# Task 025 — Electron E2E smoke test

## Goal

Replace the skipped Playwright placeholder with one reliable **pick → scan → results** Electron E2E test against a temp filesystem fixture, and wire it into CI so the core vertical slice is protected on every push.

## Dependencies (must be complete first)

- Task 006 (scan progress UI)
- Task 004 (directory picker)
- React renderer migration complete (all primary views in React)
- Task 024 (scan history / overview modes) — soft; test should not depend on history UI

## Files likely to change

- `docs/tasks/025-e2e-smoke-test.md` (this file)
- `tests/e2e/` — replace `placeholder.spec.ts` with real specs + helpers
- `tests/e2e/fixtures/` — small on-disk tree or reuse `tests/scanner/fixture-utils.ts` patterns
- `playwright.config.ts` — Electron launch args, timeouts, env for fixture path
- `package.json` — optional `test:e2e:ci` script if build step is required
- `.github/workflows/ci.yml` — E2E job (build main/preload/worker first, then run Playwright)
- `README.md` — brief E2E run instructions (optional one-liner)

## Implementation plan

### 1. Electron launch harness

Use Playwright `_electron.launch()` (from `@playwright/test`):

- Launch entry: `.vite/build/main.js` (Forge Vite build output)
- Set `NODE_ENV=production` or equivalent so dev-only behaviors do not interfere
- Use a dedicated `--user-data-dir` temp path per test run so preferences/history from other tests do not leak
- Close app in `afterEach` / `afterAll`

Document the required pre-step in CI and locally:

```powershell
pnpm exec electron-forge package   # or a lighter vite build script if documented
pnpm test:e2e
```

Prefer a root script (e.g. `test:e2e:ci`) that builds then runs E2E to avoid drift.

### 2. Fixture scan without native folder picker

The folder picker cannot be automated reliably in CI. **Inject the scan target via test-only IPC or env**, without exposing a general “scan arbitrary path” API to production renderer:

| Approach | Recommendation |
| --- | --- |
| **A. `DISKSCOPE_E2E_SCAN_ROOT` env** read in main on first launch, auto-start scan | Preferred if gated with `app.isPackaged \|\| process.env.DISKSCOPE_E2E` |
| **B. Preload test hook** only when `process.env.DISKSCOPE_E2E` is set | Acceptable; must not ship enabled in packaged builds |
| **C. Mock `window.diskScope.scan.startScan` in renderer** | Avoid — does not exercise main/scanner |

Create a small fixture tree (e.g. 3 folders, 5 files, known total size) under `tests/e2e/fixtures/sample-tree/` committed to repo, or generate via `fixture-utils` in `globalSetup`.

### 3. Smoke test scenarios (minimum)

**Test 1 — `app launches`**

- Window shows app title / DiskScope branding
- Overview or nav rail visible

**Test 2 — `scan fixture completes and shows results`**

- Start scan on fixture root (via env/hook)
- Assert progress UI appears within 500ms (scope target)
- Wait for scan complete (timeout ≤ 60s for small fixture)
- Overview summary shows expected total size or file count band
- Navigate to **Largest Folders** — at least one row with expected folder name

Optional stretch (same spec file, not blocking):

- Cancel scan mid-run on a larger generated fixture

### 4. CI job

Add a `e2e` job to `.github/workflows/ci.yml`:

- `runs-on: windows-latest`
- Steps: checkout → pnpm install → build electron artifacts → `pnpm test:e2e`
- Do **not** run `pnpm make` (too slow); `forge package` or documented vite build is enough
- Upload Playwright trace on failure

Keep existing `quality` job unchanged; E2E may run in parallel after build.

### 5. Remove placeholder

Delete or replace `tests/e2e/placeholder.spec.ts` — no skipped tests left in `tests/e2e/`.

## Tests to add/update

- `tests/e2e/app-launches.spec.ts`
- `tests/e2e/scan-fixture.spec.ts`
- `tests/e2e/helpers/electron-app.ts` — launch, get window, teardown
- CI workflow runs E2E on `master` / PRs

## Acceptance criteria

- `pnpm test:e2e` runs at least two passing Electron tests locally (document build prerequisite)
- No skipped tests under `tests/e2e/`
- CI E2E job passes on Windows
- E2E does not require manual folder picker interaction
- Test-only scan injection is disabled in packaged production builds without `DISKSCOPE_E2E`
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` still pass

## Risks / assumptions

- First Electron E2E setup may need iteration on Forge output paths — document final commands in this doc when done
- Scanner workers must load in packaged build path; verify worker bundle is included
- Flaky timing on progress assertions — prefer `expect.poll` or role-based waits over fixed sleeps
- macOS CI deferred (Windows-only MVP)

---

## Fleet handoff (Wave 6)

| Field | Value |
| --- | --- |
| **Wave** | 6 (parallel with Tasks 022, 026) |
| **Worktree** | `.worktrees/task-025/` |
| **Branch** | `task/025-e2e-smoke-test` |
| **Deck mate** | `.cursor/agents/task-025-e2e-smoke-test.md` |
| **Create worktree** | `.cursor/scripts/new-task-worktree.ps1 -TaskNum 025 -ShortName e2e-smoke-test` |

### Owned paths

- `tests/e2e/**`
- `tests/e2e/fixtures/**`
- `playwright.config.ts`
- `.github/workflows/ci.yml` — E2E job only
- `package.json` — scripts for E2E build+run only
- Minimal main/preload changes **only** for gated E2E scan injection (coordinate with captain if touching `src/main/`)

### Do not touch

- Feature UI except test hooks
- `src/scanner/**` logic (use existing scan path)
- Release pipeline / auto-update (Task 022)
- Scan history persistence (Task 026)

### Merge order (Wave 6)

Merge **last** after Tasks 026 and 022:

1. `task/026-persist-scan-history`
2. `task/022-auto-update`
3. **`task/025-e2e-smoke-test`** — this task

### Quality gate (task branch)

```powershell
pnpm lint
pnpm typecheck
pnpm test
# build step documented in package.json, then:
pnpm test:e2e
```

### Stop conditions

- Halt if E2E requires disabling security boundaries in production code paths
- Halt if CI job exceeds reasonable time (>15 min) — narrow to smoke only, defer full `make` to manual release checklist

---

## Build and run (final)

Local E2E requires a Forge Vite build before Playwright can launch Electron:

```powershell
cd .worktrees/task-025   # or repo root on task branch
pnpm install
pnpm test:e2e:ci         # builds via `pnpm package`, then runs Playwright
```

Individual steps:

```powershell
pnpm package             # produces .vite/build/main.js (+ preload, renderer, workers)
pnpm test:e2e            # Playwright _electron.launch() smoke tests
```

### E2E scan injection (test-only)

Set at launch (Playwright helper does this automatically for scan tests):

| Variable | Value |
| --- | --- |
| `DISKSCOPE_E2E` | `1` |
| `DISKSCOPE_E2E_SCAN_ROOT` | Absolute path to fixture tree (`tests/e2e/fixtures/sample-tree`) |

Main returns autostart config only when `DISKSCOPE_E2E=1` and the scan root exists. Without those env vars, packaged builds behave normally.

### CI

The `e2e` job on `windows-latest` runs `pnpm test:e2e:ci` in parallel with the existing `quality` job. Playwright traces upload on failure.
