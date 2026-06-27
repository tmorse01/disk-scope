# DiskScope

DiskScope is a cleanup-focused disk usage analyzer for developers and power users. Select a drive or folder, scan the file tree, and surface the largest cleanup opportunities first.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Commands

| Command | Description |
| --- | --- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start Electron in development mode |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
| `pnpm typecheck` | TypeScript project references check |
| `pnpm test` | Run unit tests (Vitest) |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm test:e2e` | Run Playwright E2E tests |
| `pnpm package` | Package the app (unpacked folder, no installer) |
| `pnpm make` | Create installable Windows artifacts |
| `pnpm release:ci` | Tag and push to trigger a GitHub Actions release |
| `pnpm release` | Build locally and publish to GitHub Releases (requires `gh`) |

## Packaging (Windows)

Build installable artifacts locally:

```powershell
pnpm build:native
pnpm make
```

Output locations:

| Artifact | Path |
| --- | --- |
| Unpacked app | `out/DiskScope-win32-x64/DiskScope.exe` |
| Squirrel installer | `out/make/squirrel.windows/x64/DiskScope-<version> Setup.exe` |

For a faster packaging check without an installer, run `pnpm package` and launch `DiskScope.exe` from the unpacked folder.

Windows SmartScreen may warn on first launch because the build is not code-signed. That is expected for local MVP builds.

### Packaged smoke test

After `pnpm make`, install from the Squirrel Setup exe (or run the unpacked exe) and verify:

- The app opens without auto-opening DevTools
- Folder picker works
- Scan completes and results views populate
- Preferences persist under `%APPDATA%/DiskScope/`

## Releasing (GitHub)

GitHub automatically attaches **Source code (zip)** and **Source code (tar.gz)** to every release. Those are repository source archives, **not the installable app**. Users must download the staged binaries below.

### `out/` to GitHub Release mapping

After `pnpm make`, Electron Forge writes build outputs under `out/`. The release pipeline stages these into upload-ready assets:

| `out/` source | Published asset | Purpose |
| --- | --- | --- |
| `out/make/squirrel.windows/x64/*Setup.exe` | `DiskScope-<version>-Setup.exe` | Windows installer (recommended) |
| `out/DiskScope-win32-x64/` (folder) | `DiskScope-<version>-win32-x64-portable.zip` | Portable app — unzip and run `DiskScope.exe` |
| (generated) | `SHA256SUMS.txt` | SHA256 checksums for the two files above |

Squirrel internals (`*.nupkg`, `RELEASES`) stay in `out/` only and are not published.

Preview staging locally without publishing:

```powershell
pnpm make
pnpm stage:release
# inspect dist/release/
```

### Verify a release succeeded

On the GitHub **Releases** page for a tag, confirm these **3 app assets** are present (plus GitHub's 2 source archives):

- `DiskScope-<version>-Setup.exe`
- `DiskScope-<version>-win32-x64-portable.zip`
- `SHA256SUMS.txt`

Release notes include a download guide that warns users not to use the source code links.

### Recommended: CI release (no local upload)

1. Bump `version` in [`package.json`](package.json).
2. Commit and push to `master`.
3. Tag and push (or use the helper script):

```powershell
pnpm release:ci
```

This pushes `v<version>` and triggers [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds on `windows-latest`, runs [`scripts/stage-release-assets.ps1`](scripts/stage-release-assets.ps1), and uploads assets.

You can also run the workflow manually from **Actions → Release → Run workflow** (enter the semver that matches `package.json`).

### Local release (build + upload from your machine)

Requires [GitHub CLI](https://cli.github.com/) (`gh auth login`):

```powershell
pnpm release
pnpm release -- -Notes "Short release summary"
pnpm release -- -SkipTests   # faster iteration
```

### User download

After a release completes, users install from **DiskScope-*-Setup.exe** on the Releases page — not from "Source code (zip)".

Windows SmartScreen may warn because builds are not code-signed yet.

## Project layout

```text
src/
  main/       Electron main process, IPC, OS services
  preload/    contextBridge API exposed as window.diskScope
  scanner/    Worker-thread scan engine (Task 005+)
  renderer/   React UI (TypeScript + MUI + Material Symbols)
  shared/     Types and utilities shared across processes
tests/        Unit, fixture, and E2E tests
docs/         Product scope, tech stack, and agent task files
```

See [`docs/tech-stack-and-ux.md`](docs/tech-stack-and-ux.md) for renderer conventions, Material icons, and UX patterns.

## Security

The renderer is sandboxed:

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true`
- No direct filesystem access from the renderer

The renderer calls only the typed `window.diskScope` preload API.

### Manual security checklist

After `pnpm dev`, open DevTools in the renderer and verify:

- `typeof require` is `undefined`
- `typeof process` is `undefined`
- `typeof window.diskScope` is `object`

## Documentation

- [Product scope](docs/disk-scope-project-scope.md)
- [Agent task backlog](docs/tasks/)
- [AGENTS.md](AGENTS.md) — conventions for coding agents

## Foundation status

Foundation (Tasks 001–002) is complete. Next parallel batch:

1. **003** — Material 3 app shell
2. **004** — Directory picker flow
3. **005** — Scanner worker MVP
