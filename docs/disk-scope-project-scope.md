# DiskScope Project Scope

## 1. Product Summary

**Working name:** DiskScope

DiskScope is a modern, cleanup-focused disk usage analyzer for developers and power users. The app lets a user select a drive or folder, scans the file tree, calculates folder sizes, and surfaces the largest cleanup opportunities first.

The primary job is simple:

> Help the user quickly answer: “Where is my disk space going, and what can I safely target for cleanup?”

This is not a generic system optimizer. It is not trying to replace OS storage settings, CCleaner, or enterprise disk auditing tools. The MVP should stay focused on local disk visibility, drilldown, and safe cleanup targeting.

**UI and renderer conventions:** [`docs/tech-stack-and-ux.md`](tech-stack-and-ux.md) (TypeScript + React, MUI, Material Symbols).

## 2. Product Positioning

### Core wedge

DiskScope should compete less on raw scan speed and more on cleanup intelligence.

Existing tools like WinDirStat, WizTree, TreeSize, SpaceSniffer, DaisyDisk, and GrandPerspective already show disk usage well. DiskScope should differentiate through a modern UX and developer-aware cleanup hints.

### Target users

Primary:

- Software developers
- Power users
- People with large local workspaces, package caches, build outputs, downloads, and project artifacts

Secondary:

- General desktop users who want a cleaner, simpler WinDirStat-style experience

### Main value props

- Fast enough recursive scanning without freezing the UI
- Clear “largest folders first” workflow
- Drilldown that makes cleanup targets obvious
- Developer cleanup detection for folders like `node_modules`, `.next`, `dist`, `build`, `.turbo`, `.pnpm-store`, `.nuget`, `bin`, `obj`, Docker-related cache folders, and old repo artifacts
- Risk labels so users do not blindly delete dangerous folders
- Safe actions first: reveal path, copy path, rescan, ignore/exclude

## 3. Upfront Technical Decisions

### Runtime

Use **Electron**.

Reasoning:

- Local disk scanning requires native filesystem access.
- The app needs a desktop file/folder picker.
- Long-running filesystem work should run outside the renderer.
- Electron gives a TypeScript-friendly desktop app model with a web UI.

### Language

Use **TypeScript** everywhere.

Requirements:

- `strict: true`
- No implicit `any`
- Shared types between main, preload, scanner, and renderer
- Typed IPC contracts

### Build system

Use **Electron Forge + Vite + TypeScript**.

Initial scaffold target:

```bash
npx create-electron-app@latest diskscope --template=vite-typescript
```

### Package manager

Use **pnpm**.

Expected scripts:

