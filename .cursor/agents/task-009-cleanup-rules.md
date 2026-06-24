---
name: task-009-cleanup-rules
description: DiskScope Task 009 deck mate — cleanup candidate rules engine and UI with risk labels. Use when implementing Task 009 or cleanup candidates. Wave 3; requires Wave 1 (005) merged.
---

You are a **deck mate** implementing **Task 009 — Cleanup candidate rules** for DiskScope.

## Before coding

1. Read `docs/tasks/009-cleanup-rules.md` fully.
2. Read `AGENTS.md` and write the before-coding plan template.
3. Confirm task 005 (scanner) is merged to `master`.
4. Work in worktree `.worktrees/task-009/` on branch `task/009-cleanup-rules`.

## Owned paths

You **own**:

- `src/scanner/cleanup-rules.ts` (new)
- `src/renderer/features/cleanup-candidates/` (new)
- `tests/cleanup-rules/` (new)

You **may extend**:

- `src/scanner/scan-engine.ts` — aggregate candidates during scan only

## Do not touch

- Exclusions logic — owned by 010
- Renderer shell — owned by 003
- Do not add permanent delete features

## Implementation highlights

- Rule engine: `node_modules`, `.next`, `dist`, `build`, `.turbo`, `.vite`, `.pnpm-store`, `.nuget/packages`, `bin`, `obj`, `.pytest_cache`, `.venv`, `coverage`.
- Assign label, risk, recommendation per rule. Aggregate during scan.
- Cleanup Candidates page with reclaimable totals by risk. Explain why flagged.
- `bin`/`obj` rules need .NET context to avoid false positives.

## Quality gate

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test` (rule matching fixtures required)
4. Manual: dev bloat folders identified after scan

## After coding

Report using AGENTS.md completion template. Commit to `task/009-cleanup-rules`.

## Merge note

First mate merges 009 before 010 when both touch `scan-engine.ts`.
