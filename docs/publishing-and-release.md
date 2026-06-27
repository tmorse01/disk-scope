# Publishing and release guide

Step-by-step instructions for building DiskScope for Windows and publishing installable artifacts to GitHub Releases.

## Prerequisites

| Requirement | Notes |
| --- | --- |
| **Windows** | Installers are built for `win32-x64` only (MVP scope). |
| **Node.js 20+** | CI uses Node 22. |
| **pnpm 10+** | Version pinned in `package.json` → `packageManager`. |
| **Rust toolchain** | Required for the native scanner module (`pnpm build:native`). Installed automatically in CI. |
| **GitHub CLI** (`gh`) | Required only for **local** release (`pnpm release`). Install from [cli.github.com](https://cli.github.com/) and run `gh auth login`. |
| **Git push access** | Required to push version tags that trigger CI. |

## What gets published

GitHub automatically attaches **Source code (zip)** and **Source code (tar.gz)** to every release. Those are repository archives, **not the installable app**. The release pipeline stages these user-facing assets:

| Build output (`out/`) | Published asset | Purpose |
| --- | --- | --- |
| `out/make/squirrel.windows/x64/*Setup.exe` | `DiskScope-<version>-Setup.exe` | Windows installer (recommended) |
| `out/DiskScope-win32-x64/` | `DiskScope-<version>-win32-x64-portable.zip` | Portable build — unzip and run `DiskScope.exe` |
| (generated) | `SHA256SUMS.txt` | SHA256 checksums for the files above |

Squirrel internals (`*.nupkg`, `RELEASES`) stay in `out/` and are not uploaded.

Release notes include a download guide that warns users not to use the source-code links.

---

## Pre-release checklist

Complete these before tagging or publishing:

1. **Quality gate** — all must pass on the commit you are releasing:

   ```powershell
   pnpm lint
   pnpm typecheck
   pnpm test
   ```

2. **Bump version** — edit `version` in [`package.json`](../package.json) (semver, e.g. `0.2.0`).

3. **Commit and push** — the tagged commit must be on `master` (or whatever branch you release from) with the updated `package.json` version.

4. **Optional smoke test locally** — build and install once before publishing:

   ```powershell
   pnpm build:native
   pnpm make
   ```

   See [Packaged smoke test](#packaged-smoke-test) below.

---

## Recommended: CI release (no local build upload)

GitHub Actions builds on `windows-latest`, runs tests, stages assets, and creates the release. You only bump the version, commit, and push a tag.

### Steps

1. Bump `version` in `package.json` and commit:

   ```powershell
   git add package.json
   git commit -m "chore: release v0.2.0"
   git push origin master
   ```

2. Create and push the tag (helper script reads version from `package.json`):

   ```powershell
   pnpm release:ci
   ```

   This runs [`scripts/release-github.ps1`](../scripts/release-github.ps1) with `-CiOnly`: creates annotated tag `v<version>` on `HEAD` and pushes it to `origin`.

3. **Watch the workflow** — open **Actions → Release** (or the URL printed by the script). Workflow file: [`.github/workflows/release.yml`](../.github/workflows/release.yml).

4. **Verify the release** — see [Verify a release succeeded](#verify-a-release-succeeded).

### Alternative: tag manually

```powershell
git tag -a v0.2.0 -m "Release v0.2.0"
git push origin v0.2.0
```

The tag name must be `v` + semver and must match `package.json` exactly.

### Alternative: manual workflow dispatch

If you need to rebuild without pushing a new tag:

1. Go to **Actions → Release → Run workflow**.
2. Enter the semver that **already matches** `package.json` (e.g. `0.2.0`).
3. Run the workflow.

Use this when a previous CI run failed or assets were missing. If the release already exists for that tag, you may need to delete the failed release or use a new patch version.

---

## Local release (build + upload from your machine)

Use when you want full control or CI is unavailable. Requires `gh auth login`.

### Steps

1. Bump `version` in `package.json` and commit (same as CI path).

2. Run the release script:

   ```powershell
   pnpm release
   ```

   This will:

   - Assert `package.json` version matches the release
   - Run lint, typecheck, and tests (unless skipped)
   - Run `pnpm build:native` and `pnpm make`
   - Stage assets via [`scripts/stage-release-assets.ps1`](../scripts/stage-release-assets.ps1) into `dist/release/`
   - Create the GitHub release and upload assets via `gh release create`

### Useful options

Pass flags after `--`:

```powershell
# Custom release notes (Markdown)
pnpm release -- -Notes "Fix scan cancellation on large drives"

# Notes from a file
pnpm release -- -NotesFile docs/release-notes-0.2.0.md

# Skip quality gate (faster iteration — not for production)
pnpm release -- -SkipTests

# Upload existing out/ without rebuilding
pnpm release -- -SkipBuild

# Create a draft release for review first
pnpm release -- -Draft
```

If you omit `-Notes` / `-NotesFile`, notes are auto-generated from commits since the previous tag.

---

## Build only (no publish)

### Full installers

```powershell
pnpm build:native
pnpm make
```

| Artifact | Path |
| --- | --- |
| Unpacked app | `out/DiskScope-win32-x64/DiskScope.exe` |
| Squirrel installer | `out/make/squirrel.windows/x64/DiskScope-<version> Setup.exe` |

### Unpacked app only (faster check)

```powershell
pnpm build:native
pnpm package
```

Launch `DiskScope.exe` from `out/DiskScope-win32-x64/`.

### Preview staged release assets (no upload)

```powershell
pnpm make
pnpm stage:release
# inspect dist/release/
```

---

## Verify a release succeeded

On the GitHub **Releases** page for tag `v<version>`, confirm these **3 app assets** are present (plus GitHub's 2 source archives):

- `DiskScope-<version>-Setup.exe`
- `DiskScope-<version>-win32-x64-portable.zip`
- `SHA256SUMS.txt`

Release notes should include the download guide (do not use source code links).

Optional checksum verification:

```powershell
# After downloading SHA256SUMS.txt and the installer
Get-FileHash -Algorithm SHA256 DiskScope-0.2.0-Setup.exe
# Compare hash to the line in SHA256SUMS.txt
```

---

## Packaged smoke test

After `pnpm make`, install from the Squirrel Setup exe (or run the unpacked exe) and verify:

- App opens without auto-opening DevTools
- Folder picker works
- Scan completes and results views populate
- Preferences persist under `%APPDATA%/DiskScope/`

Windows SmartScreen may warn on first launch because builds are not code-signed. That is expected for MVP builds.

---

## Marketing website (optional)

The landing site in [`website/`](../website/) links to GitHub Releases for downloads. Netlify rebuilds on push when connected to the repo.

**One-time Netlify setup** (see [`docs/tasks/019-marketing-website.md`](tasks/019-marketing-website.md)):

1. Netlify → New site from Git → this repository
2. Base directory: `website`
3. Build command: `pnpm install && pnpm build`
4. Publish directory: `website/dist`

After a GitHub release, the download button resolves the latest `DiskScope-*-Setup.exe` via the GitHub Releases API. No separate website deploy is required unless you changed site content — then push to `master` and Netlify redeploys automatically.

Local preview:

```powershell
pnpm build:website
pnpm preview:website
```

---

## Troubleshooting

| Problem | What to do |
| --- | --- |
| **Version mismatch** | Tag/workflow input must match `package.json` `version` exactly (workflow compares them). |
| **Tag already on origin** | `pnpm release:ci` skips push. Delete the remote tag only if you intend to rebuild the same version: `git push origin :refs/tags/v0.2.0`, then re-tag and push. Prefer bumping patch version instead. |
| **Missing `out/` artifacts** | Run `pnpm build:native` then `pnpm make`. Staging fails if Squirrel Setup exe or unpacked exe is missing. |
| **`gh` not authenticated** | Run `gh auth login` for local releases. |
| **CI release failed mid-run** | Fix the failure, then re-run the workflow (dispatch) or push a new tag after a patch bump. |
| **Users download source zip** | Point them to **DiskScope-*-Setup.exe** on the Releases page, not "Source code (zip)". |

---

## Quick reference

| Goal | Command |
| --- | --- |
| CI release (recommended) | Bump version → commit → `pnpm release:ci` |
| Local build + publish | `pnpm release` |
| Build installers only | `pnpm build:native && pnpm make` |
| Preview staged assets | `pnpm make && pnpm stage:release` |
| Quality gate | `pnpm lint && pnpm typecheck && pnpm test` |

Related files:

- [`scripts/release-github.ps1`](../scripts/release-github.ps1) — local and CI tag helper
- [`scripts/stage-release-assets.ps1`](../scripts/stage-release-assets.ps1) — `out/` → `dist/release/`
- [`.github/workflows/release.yml`](../.github/workflows/release.yml) — CI release pipeline
- [`README.md`](../README.md) — packaging summary

## Future: auto-update

Task [**022 — Auto-update**](tasks/022-auto-update.md) will extend releases with update-feed assets (likely Squirrel `RELEASES` + `*.nupkg`, or a GitHub-oriented updater) and add in-app check / apply from Settings. Until that ships, users update by downloading a new installer from GitHub Releases.