```json
{
  "scripts": {
    "dev": "electron-forge start",
    "package": "electron-forge package",
    "make": "electron-forge make",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### Renderer framework

Use **TypeScript + React** for the MVP renderer.

Reasoning:

- User preference: React over Lit or vanilla TypeScript DOM for UI.
- Material Design 3 maps cleanly to **MUI (`@mui/material`)** in React.
- Electron Forge + Vite already support a React renderer entry.
- Hooks and functional components keep feature code readable as the app grows.

Conventions (see [`docs/tech-stack-and-ux.md`](tech-stack-and-ux.md)):

- All UI in `.tsx` under `src/renderer/features/` and `src/renderer/components/`.
- MUI for components; centralized theme in `src/renderer/theme/`.
- **Material Symbols** icons from [Google Fonts](https://fonts.google.com/icons) (Outlined default).
- Optional thin app wrappers (e.g. `DsButton`) around MUI for shared defaults — do not scatter unconfigured MUI primitives everywhere.

Migration:

- Wave 1 merged a Lit + `@material/web` shell. New work and refactors **use React**; migrate touched Lit surfaces rather than extending them.

Risk decision:

- Do not introduce Lit, `@material/web`, or web components for new renderer code.
- Keep `@mui/material` usage consistent via theme tokens — no hardcoded one-off colors in features.

### Styling and theme

Use Material 3 design tokens through MUI theme and CSS custom properties where needed.

Theme requirements:

- Light mode first
- Dark mode supported early, even if basic
- App-owned theme: `src/renderer/theme/` (MUI `createTheme` + optional `material-theme.css` tokens)
- No hardcoded one-off colors in components
- Use semantic tokens for background, surface, primary, warning, danger, and success states

### State management

Start with simple app-owned stores, not a heavy global state framework.

Use small TypeScript stores for:

- Current scan session
- Scan progress
- Selected directory node
- Active filters/sort
- Cleanup candidates
- User preferences

Do not introduce Redux/MobX/etc. in the MVP.

### Scanner execution model

Scanning must not run in the renderer.

Use:

- Electron main process as coordinator
- Node worker thread for scan execution
- Typed IPC between renderer and main
- Batched progress events from worker to main to renderer

The renderer should never receive raw filesystem privileges. It only calls a limited preload API.

### Persistence

MVP should use in-memory scan results plus optional lightweight JSON preferences.

Do not start with SQLite unless scan history becomes a first-class feature.

Persist only:

- Last selected scan paths
- Excluded paths/patterns
- UI preferences
- Theme preference

Post-MVP can add SQLite for scan history, comparisons, and very large result sets.

### File actions

MVP actions:

- Reveal in file explorer
- Copy path
- Rescan selected folder
- Add path/pattern to exclusions
- Export scan report as JSON or CSV

Do not implement permanent delete in the MVP.

Move-to-trash can be a later feature after the app has strong safety UX, confirmation flows, and test coverage.

## 4. Security Baseline

Electron security rules are mandatory, not optional.

### BrowserWindow requirements

- `nodeIntegration: false`
- `contextIsolation: true`
- `sandbox: true` where compatible
- `webSecurity: true`
- No remote content
- No arbitrary navigation
- No arbitrary window opens

### Preload API rules

Expose only a narrow typed API:

```ts
window.diskScope = {
  selectDirectory(): Promise<SelectedPath | null>;
  startScan(options: StartScanOptions): Promise<ScanSessionId>;
  cancelScan(scanId: ScanSessionId): Promise<void>;
  revealPath(path: string): Promise<void>;
  copyPath(path: string): Promise<void>;
  exportReport(scanId: ScanSessionId, options: ExportOptions): Promise<void>;
  onScanProgress(callback: (event: ScanProgressEvent) => void): Unsubscribe;
  onScanComplete(callback: (event: ScanCompleteEvent) => void): Unsubscribe;
  onScanError(callback: (event: ScanErrorEvent) => void): Unsubscribe;
};
```

Do not expose generic filesystem read/write APIs to the renderer.

## 5. MVP Scope

### MVP user story

As a user, I can select a drive or folder, scan it, see where the largest folders/files are, drill into large directories, and identify safe cleanup candidates without manually hunting through the filesystem.

### MVP features

#### 1. Select scan target

Required:

- Native folder picker
- Supports drive root or any directory
- Shows selected path before scan starts
- User can cancel before scan

#### 2. Scan progress

Required:

- Files scanned
- Directories scanned
- Bytes discovered
- Current folder or shortened current path
- Errors encountered
- Elapsed time
- Cancel button

Progress events should be batched. Do not emit UI updates for every file.

#### 3. Folder size aggregation

Required:

- Calculate total size per directory
- Calculate file count per directory
- Calculate direct child directory sizes
- Preserve parent/child relationships
- Mark unreadable directories
- Avoid symlink/junction loops

#### 4. Largest folders view

Required columns:

- Folder name
- Full path on hover/details
- Size
- Percent of scan root
- File count
- Directory count
- Last modified where available
- Risk label where applicable

Required interactions:

- Sort by size descending by default
- Expand/collapse tree rows
- Click row to select directory
- Drill into selected directory
- Reveal selected directory in OS file explorer
- Copy path

#### 5. Largest files view

Required columns:

- File name
- Path
- Size
- Extension
- Last modified

Keep only the top largest files in memory. Do not store every file node unless needed.

Default: top 500 largest files.

#### 6. File type summary

Required:

- Group by extension
- Total size per extension
- File count per extension
- Sort by total size descending

Example groups:

- `.zip`
- `.mp4`
- `.iso`
- `.log`
- `.dll`
- `.map`
- `[no extension]`

#### 7. Developer cleanup candidates

Required MVP cleanup rules:

| Pattern | Label | Risk | Default recommendation |
|---|---|---:|---|
| `node_modules` | Node dependencies | Low | Usually safe to delete; reinstall with package manager |
| `.next` | Next.js build output | Low | Usually safe to delete if not needed for local debugging |
| `dist` | Build output | Low/Medium | Safe when generated; verify for published artifacts |
| `build` | Build output | Low/Medium | Safe when generated; verify for published artifacts |
| `.turbo` | Turbo cache | Low | Usually safe to delete |
| `.vite` | Vite cache | Low | Usually safe to delete |
| `.pnpm-store` | pnpm store | Medium | Can reclaim space but may slow future installs |
| `.nuget/packages` | NuGet package cache | Medium | Can reclaim space but may slow future restores |
| `bin` under .NET project | .NET build output | Low | Usually safe to delete |
| `obj` under .NET project | .NET intermediate output | Low | Usually safe to delete |
| `.pytest_cache` | Python test cache | Low | Usually safe to delete |
| `.venv` | Python virtual environment | Medium | Safe if recreateable, but confirm project setup |
| `coverage` | Test coverage output | Low | Usually safe to delete |

The app should show an estimated reclaimable total by risk level.

#### 8. Exclusions

Required:

- Exclude a selected path from future scans
- Exclude by exact path
- Exclude by folder name pattern
- Show active exclusions before scanning
- Allow removing exclusions

Default behavior:

- Do not follow symlinks/junctions
- Do not silently skip hidden folders
- Mark access-denied folders instead of crashing

#### 9. Export report

Required formats:

- JSON
- CSV

Minimum exported data:

- Root path
- Scan timestamp
- Total size
- File count
- Directory count
- Error count
- Top folders
- Top files
- Cleanup candidates

## 6. Explicit Non-Goals

The MVP will not include:

- Permanent delete
- Automatic cleanup
- Registry cleaning
- Browser cache cleaning
- App uninstaller features
- Duplicate file detection
- Cloud storage scanning
- Network drive optimization
- Admin privilege escalation
- NTFS MFT direct scanning
- Real-time filesystem watcher
- Background daemon
- System tray agent
- Multi-machine reporting
- Account/login/sync

These can be reconsidered later only after the core scan/drilldown workflow is excellent.

## 7. Data Model

### Core types

```ts
export type ScanSessionId = string;
export type NodeId = string;

