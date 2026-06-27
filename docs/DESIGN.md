# DiskScope — Design & branding

Canonical reference for product identity, logo usage, color, typography, and **custom window chrome**. Implementation tokens live in [`src/renderer/theme/tokens.ts`](../src/renderer/theme/tokens.ts); Stitch export artifact: [`src/stitch_diskscope_material_ui/diskscope/DESIGN.md`](../src/stitch_diskscope_material_ui/diskscope/DESIGN.md).

UI stack conventions: [`tech-stack-and-ux.md`](tech-stack-and-ux.md).

---

## Brand identity

DiskScope is a **professional, precise, systematic** utility for disk analysis. The aesthetic is **Modern Corporate Minimalist** — Material 3 tonal surfaces, soft rounded geometry, and high legibility for data-heavy views. The emotional goal: confidence and clarity when managing system storage.

---

## Logo & brand mark

**Source file:** [`assets/brand-mark.svg`](../assets/brand-mark.svg) (also used as [`website/public/favicon.svg`](../website/public/favicon.svg)).

### Anatomy

| Element | Color | Role |
| --- | --- | --- |
| Rounded square (8px radius at 32px) | `#005bbf` | Primary brand field |
| Three horizontal bars | `#ffffff` | List / scan motif |
| Accent circle | `#1a73e8` | Primary container highlight |

### Sizes

| Context | Size | Notes |
| --- | --- | --- |
| Title bar | 24px | Paired with wordmark |
| Sidebar (expanded) | 32px | Default in-app presence |
| Sidebar (rail) | 24px | Collapsed nav |
| Toolbar / inline | 16px | Minimum readable size |
| Marketing | 48px+ | Hero, og-image, store listings |

### Clear space

Maintain padding equal to **25% of mark width** on all sides. Do not place text or UI controls inside this zone.

### Usage rules

**Do**

- Use the SVG mark as-is on `surface-container-low` or white backgrounds
- Use the React `BrandMark` component in the desktop app for consistent rendering
- Use `assets/icon.ico` for OS shell icons (taskbar, installer)

**Don't**

- Stretch or skew the mark
- Change mark colors outside the brand palette
- Add drop shadows or glows to the mark
- Replace the mark with generic Material icons (e.g. `hard_drive`) in product chrome

---

## Color system

Primary palette (light mode):

| Token | Hex | Usage |
| --- | --- | --- |
| Primary | `#005bbf` | Brand, key actions, active nav |
| Primary container | `#1a73e8` | Accent dot, contained buttons |
| Background | `#f8f9fa` | App canvas, window flash color |
| Surface container low | `#f3f4f5` | Sidebar, title bar |
| Outline variant | `#c1c6d6` | Borders, dividers |
| On surface | `#191c1d` | Primary text |

Dark mode uses elevated surface tiers (`#1a1a1a` → `#383838`) — see `stitchDarkColors` in `tokens.ts`. Always use **semantic MUI roles** in UI code, not raw hex in features.

Shared constants for main-process window setup: [`src/shared/branding.ts`](../src/shared/branding.ts).

---

## Typography

| Role | Family | Usage |
| --- | --- | --- |
| UI | Geist | Labels, headers, body |
| Data | JetBrains Mono | File sizes, paths, counts |

Sentence case for labels. Tabular numbers for size columns.

---

## Window chrome (Windows)

DiskScope uses a **frameless custom title bar** on Windows only (v1). macOS and Linux keep the native OS frame.

### Layout

```
┌──────────────────────────────────────────────────────┐
│ [mark] DiskScope                          [ — □ × ] │  40px title bar
├────────┬─────────────────────────────────────────────┤
│  Nav   │  Context bar + content                      │
└────────┴─────────────────────────────────────────────┘
```

- **Title bar** = OS window chrome (drag, min/max/close)
- **Context bar** (`DsContextBar`) = in-app breadcrumbs and view actions — separate layer below title bar

### Title bar spec

| Property | Value |
| --- | --- |
| Height | 40px (`layout.titleBarHeight`) |
| Background | `surface-container-low` (light and dark) |
| Border | 1px bottom `outline-variant` |
| Drag region | `-webkit-app-region: drag` on bar and wordmark |
| No-drag | Window control buttons (`no-drag`) |
| Double-click drag area | Toggle maximize |
| Control hit target | 46×40px per button |
| Control hover | 8% on-surface overlay; close → error red |
| Icons | Material Symbols: `remove`, `crop_square` / `filter_none`, `close` |

### Components

| Component | Path |
| --- | --- |
| `BrandMark` | `src/renderer/components/BrandMark.tsx` |
| `DsTitleBar` | `src/renderer/components/DsTitleBar.tsx` |
| `DsWindowControls` | `src/renderer/components/DsWindowControls.tsx` |

Window actions flow through preload `window.diskScope.windowControls` → main-process IPC.

---

## App vs website

| Asset | Desktop app | Website |
| --- | --- | --- |
| Brand mark SVG | `BrandMark` component | `favicon.svg` |
| App icon | `assets/icon.ico` | — |
| Social preview | — | `website/public/og-image.svg` |
| Theme tokens | `src/renderer/theme/tokens.ts` | `website/src/lib/theme.ts` |

Keep favicon and in-app mark in sync via shared `assets/brand-mark.svg`.

---

## Related docs

- [`docs/tech-stack-and-ux.md`](tech-stack-and-ux.md) — React, MUI, shell components
- [`docs/tasks/020-custom-window-frame.md`](tasks/020-custom-window-frame.md) — implementation task
- [`AGENTS.md`](../AGENTS.md) — agent workflow
