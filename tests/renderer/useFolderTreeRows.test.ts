import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { DirectoryNode, NodeId } from '../../src/shared/types';
import { filesGroupId } from '../../src/renderer/features/largest-folders/folder-tree-utils';
import { useFolderTreeRows } from '../../src/renderer/features/largest-folders/useFolderTreeRows';

function makeNode(
  id: NodeId,
  overrides: Partial<DirectoryNode> & Pick<DirectoryNode, 'name' | 'path'>,
): DirectoryNode {
  return {
    id,
    parentId: null,
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    childDirectoryIds: [],
    unreadable: false,
    ...overrides,
  };
}

const ROOT_ID = 'root';
const DOCS_ID = 'docs';
const SRC_ID = 'src';
const LIB_ID = 'lib';

const directoriesById: Record<NodeId, DirectoryNode> = {
  [ROOT_ID]: makeNode(ROOT_ID, {
    name: 'project',
    path: 'C:\\project',
    parentId: null,
    sizeBytes: 10_000,
    fileCount: 100,
    directoryCount: 2,
    childDirectoryIds: [DOCS_ID, SRC_ID],
  }),
  [DOCS_ID]: makeNode(DOCS_ID, {
    name: 'docs',
    path: 'C:\\project\\docs',
    parentId: ROOT_ID,
    sizeBytes: 2_000,
    fileCount: 10,
    directoryCount: 0,
  }),
  [SRC_ID]: makeNode(SRC_ID, {
    name: 'src',
    path: 'C:\\project\\src',
    parentId: ROOT_ID,
    sizeBytes: 8_000,
    fileCount: 90,
    directoryCount: 1,
    childDirectoryIds: [LIB_ID],
  }),
  [LIB_ID]: makeNode(LIB_ID, {
    name: 'lib',
    path: 'C:\\project\\src\\lib',
    parentId: SRC_ID,
    sizeBytes: 3_000,
    fileCount: 40,
    directoryCount: 0,
  }),
};

const emptyFileCache = new Map<NodeId, never>();
const emptyLoadingParentIds = new Set<NodeId>();

describe('useFolderTreeRows', () => {
  it('builds initial rows for the focused directory', () => {
    const { result } = renderHook(() =>
      useFolderTreeRows({
        focusId: ROOT_ID,
        directoriesById,
        expandedIds: new Set(),
        sortColumn: 'sizeBytes',
        sortDirection: 'desc',
        totalSizeBytes: 10_000,
        fileCache: emptyFileCache,
        loadingParentIds: emptyLoadingParentIds,
      }),
    );

    expect(result.current.rows.map((row) => row.nodeId)).toEqual([
      SRC_ID,
      DOCS_ID,
      filesGroupId(ROOT_ID),
    ]);
  });

  it('patches rows incrementally when a directory expands and collapses', () => {
    const { result, rerender } = renderHook(
      ({ expandedIds }: { expandedIds: Set<NodeId> }) =>
        useFolderTreeRows({
          focusId: ROOT_ID,
          directoriesById,
          expandedIds,
          sortColumn: 'sizeBytes',
          sortDirection: 'desc',
          totalSizeBytes: 10_000,
          fileCache: emptyFileCache,
          loadingParentIds: emptyLoadingParentIds,
        }),
      { initialProps: { expandedIds: new Set<NodeId>() } },
    );

    const collapsedIds = result.current.rows.map((row) => row.nodeId);

    act(() => {
      result.current.patchExpandedIdsChange(new Set(), new Set([SRC_ID]));
    });
    rerender({ expandedIds: new Set([SRC_ID]) });
    const expandedIds = result.current.rows.map((row) => row.nodeId);

    expect(expandedIds).toContain(LIB_ID);
    expect(expandedIds.length).toBeGreaterThan(collapsedIds.length);

    act(() => {
      result.current.patchExpandedIdsChange(new Set([SRC_ID]), new Set());
    });
    rerender({ expandedIds: new Set() });
    expect(result.current.rows.map((row) => row.nodeId)).toEqual(collapsedIds);
  });

  it('rebuilds all rows when sort column changes', () => {
    const { result, rerender } = renderHook(
      ({ sortColumn }: { sortColumn: 'sizeBytes' | 'name' }) =>
        useFolderTreeRows({
          focusId: ROOT_ID,
          directoriesById,
          expandedIds: new Set(),
          sortColumn,
          sortDirection: sortColumn === 'name' ? 'asc' : 'desc',
          totalSizeBytes: 10_000,
          fileCache: emptyFileCache,
          loadingParentIds: emptyLoadingParentIds,
        }),
      { initialProps: { sortColumn: 'sizeBytes' as const } },
    );

    expect(result.current.rows[0]?.nodeId).toBe(SRC_ID);

    rerender({ sortColumn: 'name' });
    expect(result.current.rows[0]?.nodeId).toBe(DOCS_ID);
  });

  it('exposes rebuildRows for manual refresh', () => {
    const { result } = renderHook(() =>
      useFolderTreeRows({
        focusId: ROOT_ID,
        directoriesById,
        expandedIds: new Set(),
        sortColumn: 'sizeBytes',
        sortDirection: 'desc',
        totalSizeBytes: 10_000,
        fileCache: emptyFileCache,
        loadingParentIds: emptyLoadingParentIds,
      }),
    );

    act(() => {
      result.current.rebuildRows();
    });

    expect(result.current.rows.length).toBeGreaterThan(0);
  });
});