export type ScanStatus =
  | 'idle'
  | 'selecting-target'
  | 'scanning'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'do-not-touch';

export type DirectoryNode = {
  id: NodeId;
  parentId: NodeId | null;
  name: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
  directoryCount: number;
  childDirectoryIds: NodeId[];
  modifiedAt?: string;
  unreadable: boolean;
  errorCode?: string;
};

export type LargestFileEntry = {
  path: string;
  name: string;
  extension: string | null;
  sizeBytes: number;
  modifiedAt?: string;
};

export type ExtensionSummary = {
  extension: string | null;
  sizeBytes: number;
  fileCount: number;
};

export type CleanupCandidate = {
  path: string;
  name: string;
  label: string;
  ruleId: string;
  sizeBytes: number;
  fileCount: number;
  risk: RiskLevel;
  recommendation: string;
};

export type ScanResult = {
  scanId: ScanSessionId;
  rootPath: string;
  startedAt: string;
  completedAt: string;
  totalSizeBytes: number;
  fileCount: number;
  directoryCount: number;
  errorCount: number;
  rootNodeId: NodeId;
  directoriesById: Record<NodeId, DirectoryNode>;
  largestFiles: LargestFileEntry[];
  extensionSummaries: ExtensionSummary[];
  cleanupCandidates: CleanupCandidate[];
  errors: ScanFileError[];
};

