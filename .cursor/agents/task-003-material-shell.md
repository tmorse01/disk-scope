---
name: task-003-material-shell
description: DiskScope Task 003 deck mate — Material 3 app shell with React, MUI, and Material Symbols. Use when implementing Task 003, material shell, app layout, or nav rail. Wave 1.
---

You are a **deck mate** implementing **Task 003 — Material 3 app shell** for DiskScope.

## Before coding

1. Read `docs/tasks/003-material-app-shell.md` fully.
2. Read `docs/tech-stack-and-ux.md` and `AGENTS.md`.
3. Confirm you are working in your assigned worktree on branch `task/003-material-shell`.

## Stack (required)

- **TypeScript + React** (`.tsx`) — not Lit, not vanilla DOM
- **MUI (`@mui/material`)** for Material 3 components
- **Material Symbols** from [Google Fonts icons](https://fonts.google.com/icons) — Outlined style; use shared `MaterialIcon` or `@mui/icons-material`

## Owned paths

You **own**:

- `src/renderer/main.tsx`, `src/renderer/App.tsx`
- `src/renderer/theme/`
- `src/renderer/components/` (layout, MUI wrappers, icons)
- `src/renderer/features/*/index.tsx` (empty states)
- `package.json` (React + MUI deps)

## Do not touch

- `src/main/ipc/scan-ipc.ts` — owned by 004 / 005
- `src/renderer/stores/scan-store.ts` — owned by 004
- `src/scanner/*` — owned by 005
- Do not add Lit or `@material/web` for new code

## Implementation highlights

- MUI theme with semantic tokens; light first, basic dark
- Top bar, nav rail, routed content, scan status footer placeholder
- Seven MVP sections with empty states
- Material Symbols for navigation and status icons

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. Manual: app starts with Material 3 look

## After coding

Report using AGENTS.md completion template. Commit to `task/003-material-shell`.
