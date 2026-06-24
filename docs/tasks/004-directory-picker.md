# Task 004 — Directory picker flow

## Goal

Let the user select a scan target safely via native folder picker with cancel support and selected path display.

## Dependencies (must be complete first)

- Foundation (Tasks 001–002) complete
- Task 003 recommended for UI button placement (can stub minimal button if 003 not merged)

## Files likely to change

- `src/main/services/directory-picker.ts`
- `src/main/ipc/scan-ipc.ts`
- `src/preload/disk-scope-api.ts`
- `src/renderer/features/scan-picker/` (new)
- `src/renderer/stores/scan-store.ts` (selected path state)

## Implementation plan

1. Expand `pickDirectory` to support drive roots where OS allows
2. Ensure cancel returns `null` without error
3. Add renderer “Select folder” control and selected path display
4. Store selected path in scan store (`selecting-target` → idle)
5. Validate IPC contract matches `SelectedPath` type
6. Basic error handling for picker failures

## Tests to add/update

- Unit test for IPC handler return shape if mockable
- Manual: pick folder, cancel picker, verify path display

## Acceptance criteria

- User can pick a folder
- Cancel does not error
- Selected path shown before scan starts
- No filesystem access added to renderer

## Risks / assumptions

- Drive root selection varies by OS — document Windows behavior
- Full scan start is Task 005/006; this task only selects target