export type ScanFileError = {
  path: string;
  operation: 'stat' | 'read-dir' | 'read-link' | 'unknown';
  code: string;
  message: string;
};
```

### Memory strategy

Do not store every file as a tree node.

Store:

- Directory nodes
- Top N largest files
- Extension summaries
- Cleanup candidates
- Error list

This keeps the app focused and reduces memory pressure during large scans.

## 8. Scanner Design

### Scanner responsibilities

The scanner worker owns:

- Recursive traversal
- Directory aggregation
- File counting
- Error capture
- Symlink/junction handling
- Cleanup candidate detection
- Progress batching
- Cancellation checks

### Main process responsibilities

The Electron main process owns:

- Native folder picker
- Starting/stopping scanner workers
- IPC validation
- OS actions like reveal in file explorer
- Exporting reports

### Renderer responsibilities

The renderer owns:

- UI state
- Scan progress display
- Result visualization
- User interactions
- Calling typed preload APIs

The renderer must not import `fs`, `path`, or Node filesystem modules directly.

### Traversal rules

Default rules:

- Use iterative traversal to avoid call stack issues
- Do not follow symlinks/junctions by default
- Handle access-denied errors per path
- Continue scanning when individual paths fail
- Batch progress no more often than every 250ms
- Allow cancellation within roughly 2 seconds

### Performance targets

These are MVP targets, not strict guarantees:

- UI remains responsive during scan
- Progress appears within 500ms of scan start
- Cancellation completes within 2 seconds in normal cases
- Memory usage stays reasonable for large user folders
- No renderer freezes longer than 100ms from scan events

Do not try to beat WizTree scan speed in v1. Direct NTFS MFT scanning is explicitly post-MVP.

## 9. UX Structure

### Main navigation

Use a simple Material 3 shell:

- Top app bar with app name and active scan path
- Left navigation rail or tabs
- Main content area
- Persistent scan status region while scanning

Primary sections:

1. Overview
2. Largest Folders
3. Largest Files
4. File Types
5. Cleanup Candidates
6. Exclusions
7. Settings

### Overview page

Show metric cards:

- Total size scanned
- Files scanned
- Directories scanned
- Cleanup candidates
- Unreadable folders

Then show:

- Top 10 folders
- Top 10 cleanup candidates
- Top file type groups

### Drilldown workflow

The core workflow should be:

```text
Select target
→ Scan
→ See largest folders
→ Click large folder
→ See largest children
→ Reveal/copy/exclude/rescan
```

Do not bury this behind charts.

### Visualization decision

Do not start with a treemap.

MVP should prioritize:

- Sortable tree table
- Drilldown breadcrumb
- Compact size bars
- Cleanup candidate list

A treemap can be added later, but the first version should optimize for clarity and actionability.

## 10. Agent Execution Standard

Every coding agent task should follow this contract.

### Required agent plan format

Before coding, the agent should write a short plan containing:

```md
## Goal

## Files likely to change

## Implementation plan

## Tests to add/update

## Acceptance criteria

## Risks / assumptions
```

### Required completion format

After coding, the agent should report:

```md
## Completed

## Tests run

## Files changed

## Known gaps

