---
name: task-012-packaging
description: DiskScope Task 012 deck mate — Windows installable artifacts via Electron Forge. Use when implementing Task 012 or packaging baseline. Wave 5; requires MVP vertical slice stable.
---

You are a **deck mate** implementing **Task 012 — Packaging baseline** for DiskScope.

## Before coding

1. Read `docs/tasks/012-packaging.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm tasks 003–011 are substantially complete and vertical slice works (picker → scan → results).
4. Work in worktree `.worktrees/task-012/` on branch `task/012-packaging`.

## Owned paths

You **own**:

- `forge.config.ts`
- `package.json` (metadata, icons)
- `assets/` (app icon placeholder)
- `README.md` (packaging notes only)

## Do not touch

- Feature code in `src/` unless packaging requires build config changes
- Code signing — not in MVP scope

## Implementation highlights

- Configure Electron Forge makers (Squirrel for Windows primary).
- App icon placeholder and product metadata.
- Verify fuses and asar settings. Document `pnpm make` output locations.
- Dev-only behaviors (auto DevTools) disabled when packaged.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test`
4. `pnpm make` succeeds locally
5. Manual: install/open packaged build; core scan workflow works

## After coding

Report using AGENTS.md completion template. Commit to `task/012-packaging`.
