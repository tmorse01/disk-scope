# Task 012 — Packaging baseline

## Goal

Build installable artifacts for local testing on Windows.

## Dependencies (must be complete first)

- MVP vertical slice stable (picker → scan → results views)
- Tasks 003–011 substantially complete

## Files likely to change

- `forge.config.ts`
- `package.json` (metadata, icons)
- `assets/` (app icon placeholder)
- `README.md` (packaging notes)

## Implementation plan

1. Configure Electron Forge makers (Squirrel for Windows primary)
2. Add app icon placeholder and product metadata
3. Verify fuses and asar settings
4. Document `pnpm make` output locations
5. Test packaged app outside dev mode

## Tests to add/update

- `pnpm make` succeeds locally
- Manual: install/open packaged build
- Optional: add `make` to CI (slow — defer unless requested)

## Acceptance criteria

- `pnpm make` produces installable Windows artifact
- Packaged app opens and core scan workflow works
- Dev-only behaviors (auto DevTools) disabled when packaged

## Risks / assumptions

- Code signing not in MVP scope
- CI packaging optional per foundation plan
