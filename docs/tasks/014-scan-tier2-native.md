# Task 014 — Scanner Tier 2 native Windows enumeration

## Goal

Replace the Node `readdir`/`lstat` hot loop on Windows with a native `FindFirstFileExW` / `FindNextFileW` enumerator, targeting 5–20× speedup over Tier 1, with automatic fallback to the TypeScript walker.

## Dependencies (must be complete first)

- Task 013 (Tier 1 hot-path) merged to `master`

## Reference

- Brainstorm: `.cursor/plans/scan_speed_brainstorm_7d6208bd.plan.md` — native enumeration section
- Tier 1 engine: `src/scanner/scan-engine.ts`
- Tier 1 benchmarks: `tests/scanner/scan-optimization.test.ts`, `tests/scanner/benchmark/`

## Files likely to change

- `native/scanner-win/` (new — Rust + `napi-rs` or C++ N-API module)
- `src/scanner/native-enumerator.ts` (new — JS loader + fallback)
- `src/scanner/scan-engine.ts` (inject enumerator abstraction)
- `forge.config.ts`, `vite.main.config.ts` (native addon build + unpack)
- `package.json` (build scripts, optionalDependencies)
- `tests/scanner/scan-engine.test.ts`, `tests/scanner/native-enumerator.test.ts`
- `tests/scanner/benchmark/` (native vs TS before/after)

## Implementation plan

1. **Enumerator interface**
   ```ts
   type DirectoryEntry = { name: string; path: string; isDirectory: boolean; isSymlink: boolean; sizeBytes: number; mtimeMs?: number };
   type ReadDirFn = (dirPath: string) => Promise<DirectoryEntry[]>;
   ```
   - `scan-engine.ts` accepts `readDirectory` override; default = Tier 1 Node fs path.

2. **Native addon (Windows only)**
   - `FindFirstFileExW` with `FIND_FIRST_EX_LARGE_FETCH`, `FindExInfoBasic`.
   - Return name, attributes, size, last write time per entry.
   - Treat reparse points / symlinks as skip (match current semantics).
   - Build with `@electron/rebuild` or napi-rs prebuilds for Electron 42.

3. **Loader + fallback**
   - Try load native module at scan start on `win32`.
   - On load failure, non-Windows, or non-NTFS volume → use TS enumerator from Tier 1.
   - Log once (main/worker) which path is active; no UI required in this task.

4. **Packaging**
   - Use existing `@electron-forge/plugin-auto-unpack-natives`.
   - Document dev build steps in task completion report.

5. **Benchmark gate**
   - Extend `tests/scanner/benchmark/measure.ts` with `readDirectory` profile parameter.
   - Record before (Tier 1 TS) vs after (native) on each standard fixture.

## Tests per improvement (required)

Each Tier 2 deliverable gets **correctness + before/after benchmark** tests:

| Improvement | Correctness test | Benchmark comparison |
| --- | --- | --- |
| **Enumerator abstraction** | `readDirectory` injectable; default path unchanged | N/A (refactor only) |
| **Native module load** | Loads on win32 when built; graceful `null` when missing | N/A |
| **FindFirstFileEx loop** | Entry fields match TS `readdir+lstat` on fixture dirs | `native vs ts` on shallow-wide + balanced-tree |
| **Reparse/symlink skip** | Same skip behavior as Tier 1 symlink test | Optional micro-fixture |
| **Auto fallback** | Non-win32 / load failure uses TS enumerator | Fallback timing equals Tier 1 baseline |
| **End-to-end scan** | `runScan` aggregates identical TS vs native on fixtures | Total scan `legacy-ts vs native` per fixture |

### Test files to add

- `tests/scanner/native-enumerator.test.ts` — unit tests for loader, fallback, entry mapping
- `tests/scanner/native-enumerator.integration.test.ts` — `@win32` only; skip in CI Linux
- `tests/scanner/scan-native-benchmark.test.ts` — before/after using `measureScan` with `readDirectory: ts | native`
- Extend `scripts/scan-benchmark.ts` with `--profile=native-compare`

### Benchmark reporting format

Each benchmark test must `console.log`:

```text
[bench] <fixture> ts-enumerator: <ms> | <files/sec>
[bench] <fixture> native-enumerator: <ms> | <files/sec>
[bench] <fixture> native speedup: <ratio>×
```

Record results in the deck mate completion report.

## Tests to add/update

- Unit tests for JS fallback path (all platforms in CI).
- Native integration tests marked `@win32` or skipped in CI Linux if no cross-compile.
- Property test: native enumerator produces same aggregates as TS walker on shared fixtures (Windows dev machine).
- `pnpm lint`, `pnpm typecheck`, `pnpm test`

## Acceptance criteria

- Windows scan uses native enumerator when addon loads successfully.
- Non-Windows and fallback paths unchanged in behavior.
- Existing `scan-engine` fixture tests pass via fallback on all CI platforms.
- Native vs TS benchmark tests exist with logged before/after ratios.
- Native path documented; dev can build locally on Windows.
- No admin privileges required.

## Risks / assumptions

- Native addons complicate Forge build matrix (x64; arm64 if supported).
- Electron ABI version must match bundled Node.
- Cloud placeholder files and junctions need manual verification on Windows.
- CI may not run native tests — document manual Windows verification checklist.
