# Task 020 — Brand logo SVG

## Goal

Create a DiskScope brand mark by composing Material Symbols Outlined `hard_drive` and `search` into a two-color badge (blue `#005bbf` + white `#ffffff`), usable from 16px favicons through app packaging icons.

## Dependencies (must be complete first)

- Task 003 (Material app shell — brand tile in nav rail)
- Task 019 (marketing website — favicon and header)

## Files likely to change

- `assets/brand/logo-mark.svg` — transparent mark (glyphs only)
- `assets/brand/logo-favicon.svg` — 32×32 blue tile + mark
- `assets/brand/logo-app.svg` — 512×512 source for raster app icons
- `website/public/favicon.svg`
- `website/public/logo-mark.svg` — copy for static hosting
- `website/public/og-image.svg`
- `website/src/pages/index.astro`
- `src/renderer/components/BrandMark.tsx` (optional shared component)
- `src/renderer/App.tsx`
- `assets/icon.png`, `assets/icon.ico`

## Implementation plan

1. Export official Material Symbols Outlined paths for `hard_drive` and `search` (24px, FILL@0, wght@400).
2. Compose badge layout: blue rounded tile, white hard_drive (~62% scale, up-left), white search badge (~42% scale, bottom-right overlap).
3. Add Apache 2.0 license comment in SVG source files.
4. Wire favicon, website header, OG image, and app nav brand tile.
5. Regenerate Electron `icon.png` / `icon.ico` from `logo-app.svg`.

## Tests to add/update

- Manual visual QA at 16, 32, 40, 128, and 512px rendered sizes
- `pnpm lint` / `pnpm typecheck` if React components change

## Acceptance criteria

- Mark reads as disk + search at 32px using only `#005bbf` and `#ffffff`.
- Paths sourced from Material Symbols Outlined with license attribution.
- Website favicon and header use the new mark.
- App nav rail uses the composed mark; packaging icons regenerated.

## Risks / assumptions

- Material Symbols paths may need transform flattening before compose.
- Search handle may need scale tuning for 16px legibility.
- Icon glyphs are Apache 2.0 — see [Google Fonts Material Symbols](https://fonts.google.com/icons).
