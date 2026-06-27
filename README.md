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

## Packaging (Windows)

Build installable artifacts locally:

```powershell
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