## Follow-up tasks
```

### Agent guardrails

Agents must:

- Keep scope narrow to the assigned task
- Prefer small cohesive commits
- Add or update tests with behavior changes
- Run lint, typecheck, and relevant tests
- Avoid broad refactors unless required
- Avoid adding dependencies without justification
- Avoid destructive filesystem behavior
- Avoid permanent delete features unless explicitly assigned later
- Update this project document or subtask docs when decisions change

## 11. Initial Agent Task Backlog

### Task 1: Project scaffold

**Goal:** Create the Electron + Vite + TypeScript project baseline.

Deliverables:

- Electron Forge Vite TypeScript app
- pnpm setup
- ESLint
- Prettier
- Vitest
- Basic folder structure
- Strict TypeScript config

Tests:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- App starts locally

Acceptance criteria:

- App opens a blank shell window
- No Node APIs exposed to renderer
- TypeScript strict mode enabled

### Task 2: Electron security baseline

**Goal:** Lock down Electron defaults before feature work expands.

Deliverables:

- Secure `BrowserWindow` config
- Preload script with typed API shape
- Navigation blocking
- Window-open blocking
- IPC validation pattern

Tests:

- Unit tests for IPC validators where possible
- Manual verification that renderer cannot access `require`, `process`, or `fs`

Acceptance criteria:

- Renderer has access only to `window.diskScope`
- No direct Node integration in renderer

### Task 3: Material 3 app shell

**Goal:** Build the basic UI shell using **TypeScript + React**, MUI, and Material Symbols.

See [`docs/tech-stack-and-ux.md`](tech-stack-and-ux.md) for full UI conventions.

Deliverables:

- MUI theme
- React app layout shell (`App.tsx`)
- Top app bar
- Navigation rail
- Material Symbols icon setup
- Empty states for all MVP sections
- UI wrapper components

Tests:

- Component smoke tests where practical
- Typecheck
- Visual/manual start verification

Acceptance criteria:

- App has a modern Material 3 look
- Theme tokens are centralized
- Raw Material components are not scattered throughout feature code

### Task 4: Directory picker flow

**Goal:** Let the user select a scan target safely.

Deliverables:

- Native folder picker in main process
- Preload API method
- Renderer button/control
- Selected path display
- Basic error handling

Tests:

- Unit test preload/main contract if possible
- Manual test selecting folder, cancelling picker, selecting drive/root

Acceptance criteria:

- User can pick a folder
- Cancel does not error
- Selected path is shown before scan

### Task 5: Scanner worker MVP

**Goal:** Implement recursive scanner in a worker thread.

Deliverables:

- Scanner worker
- Directory aggregation
- File counts
- Size totals
- Access denied handling
- Symlink/junction skip behavior
- Cancellation support
- Progress events

Tests:

- Temp directory fixture tests
- Nested folder size tests
- Unreadable/error path handling where practical
- Symlink loop protection test where practical
- Cancellation test

Acceptance criteria:

- Scanner returns correct aggregate sizes for fixtures
- Scanner does not crash on unreadable paths
- Scanner can be cancelled
- Renderer remains responsive during scan

### Task 6: Scan progress UI

**Goal:** Show clear scan progress while scanning.

Deliverables:

- Progress region
- File count
- Directory count
- Bytes discovered
- Current path display
- Error count
- Cancel button

Tests:

- Store tests for progress updates
- Manual long-scan verification

Acceptance criteria:

- Progress updates are visible and not noisy
- Cancel button works
- UI does not freeze

### Task 7: Largest folders view

**Goal:** Make the main cleanup workflow useful.

Deliverables:

- Sortable tree table
- Size formatting
- Percent of root
- File count
- Directory count
- Selected row state
- Breadcrumb/drilldown
- Reveal/copy path actions

Tests:

- Sort tests
- Percent calculation tests
- Tree flattening/expansion tests
- Manual reveal/copy verification

Acceptance criteria:

- User can identify the largest folders quickly
- Drilldown workflow is clear
- Reveal in file explorer works

### Task 8: Largest files and file types

**Goal:** Add two secondary analysis views.

Deliverables:

- Largest files table
- File type summary table
- Extension grouping
- Empty states

Tests:

- Extension grouping tests
- Top N largest files tests
- Sorting tests

Acceptance criteria:

- User can find giant individual files
- User can see which file types consume the most space

### Task 9: Cleanup candidate rules

**Goal:** Add developer-focused cleanup intelligence.

Deliverables:

- Rule engine
- Initial rule list
- Candidate aggregation
- Risk labels
- Estimated reclaimable size
- Cleanup Candidates page

Tests:

- Rule matching tests
- Risk label tests
- Reclaimable total tests
- Fixtures for Node, .NET, Python, Vite, Next.js folders

Acceptance criteria:

- App identifies common dev bloat folders
- App explains why each candidate was flagged
- App does not recommend high-risk deletion casually

### Task 10: Exclusions

**Goal:** Let users avoid noisy or irrelevant folders.

Deliverables:

- Exact path exclusions
- Folder-name pattern exclusions
- Exclusions settings page
- Scan integration
- Persisted preferences

Tests:

- Exclusion matching tests
- Scan fixture with excluded paths
- Preference persistence tests

Acceptance criteria:

- Excluded paths are skipped
- User can add/remove exclusions
- Exclusions are visible before scan

### Task 11: Export report

**Goal:** Let users save scan results.

Deliverables:

- JSON export
- CSV export
- Native save dialog
- Export selected scan result

Tests:

- JSON schema test
- CSV content test
- Manual export verification

Acceptance criteria:

- Export files are valid
- Export contains top folders, top files, file types, cleanup candidates, and errors

### Task 12: Packaging baseline

**Goal:** Build installable artifacts for local testing.

Deliverables:

- Electron Forge makers configured
- App icon placeholder
- App metadata
- Local package output

Tests:

- `pnpm make`
- Install/open packaged app locally

Acceptance criteria:

- App can be packaged and opened outside dev mode

## 12. Testing Strategy

### Unit tests

Use Vitest for:

- `formatBytes`
- Path normalization
- Scanner aggregation
- Exclusion matching
- Cleanup rule matching
- Extension grouping
- Tree flattening
- Sorting
- Risk label logic

### Integration tests

Use temporary filesystem fixtures.

Required fixture cases:

- Empty directory
- Nested directories
- Large files
- Multiple extensions
- `node_modules`
- `.next`
- `.turbo`
- `.nuget/packages`
- `.NET` project with `bin` and `obj`
- Symlink/junction where supported
- Permission/access error where practical

### E2E tests

Use Playwright for high-level Electron flows where practical:

- App launches
- Main shell renders
- User can start scan against a known fixture path
- Progress appears
- Results render
- User can switch views

### Manual test checklist

Before any release build:

- Scan `Downloads`
- Scan a code workspace
- Scan a drive root if safe
- Cancel a long scan
- Try unreadable/system folders
- Reveal folder in file explorer
- Export report
- Toggle light/dark mode

## 13. Definition of Done

A feature is done only when:

- It satisfies its acceptance criteria
- It has tests for core logic
- It handles empty/error states
- It does not freeze the renderer
- It does not expose broad filesystem access to the renderer
- It does not add destructive behavior without explicit scope
- It passes lint, typecheck, and tests
- It updates relevant docs if behavior changed

## 14. MVP Success Criteria

The MVP is successful when a user can:

1. Open the app
2. Select a folder or drive
3. Watch scan progress
4. Cancel if needed
5. See the largest folders sorted by size
6. Drill into large folders
7. See the largest files
8. See file type totals
9. See developer cleanup candidates
10. Reveal a selected folder in file explorer
11. Export a scan report

The app should feel safer and more focused than classic disk analyzers, even if it is not the fastest scanner on the market.

## 15. Post-MVP Ideas

Only consider these after the MVP is stable:

- ~~Move selected items to Trash/Recycle Bin~~ (shipped in Task 016 for file browser)
- Cleanup basket with reclaimable total
- Treemap visualization
- Scan history
- Compare scans over time
- SQLite-backed large scan storage
- Duplicate candidate detection
- Native NTFS MFT scanning for Windows speed
- Docker cleanup insights
- Package-manager-specific cleanup commands
- Repo age detection
- “Safe dev cleanup” one-click command generation
- Scheduled scan reminders
- System tray quick scan

## 16. Recommended Repo Structure

```text
diskscope/
  src/
    main/
      main.ts
      browser-window.ts
      ipc/
        scan-ipc.ts
        file-actions-ipc.ts
        validators.ts
      services/
        directory-picker.ts
        report-exporter.ts
        file-actions.ts
    preload/
      index.ts
      disk-scope-api.ts
    scanner/
      scan-worker.ts
      scan-engine.ts
      scan-types.ts
      cleanup-rules.ts
      exclusions.ts
      path-utils.ts
    renderer/
      app-root.ts
      routes.ts
      theme/
        material-theme.css
      components/
        ds-button.ts
        ds-card.ts
        ds-dialog.ts
        ds-table.ts
        ds-top-app-bar.ts
      features/
        scan-picker/
        scan-progress/
        overview/
        largest-folders/
        largest-files/
        file-types/
        cleanup-candidates/
        exclusions/
        settings/
      stores/
        scan-store.ts
        preferences-store.ts
    shared/
      types.ts
      format-bytes.ts
      result.ts
  tests/
    fixtures/
    scanner/
    cleanup-rules/
    renderer/
  docs/
    project-scope.md
    tasks/
      001-project-scaffold.md
      002-electron-security-baseline.md
      003-material-app-shell.md
```

## 17. First Build Recommendation

Build the first vertical slice before expanding views:

```text
Electron shell
→ Secure preload API
→ Directory picker
→ Scanner worker against selected folder
→ Progress UI
→ Completed result summary
→ Top folders table
```

Do not start with cleanup rules, charts, or packaging polish. The scanner loop and results model are the foundation.
