# Task 020 — Custom window frame

## Goal

Replace the default OS title bar on **Windows** with a frameless, branded top chrome: DiskScope mark, app name, and custom min / max / close controls. Document branding and window chrome in [`docs/DESIGN.md`](../DESIGN.md).

Non-Windows platforms keep the default `BrowserWindow` frame in v1.

## Dependencies (must be complete first)

- Task 003 (Material 3 app shell)
- Preload API foundation (Tasks 001–002)

## Files likely to change

- `docs/DESIGN.md` — product branding and window chrome spec
- `assets/brand-mark.svg` — shared logo asset
- `src/main/browser-window.ts`, `src/main/ipc/window-ipc.ts`, `src/main/main.ts`
- `src/shared/ipc-channels.ts`, `src/shared/types.ts`
- `src/preload/disk-scope-api.ts`
- `src/renderer/components/BrandMark.tsx`, `DsTitleBar.tsx`, `DsWindowControls.tsx`
- `src/renderer/App.tsx`, `src/renderer/theme/tokens.ts`
- `src/renderer/preview/mock-disk-scope.ts`
- `docs/tech-stack-and-ux.md`
- `website/public/favicon.svg`

## Implementation plan

1. Add shared `assets/brand-mark.svg` and sync website favicon
2. Write `docs/DESIGN.md` with logo, color, and window chrome guidelines
3. Configure frameless `BrowserWindow` on `win32` with matching `backgroundColor`
4. Add window control IPC handlers and preload `windowControls` API
5. Build `BrandMark`, `DsWindowControls`, `DsTitleBar` React components
6. Integrate title bar above existing app shell; replace sidebar hard-drive icon with brand mark
7. Add tests and run quality gate

## Tests to add/update

- `BrandMark` render at standard sizes
- Window IPC handler unit tests (mocked Electron)
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- Windows app launches frameless with branded 40px title bar
- Drag, double-click maximize, min / max / close work via IPC
- Maximize icon updates when window state changes
- Title bar and sidebar use the brand mark (not generic `hard_drive` icon)
- Light and dark themes match DESIGN.md surface colors
- macOS / Linux unchanged (default OS frame)
- Vite renderer preview works with mock `windowControls`
- `docs/DESIGN.md` documents logo usage and window chrome

## Risks / assumptions

- Windows-only v1; cross-platform custom chrome deferred
- `backgroundColor` at window create is static (light default)
- Frameless hides menu bar; DevTools remain available in dev builds
