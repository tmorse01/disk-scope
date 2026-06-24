# DiskScope — Tech stack and UX patterns

Canonical reference for renderer technology, Material Design usage, and UI conventions. Coding agents and humans should follow this document alongside [`AGENTS.md`](../AGENTS.md) and [`disk-scope-project-scope.md`](disk-scope-project-scope.md).

## Renderer stack

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | **TypeScript** | Strict mode; shared types in `src/shared/types.ts` |
| UI framework | **React** | Functional components and hooks only — not Lit, not vanilla TS DOM |
| Build | **Vite** (Electron Forge plugin) | Renderer bundle via existing Forge/Vite setup |
| Electron | Main + preload + renderer | Renderer has no direct filesystem access |

### React conventions

- Use **`.tsx`** for all UI components and views.
- One feature per folder under `src/renderer/features/<feature-name>/`.
- Colocate feature-specific components, hooks, and tests in that folder.
- App shell, shared layout, and design-system wrappers live under `src/renderer/components/`.
- Entry: `src/renderer/main.tsx` mounts `<App />` into `#app`.
- Prefer small, readable components over large monolith files.
- Use TypeScript types for props; avoid `any`.
- State: small app-owned stores or React context — no Redux/MobX in MVP (see scope doc).

### Migration note

Wave 1 landed a **Lit + `@material/web`** shell. **All new renderer work and refactors use React.** When touching existing Lit files, prefer migrating the touched surface to React rather than extending Lit.

---

## Material Design 3

DiskScope targets **Material Design 3** look and behavior: semantic color roles, rounded surfaces, clear hierarchy, accessible contrast.

### Component library

Use **MUI (Material UI) v6+** with the Material 3 theme for React:

- `@mui/material` — layout, inputs, dialogs, tables, app bar, navigation
- `@emotion/react` and `@emotion/styled` — MUI peer styling (installed with MUI)

Do **not** add new `@material/web` or Lit-based UI. Do **not** scatter raw MUI primitives across feature folders without thin app wrappers when the same control is reused.

Optional app-owned wrappers (e.g. `DsButton`, `DsDialog`) may wrap MUI for consistent defaults — same idea as before, but React + MUI instead of Lit + web components.

### Theme

- Central theme: `src/renderer/theme/` (MUI `createTheme` + CSS variables if needed).
- Light mode first; support dark via `prefers-color-scheme` or explicit user preference later.
- Use **semantic tokens** (primary, surface, error, on-surface, etc.) — no one-off hex colors in feature code.
- Risk/cleanup labels map to M3 roles: success → tertiary/safe, warning → warning, danger → error.

---

## Material icons

Use **[Material Symbols](https://fonts.google.com/icons)** from Google Fonts — the official Material icon set.

### Default style

- **Outlined** (`Material Symbols Outlined`) for nav, toolbars, and inline UI icons.
- Filled or rounded variants only when design explicitly calls for emphasis.

### Loading the font

Add to renderer HTML (or equivalent Vite HTML template):

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=folder,progress_activity,settings"
/>
```

For development, linking the full variable font is acceptable:

```html
<link
  rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
/>
```

Browse and copy icon names at [Google Fonts — Material Symbols](https://fonts.google.com/icons).

### Renderer preview (layout validation in browser)

For agent or local layout checks without Electron, run:

```powershell
pnpm dev:renderer-preview
```

This serves `preview.html` with a mocked `window.diskScope` — folder picker and scan IPC are stubbed; use for nav, theme, and component layout only.

### React usage

Prefer a small shared component:

```tsx
type MaterialIconProps = {
  name: string;
  className?: string;
  'aria-hidden'?: boolean;
  title?: string;
};

export function MaterialIcon({ name, className, title }: MaterialIconProps) {
  return (
    <span
      className={`material-symbols-outlined ${className ?? ''}`}
      aria-hidden={title ? undefined : true}
      title={title}
    >
      {name}
    </span>
  );
}
```

**Alternatives (either is fine):**

- `@mui/icons-material` — same glyphs, React components; use when an MUI component expects an `icon` prop.
- Inline `<span className="material-symbols-outlined">icon_name</span>` — use snake_case names from the Google Fonts catalog (e.g. `progress_activity`, `folder_open`).

### Icon accessibility

- Decorative icons: `aria-hidden={true}`.
- Icon-only buttons: `aria-label` on the button, not only the icon.
- Do not rely on icon shape alone for critical meaning — pair with text where possible.

---

## UX patterns (MVP)

Aligned with [scope doc §9](disk-scope-project-scope.md#9-ux-structure).

### Shell layout

```text
┌─────────────────────────────────────────────┐
│ Top app bar — title, active scan path       │
├──────────┬──────────────────────────────────┤
│ Nav rail │ Main content (routed views)      │
│ (7 sect) │                                  │
├──────────┴──────────────────────────────────┤
│ Scan status strip (visible while scanning)  │
└─────────────────────────────────────────────┘
```

### Primary navigation (7 sections)

1. Overview  
2. Largest Folders  
3. Largest Files  
4. File Types  
5. Cleanup Candidates  
6. Exclusions  
7. Settings  

Use MUI `Drawer` / `NavigationRail` patterns or equivalent; keep labels visible or tooltips on collapse.

### Core workflow

```text
Select target → Scan → Largest folders → Drill down → Reveal / copy / exclude
```

Prioritize **sortable tree tables**, breadcrumbs, and compact size bars over charts or treemaps in MVP.

### Empty and loading states

- Every section shows a clear empty state before the first scan.
- Scan in progress: status strip + non-blocking progress (counts, current path, cancel).
- Errors: inline alerts (MUI `Alert`), not silent failure.

### Data display

- Sizes: use `src/shared/format-bytes.ts` — do not duplicate.
- Paths: monospace or truncated with full path on hover/copy.
- Risk labels for cleanup candidates: color + text label (never icon-only for risk).

---

## What not to do

| Avoid | Instead |
| --- | --- |
| Lit, web components, `@material/web` for new UI | React + MUI |
| Vanilla TS DOM in feature views | React components |
| Filesystem APIs in renderer | `window.diskScope` preload API |
| Permanent delete in MVP | Reveal, copy, exclude only |
| Heavy global state libraries | Small stores / context |
| Random icon fonts or heroicons | Material Symbols only |

---

## Related docs

- [`AGENTS.md`](../AGENTS.md) — agent contract and guardrails  
- [`docs/tasks/`](tasks/) — per-task specs (update when stack details change)  
- [`docs/agent-fleet-playbook.md`](agent-fleet-playbook.md) — parallel agent workflow  
- [Material Symbols](https://fonts.google.com/icons) — icon catalog  
- [MUI Material 3](https://mui.com/material-ui/) — React component library  
