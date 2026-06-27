# Task 022 — Auto-update (Windows)

## Goal

Let installed DiskScope builds check for newer versions on GitHub Releases, download updates in the background, and apply them with minimal user friction — while keeping the renderer sandboxed and update mechanics in the main process.

## Dependencies (must be complete first)

- Task 012 packaging baseline (Squirrel installer, `electron-squirrel-startup`)
- Stable GitHub Releases pipeline ([`docs/publishing-and-release.md`](../publishing-and-release.md), [`.github/workflows/release.yml`](../../.github/workflows/release.yml))
- Task 019 marketing website (optional — download page already points at Releases; no hard dependency)

## Files likely to change

- `src/main/services/update-service.ts` (new) — check, download, apply, event emission
- `src/main/main.ts` — initialize update service after app ready (not during Squirrel install hook)
- `src/main/ipc/update-ipc.ts` (new) — narrow IPC for renderer
- `src/preload/preload.ts` — expose typed update API on `window.diskScope`
- `src/shared/types.ts` — `UpdateStatus`, preferences fields, IPC payloads
- `src/renderer/features/settings/` — “Updates” section (check now, auto-check toggle, status)
- `forge.config.ts` — Squirrel / publish metadata if feed URL or signing is required
- `scripts/stage-release-assets.ps1` — may need to publish Squirrel feed artifacts (see below)
- `.github/workflows/release.yml` — upload additional update feed files if required
- `docs/publishing-and-release.md` — document update feed assets and release checklist
- `package.json` — `repository` field (required by most GitHub-based updaters), optional dependency

## Implementation plan

### 1. Choose update mechanism (spike first)

DiskScope already ships Squirrel installers but **does not** publish Squirrel feed files (`RELEASES`, `*.nupkg`) — only the Setup exe and portable zip ([`scripts/stage-release-assets.ps1`](../../scripts/stage-release-assets.ps1)). Pick one approach before coding:

| Approach | Pros | Cons |
| --- | --- | --- |
| **A. Squirrel feed + Electron `autoUpdater`** | Delta updates, matches current installer | Must publish and host `RELEASES` + `*.nupkg`; feed URL + signing story |
| **B. `electron-updater` (GitHub provider)** | Fits GitHub Releases; can use existing release tags | Full download; Forge integration needs explicit config |
| **C. `update-electron-app`** | Small API, GitHub Releases–oriented | Less control over UI; verify Forge + Squirrel compatibility |

**Recommendation:** Spike A vs B in a branch. If the release pipeline can reliably publish a Squirrel feed on GitHub Releases (or a static URL), prefer **A** for smaller updates on Windows. Otherwise **B** with full installer download is acceptable for v1 auto-update.

Document the chosen approach in this task doc before merge.

### 2. Release pipeline changes

Whatever mechanism is chosen, releases must expose what the updater expects:

- **Squirrel feed:** extend staging/CI to upload `RELEASES` and versioned `*.nupkg` from `out/make/squirrel.windows/x64/` alongside existing assets. Document the public feed base URL in `docs/publishing-and-release.md`.
- **GitHub generic / electron-updater:** ensure `package.json` has a correct `repository` URL and release assets include the installer the updater will fetch.

Add a release verification step: “update feed reachable from a packaged build.”

### 3. Main-process update service

- Run only in **packaged** builds (`app.isPackaged`); no-op in dev.
- Skip during Squirrel first-run install (`electron-squirrel-startup` path in [`src/main/main.ts`](../../src/main/main.ts)).
- On startup (and on interval / manual check):
  - Query for updates
  - Emit state: `idle` | `checking` | `available` | `downloading` | `ready` | `error`
  - When an update is downloaded and ready, prompt to restart (Squirrel applies on quit + relaunch)
- Respect user preference: auto-check on launch (default on) vs manual only.
- Log errors without blocking core app functionality.

### 4. IPC + preload API

Expose a minimal typed surface (no raw feed URLs or filesystem paths in the renderer):

```ts
// Illustrative — finalize in src/shared/types.ts
checkForUpdates(): Promise<void>;
installUpdate(): Promise<void>; // quit and apply when ready
onUpdateStatus(callback): () => void;
getUpdateStatus(): UpdateStatusSnapshot;
```

Register handlers in main; bridge via preload with `contextBridge` only.

### 5. Settings UI (React + MUI)

Add an **Updates** section under Settings:

- Current app version (from preload / shared constant)
- Last check time and status message
- **Check for updates** button
- Toggle: **Automatically check for updates** (persist in `AppPreferences`)
- When `ready`: primary action **Restart to update** + short explanation

Follow [`docs/tech-stack-and-ux.md`](../tech-stack-and-ux.md) — no Lit.

### 6. Code signing note

Auto-update works without signing for early adopters, but Windows SmartScreen and Squirrel may warn more aggressively. Treat code signing as a follow-up (Task TBD), not a blocker for the first auto-update iteration.

## Tests to add/update

- Unit tests for update state machine / preference gating (mock updater backend)
- Unit test: update service does not run when `!app.isPackaged`
- Manual: install version N, publish N+1 to a test release, verify check → download → restart
- Manual: “Check for updates” when already on latest shows friendly message
- Manual: disable auto-check → no background check on launch
- Release doc checklist updated

## Acceptance criteria

- Packaged Windows app checks GitHub (or configured feed) for updates without renderer filesystem access
- User can manually check from Settings and see clear status (up to date, downloading, ready to restart, error)
- Auto-check on launch respects the preferences toggle (default: enabled)
- Dev mode (`pnpm dev`) does not call the updater
- Squirrel install/uninstall first-run still exits cleanly via `electron-squirrel-startup`
- Release pipeline publishes whatever artifacts the chosen updater requires
- [`docs/publishing-and-release.md`](../publishing-and-release.md) includes an “Auto-update assets” subsection

## Risks / assumptions

- **Windows only** for v1 (matches current packaging)
- Portable zip installs are out of scope — auto-update applies to Squirrel-installed builds only
- GitHub Releases rate limits / API availability — handle gracefully with cached “last checked” and retry
- Downgrade and channel selection (beta) are out of scope
- Corporate proxies or offline machines may fail checks — show actionable error, do not crash
- Publishing `*.nupkg` increases release asset size; confirm GitHub asset limits per release

## Follow-up (out of scope)

- Code signing for installer and update packages
- macOS / Linux auto-update (when those makers ship)
- Staged rollouts or beta channel
- In-app release notes viewer
