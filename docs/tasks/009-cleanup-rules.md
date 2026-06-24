# Task 009 — Cleanup candidate rules

## Goal

Add developer-focused cleanup intelligence with rule matching, risk labels, and reclaimable totals.

## Dependencies (must be complete first)

- Task 005 (scanner can flag paths during traversal)

## Files likely to change

- `src/scanner/cleanup-rules.ts` (new)
- `src/scanner/scan-engine.ts`
- `src/renderer/features/cleanup-candidates/` (new)
- `tests/cleanup-rules/` (new)

## Implementation plan

1. Rule engine matching scope table: `node_modules`, `.next`, `dist`, `build`, `.turbo`, `.vite`, `.pnpm-store`, `.nuget/packages`, `bin`, `obj`, `.pytest_cache`, `.venv`, `coverage`
2. Assign label, risk, recommendation per rule
3. Aggregate candidates during scan
4. Cleanup Candidates page with estimated reclaimable by risk level
5. Explain why each candidate was flagged

## Tests to add/update

- Rule matching tests per pattern
- Risk label tests
- Reclaimable total tests
- Fixtures: Node, .NET, Python, Vite, Next.js folder names

## Acceptance criteria

- App identifies common dev bloat folders
- Each candidate shows explanation and risk
- No casual high-risk delete recommendations

## Risks / assumptions

- Parallelizable with Tasks 007 and 008 once scanner emits candidates
- `bin`/`obj` rules need .NET project context to avoid false positives
