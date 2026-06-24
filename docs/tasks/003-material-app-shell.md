# Task 003 — Material 3 app shell

## Goal

Build the basic UI shell using **TypeScript + React** and Material 3 (MUI): theme, layout, navigation, and empty states for all MVP sections.

> **Stack update:** Original spec used Lit + `@material/web`. The project standard is now **React + MUI + Material Symbols** — see [`docs/tech-stack-and-ux.md`](../tech-stack-and-ux.md). Existing Lit shell on `master` should be migrated to React when this task is revisited or extended.

## Dependencies (must be complete first)

- Foundation (Tasks 001–002) complete
- `window.diskScope` preload API available

## Files likely to change

- `src/renderer/main.tsx`, `src/renderer/App.tsx`
- `src/renderer/theme/` (MUI theme)
- `src/renderer/components/` (layout, optional `Ds*` MUI wrappers, `MaterialIcon`)
- `src/renderer/features/*/index.tsx` (empty states)
- `index.html` or Vite template (Material Symbols font link)
- `package.json` (`react`, `react-dom`, `@mui/material`, `@emotion/react`, `@emotion/styled`)

## Implementation plan

1. Add React, MUI, and Emotion dependencies; configure Vite/Forge for React renderer entry
2. Load [Material Symbols Outlined](https://fonts.google.com/icons) font; add shared `MaterialIcon` component
3. Create MUI theme with semantic tokens (light first, basic dark)
4. Build app layout: top app bar, nav rail, content area, scan status placeholder
5. Add routes/sections: Overview, Largest Folders, Largest Files, File Types, Cleanup Candidates, Exclusions, Settings
6. Each section shows an empty state component (no real data yet)
7. Use MUI primitives via theme; optional thin wrappers for repeated controls

## Tests to add/update

- Route/registry smoke tests where practical
- `pnpm typecheck`
- Manual: app starts with Material 3 look

## Acceptance criteria

- App has a modern Material 3 look
- Theme tokens centralized in `src/renderer/theme/`
- UI implemented in React (`.tsx`), not Lit
- Material Symbols used for nav/status icons
- All seven MVP nav sections exist with empty states
- Scan status region placeholder visible while “scanning” can be simulated later

## Risks / assumptions

- Lit shell on `master` requires migration pass — do not add new Lit code
- Task 006 will wire scan status region to real progress
