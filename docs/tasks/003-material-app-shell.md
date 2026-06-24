# Task 003 — Material 3 app shell

## Goal

Build the basic UI shell using Lit and Material Web wrappers: theme, layout, navigation, and empty states for all MVP sections.

## Dependencies (must be complete first)

- Foundation (Tasks 001–002) complete
- `window.diskScope` preload API available

## Files likely to change

- `src/renderer/theme/material-theme.css`
- `src/renderer/components/ds-*.ts` (button, card, dialog, table, top-app-bar, nav-rail)
- `src/renderer/app-root.ts`
- `src/renderer/routes.ts`
- `src/renderer/features/*/index.ts` (empty states)
- `package.json` (add `@material/web` if not present)

## Implementation plan

1. Add `@material/web` dependency
2. Create Material 3 theme CSS with semantic tokens (light first, basic dark)
3. Build `DsButton`, `DsCard`, `DsDialog`, `DsTable`, `DsTopAppBar`, `DsNavRail` wrappers
4. Replace foundation placeholder shell with app layout: top bar, nav rail, content area
5. Add routes/sections: Overview, Largest Folders, Largest Files, File Types, Cleanup Candidates, Exclusions, Settings
6. Each section shows an empty state component (no real data yet)
7. Do not scatter raw Material Web components in feature folders

## Tests to add/update

- Component smoke tests where practical (optional for MVP)
- `pnpm typecheck`
- Manual: app starts with Material 3 look

## Acceptance criteria

- App has a modern Material 3 look
- Theme tokens centralized in `material-theme.css`
- Raw `@material/web` only inside `Ds*` wrappers
- All seven MVP nav sections exist with empty states
- Scan status region placeholder visible while “scanning” can be simulated later

## Risks / assumptions

- `@material/web` is in maintenance mode — wrappers isolate swap risk
- Task 006 will wire scan status region to real progress
