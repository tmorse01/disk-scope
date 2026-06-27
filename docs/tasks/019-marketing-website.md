# Task 019 — Marketing website (Astro + Netlify)

## Goal

Ship a static marketing landing page for DiskScope that matches the desktop app’s Material Design 3 theme ([`docs/tech-stack-and-ux.md`](../tech-stack-and-ux.md), [`src/renderer/theme/`](../../src/renderer/theme/)), includes SEO metadata, and publishes to Netlify with a download CTA to GitHub Releases.

## Dependencies (must be complete first)

- Task 012 packaging baseline (GitHub Releases with `DiskScope-*-Setup.exe`)
- App M3 theme in `src/renderer/theme/` (tokens, typography, `mui-theme.ts`)

## Files likely to change

- `pnpm-workspace.yaml` (new)
- `website/` — Astro app (pages, components, config)
- `package.json` — root `dev:website` / `build:website` scripts
- `eslint.config.mjs` — ignore or include `website/`
- `.gitignore` — `website/dist/`

## Implementation plan

1. Add `website/` pnpm workspace package with Astro 5 + `@astrojs/react` + `@astrojs/sitemap`
2. Import app theme directly via Vite alias `@app-theme` → `src/renderer/theme/` (same `stitchColors`, `muiTheme`, typography as Electron app)
3. Static Astro sections for hero, features, FAQ (semantic HTML for SEO)
4. React island for `DownloadButton` (MUI + `muiTheme`, GitHub Releases API with fallback)
5. SEO: title, description, OG/Twitter, JSON-LD `SoftwareApplication`, sitemap, `robots.txt`
6. `netlify.toml` with base `website`, publish `dist`

## Tests to add/update

- Manual: `pnpm --dir website build` succeeds
- Manual: Lighthouse SEO ≥ 90 on built page
- Manual: Download CTA resolves to latest `DiskScope-*-Setup.exe`

## Acceptance criteria

- Single landing page at `/` with hero, features, FAQ, download CTA, footer
- Visual alignment with app M3 palette (#005bbf primary, Geist + JetBrains Mono, rounded cards)
- Static HTML includes primary keywords and FAQ copy for crawlers
- Netlify can build from `website/` with documented one-time setup
- Download button links to GitHub Releases (API or fallback URL)

## Risks / assumptions

- Netlify site URL / custom domain TBD — update `site` in `astro.config.mjs` when domain is set
- Windows-only download in v1 (matches current packaging)
- No blog or multi-page SEO expansion in v1

## Netlify setup (one-time)

1. Netlify → New site from Git → `tmorse01/disk-scope`
2. Base directory: `website`
3. Build command: `pnpm install && pnpm build` (or use repo root with `pnpm build:website`)
4. Publish directory: `website/dist`
5. Add custom domain when ready; update Astro `site` URL
