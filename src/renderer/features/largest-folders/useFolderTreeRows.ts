import { useCallback, useEffect, useRef, useState } from 'react';
import type { DirectoryListingEntry, DirectoryNode, NodeId } from '../../../shared/types';
import {
  flattenFolderTreeRows,
  flattenSubtreeRows,
  insertSubtreeAfterRow,
  patchFileListingInRows,
  removeSubtreeRows,
  type FlatTreeRow,
  type FolderSortColumn,
  type SortDirection,
} from './folder-tree-utils';

export type UseFolderTreeRowsParams = {
  focusId: NodeId | null;
  directoriesById: Record<NodeId, DirectoryNode>;
  expandedIds: Set<NodeId>;
  sortColumn: FolderSortColumn;
  sortDirection: SortDirection;
  totalSizeBytes: number;
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]>;
  loadingParentIds: ReadonlySet<NodeId>;
};

function diffExpandedIds(
  prev: ReadonlySet<NodeId>,
  next: ReadonlySet<NodeId>,
): { added: NodeId[]; removed: NodeId[] } {
  const added: NodeId[] = [];
  const removed: NodeId[] = [];

  for (const id of next) {
    if (!prev.has(id)) {
      added.push(id);
    }
  }

  for (const id of prev) {
    if (!next.has(id)) {
      removed.push(id);
    }
  }

  return { added, removed };
}

export function useFolderTreeRows({
  focusId,
  directoriesById,
  expandedIds,
  sortColumn,
  sortDirection,
  totalSizeBytes,
  fileCache,
  loadingParentIds,
}: UseFolderTreeRowsParams) {
  const expandedIdsRef = useRef(expandedIds);
  expandedIdsRef.current = expandedIds;

  const buildFullRows = useCallback(
    (ids: ReadonlySet<NodeId> = expandedIdsRef.current): FlatTreeRow[] => {
      if (!focusId) {
        return [];
      }

      return flattenFolderTreeRows(
        focusId,
        directoriesById,
        ids,
        sortColumn,
        sortDirection,
        totalSizeBytes,
        fileCache,
        loadingParentIds,
        0,
        new Set(),
        true,
      );
    },
    [
      focusId,
      directoriesById,
      sortColumn,
      sortDirection,
      totalSizeBytes,
      fileCache,
      loadingParentIds,
    ],
  );

  const [rows, setRows] = useState<FlatTreeRow[]>(() => buildFullRows(expandedIds));

  const rebuildSnapshotRef = useRef({
    focusId,
    sortColumn,
    sortDirection,
    totalSizeBytes,
    directoriesById,
    fileCache,
    loadingParentIds,
  });

  const applyExpandedIdsChange = useCallback(
    (prev: ReadonlySet<NodeId>, next: ReadonlySet<NodeId>, currentRows: FlatTreeRow[]) => {
      if (!focusId) {
        return currentRows;
      }

      let patched = currentRows;
      const { added, removed } = diffExpandedIds(prev, next);

      for (const nodeId of removed) {
        patched = removeSubtreeRows(patched, nodeId);
      }

      for (const nodeId of added) {
        const anchorRow = patched.find(
          (row) =>
            (row.kind === 'directory' || row.kind === 'files-group') && row.nodeId === nodeId,
        );
        const anchorDepth = anchorRow?.depth ?? 0;
        const subtreeRows = flattenSubtreeRows(
          nodeId,
          anchorDepth,
          directoriesById,
          next,
          sortColumn,
          sortDirection,
          totalSizeBytes,
          fileCache,
          loadingParentIds,
        );
        patched = insertSubtreeAfterRow(patched, nodeId, subtreeRows);
      }

      return patched;
    },
    [
      focusId,
      directoriesById,
      sortColumn,
      sortDirection,
      totalSizeBytes,
      fileCache,
      loadingParentIds,
    ],
  );

  const patchExpandedIdsChange = useCallback(
    (prev: ReadonlySet<NodeId>, next: ReadonlySet<NodeId>) => {
      setRows((currentRows) => applyExpandedIdsChange(prev, next, currentRows));
    },
    [applyExpandedIdsChange],
  );

  const rebuildRows = useCallback(() => {
    setRows(buildFullRows(expandedIdsRef.current));
  }, [buildFullRows]);

  useEffect(() => {
    const snapshot = rebuildSnapshotRef.current;
    const structuralRebuildNeeded =
      snapshot.focusId !== focusId ||
      snapshot.sortColumn !== sortColumn ||
      snapshot.sortDirection !== sortDirection ||
      snapshot.totalSizeBytes !== totalSizeBytes ||
      snapshot.directoriesById !== directoriesById;

    const fileListingPatchNeeded =
      snapshot.fileCache !== fileCache || snapshot.loadingParentIds !== loadingParentIds;

    if (structuralRebuildNeeded) {
      rebuildSnapshotRef.current = {
        focusId,
        sortColumn,
        sortDirection,
        totalSizeBytes,
        directoriesById,
        fileCache,
        loadingParentIds,
      };
      setRows(buildFullRows(expandedIds));
      return;
    }

    if (!fileListingPatchNeeded) {
      return;
    }

    rebuildSnapshotRef.current = {
      ...snapshot,
      fileCache,
      loadingParentIds,
    };
    setRows((currentRows) =>
      patchFileListingInRows(
        currentRows,
        directoriesById,
        expandedIds,
        sortColumn,
        sortDirection,
        totalSizeBytes,
        fileCache,
        loadingParentIds,
      ),
    );
  }, [
    focusId,
    directoriesById,
    expandedIds,
    sortColumn,
    sortDirection,
    totalSizeBytes,
    fileCache,
    loadingParentIds,
    buildFullRows,
  ]);

  return { rows, rebuildRows, patchExpandedIdsChange, applyExpandedIdsChange };
}
