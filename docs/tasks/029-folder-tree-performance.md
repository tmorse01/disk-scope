# Task 029 — Folder tree expand performance

## Goal

Make expanding/collapsing folders in the Largest Folders tree feel immediate, even when many folders are already expanded or a folder has hundreds of direct children.

## Dependencies (must be complete first)

- Task 007 (largest folders view)
- Task 016 (file browser / lazy files groups)

## Files likely to change

- `src/renderer/features/largest-folders/folder-tree-utils.ts`
- `src/renderer/features/largest-folders/useFolderTreeRows.ts` (new)
- `src/renderer/features/largest-folders/FolderTreeRow.tsx` (new)
- `src/renderer/features/largest-folders/LargestFoldersView.tsx`
- `src/renderer/features/largest-folders/useLazyFolderFiles.ts`
- `tests/renderer/folder-tree-utils.test.ts`
- `tests/renderer/useFolderTreeRows.test.ts` (new)

## Implementation plan

1. **Incremental expand/collapse** — `useFolderTreeRows` patches the flat row list on expand/collapse instead of full `flattenFolderTreeRows` on every toggle; full rebuild on sort/focus/scan change.
2. **Subtree flatten** — `flattenSubtreeRows` + depth-based insert/remove helpers; push-based accumulation (no spread).
3. **Sort cache** — lazy per-parent sorted child-id cache during flatten passes.
4. **Memoized row components** — `FolderTreeRow` variants; pass `selectedPath` not `getRowProps()` per row; `startTransition` on expand.
5. **File cap** — limit `<Files>` group to 500 rows with truncated placeholder row.
6. **Virtualization** — defer unless expand still laggy after 1–5.

## Tests to add/update

- Subtree flatten, insert/remove row helpers
- Sort cache parity with existing flatten tests
- Synthetic large-tree expand smoke test
- Hook integration tests for incremental expand/collapse

## Acceptance criteria

- Expanding a folder in a large already-expanded tree does not freeze the UI
- Expanding a folder with 200+ direct children is perceptibly faster than baseline
- Collapsing removes only the collapsed subtree
- Sort, drill-down, selection, context menu unchanged
- `pnpm lint`, `pnpm typecheck`, `pnpm test` pass

## Risks / assumptions

- Insert/remove depth logic must match full flatten semantics
- `expandedIds` remains source of truth; row list derived/patched from diffs
- Virtualization optional follow-up

## Worktree

```powershell
.cursor/scripts/new-task-worktree.ps1 -TaskNum 029 -ShortName folder-tree-performance
# → .worktrees/task-029 on branch task/029-folder-tree-performance
```

Note: task-028 worktree is reserved for file-extension-icons work.
