# Agent guide

Coding agents working on DiskScope must follow this contract.

## Tech stack (renderer)

**Read [`docs/tech-stack-and-ux.md`](docs/tech-stack-and-ux.md) before any UI work.**

Summary:

- **TypeScript + React** (`.tsx`) for all renderer UI — not Lit, not vanilla TypeScript DOM.
- **Material Design 3** via **MUI (`@mui/material`)** with a centralized theme.
- **Material Symbols** icons from [Google Fonts](https://fonts.google.com/icons) — Outlined style by default; use the shared `MaterialIcon` pattern or `@mui/icons-material`.
- Wave 1 shipped a Lit shell; **migrate touched surfaces to React** rather than extending Lit.

Main process, scanner, preload, and shared types remain plain TypeScript (no React).

## Before coding

Write a short plan:

```md
## Goal

## Files likely to change

## Implementation plan

## Tests to add/update

## Acceptance criteria

## Risks / assumptions
```

## After coding

Report completion:

```md
## Completed

## Tests run

## Files changed

## Known gaps

## Follow-up tasks
```

## Quality gate

Before marking a task done:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (add tests for behavior changes)
4. Manual verification when UI or Electron behavior changes

## Guardrails

- Keep scope narrow to the assigned task file in `docs/tasks/`
- Do not add permanent delete or destructive filesystem features unless explicitly assigned
- Do not expose broad filesystem APIs to the renderer
- **Renderer UI must be React + MUI** — follow `docs/tech-stack-and-ux.md`; do not add Lit or `@material/web` for new code
- Use **Material Symbols** for icons — see [fonts.google.com/icons](https://fonts.google.com/icons)
- Do not duplicate types — use `src/shared/types.ts`
- Avoid new dependencies without justification
- Prefer small cohesive changes over broad refactors
- Update task docs or scope doc when decisions change

## File ownership map

| Area | Tasks | Paths |
| --- | --- | --- |
| Main / IPC | 002, 004, 011 | `src/main/` |
| Preload API | 002, 004–011 | `src/preload/` |
| Scanner | 005, 009, 010 | `src/scanner/` |
| UI shell | 003 | `src/renderer/theme/`, `src/renderer/components/`, `App.tsx`, layout |
| Scan picker | 004 | `src/renderer/features/scan-picker/` |
| Scan progress | 006 | `src/renderer/features/scan-progress/`, `scan-store` |
| Largest folders | 007 | `src/renderer/features/largest-folders/` |
| Largest files / types | 008 | `src/renderer/features/largest-files/`, `file-types/` |
| Cleanup rules | 009 | `src/scanner/cleanup-rules.ts`, `cleanup-candidates/` |
| Exclusions | 010 | `src/scanner/exclusions.ts`, `exclusions/`, preferences |
| Export | 011 | `src/main/services/report-exporter.ts` |
| Packaging | 012 | `forge.config.ts`, assets |
| Shared types | all | `src/shared/` — coordinate before changing |

## Parallel work

**Batch 1** (after foundation): Tasks 003, 004, 005 can run in parallel.

**Batch 2** (after scan IPC loop): Task 006, then 007 / 008 / 009 largely in parallel.

Integration priority (vertical slice):

```text
shell → preload API → picker → scanner → progress → summary → top folders
```
