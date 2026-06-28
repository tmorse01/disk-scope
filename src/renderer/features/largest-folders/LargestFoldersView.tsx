import Alert from '@mui/material/Alert';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import type { CleanupCandidate, DirectoryNode, NodeId } from '../../../shared/types';
import { DsCard } from '../../components/DsCard';
import {
  DsDataTable,
  DsTableHeadRow,
} from '../../components/DsDataTable';
import {
  DsResizableColumnsProvider,
  DsResizableHeaderCell,
  type ResizableColumnDef,
} from '../../components/DsResizableColumns';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { buildCleanupCandidatePathIndex } from './folder-cleanup-hint';
import { useShellOverrides } from '../../components/ShellContext';
import { useScanStore } from '../../hooks/useScanStore';
import type { DeleteTarget } from '../file-actions/delete-target';
import { useSelectableFileActions } from '../file-actions/useSelectableFileActions';
import { FolderTreeRow } from './FolderTreeRow';
import {
  buildBreadcrumbPath,
  DEFAULT_FOLDER_SORT_COLUMN,
  DEFAULT_FOLDER_SORT_DIRECTION,
  isFilesGroupId,
  parentIdFromFilesGroupId,
  type FlatFileRow,
  type FolderSortColumn,
  type SortDirection,
} from './folder-tree-utils';
import { useFolderTreeRows } from './useFolderTreeRows';
import { useLazyFolderFiles } from './useLazyFolderFiles';

type ColumnDef = {
  id: FolderSortColumn | 'contents' | 'risk';
  label: string;
  sortable: boolean;
  align?: 'left' | 'right';
};

const COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Folder', sortable: true },
  { id: 'sizeBytes', label: 'Size', sortable: true, align: 'right' },
  { id: 'percentOfRoot', label: '% of root', sortable: true, align: 'right' },
  { id: 'contents', label: 'Folders / files', sortable: false, align: 'right' },
  { id: 'risk', label: 'Risk', sortable: false, align: 'right' },
];

const FOLDER_TREE_COLUMNS: ResizableColumnDef[] = [
  { id: 'name', defaultWidth: 300, minWidth: 160 },
  { id: 'sizeBytes', defaultWidth: 108, minWidth: 72 },
  { id: 'percentOfRoot', defaultWidth: 96, minWidth: 72 },
  { id: 'contents', defaultWidth: 112, minWidth: 88 },
  { id: 'risk', defaultWidth: 120, minWidth: 88 },
];

const EMPTY_DIRECTORIES: Record<NodeId, DirectoryNode> = {};
const EMPTY_FILE_CACHE = new Map<NodeId, never>();
const EMPTY_LOADING_PARENT_IDS = new Set<NodeId>();

function directoryToDeleteTarget(
  node: DirectoryNode,
  cleanupCandidate?: CleanupCandidate,
) {
  return {
    path: node.path,
    name: node.name,
    kind: 'directory' as const,
    sizeBytes: node.sizeBytes,
    childFileCount: node.fileCount,
    childDirectoryCount: node.directoryCount,
    risk: cleanupCandidate?.risk,
  };
}

function fileEntryToDeleteTarget(entry: FlatFileRow): DeleteTarget {
  return {
    path: entry.entry.path,
    name: entry.entry.name,
    kind: 'file',
    sizeBytes: entry.entry.sizeBytes,
  };
}

export function LargestFoldersView() {
  const { status, result } = useScanStore();
  const [focusNodeId, setFocusNodeId] = useState<NodeId | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<NodeId>>(() => new Set());
  const [sortColumn, setSortColumn] = useState<FolderSortColumn>(DEFAULT_FOLDER_SORT_COLUMN);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_FOLDER_SORT_DIRECTION);
  const { fileCache, loadingParentIds, loadFilesForDirectory, refreshFilesForDirectory } =
    useLazyFolderFiles();

  const {
    selectedTarget,
    clearSelection,
    selectTarget,
    openContextMenu,
    toolbar,
    contextMenu,
    deleteConfirmationUi,
    dissolvingPaths,
  } = useSelectableFileActions({
    onDeleteSuccess: (target) => {
      for (const [parentId, entries] of fileCache) {
        if (entries.some((entry) => entry.path === target.path)) {
          const parent = result?.directoriesById[parentId];
          if (parent) {
            void refreshFilesForDirectory(parentId, parent.path);
          }
          return;
        }
      }
    },
  });

  const effectiveFocusId = focusNodeId ?? result?.rootNodeId ?? null;
  const selectedPath = selectedTarget?.path ?? null;

  const cleanupCandidatesByPath = useMemo(
    () => buildCleanupCandidatePathIndex(result?.cleanupCandidates ?? []),
    [result?.cleanupCandidates],
  );

  const riskReferenceDate = useMemo(
    () => (result?.completedAt ? new Date(result.completedAt) : undefined),
    [result?.completedAt],
  );

  const { rows, patchExpandedIdsChange } = useFolderTreeRows({
    focusId: effectiveFocusId,
    directoriesById: result?.directoriesById ?? EMPTY_DIRECTORIES,
    expandedIds,
    sortColumn,
    sortDirection,
    totalSizeBytes: result?.totalSizeBytes ?? 0,
    fileCache: result ? fileCache : EMPTY_FILE_CACHE,
    loadingParentIds: result ? loadingParentIds : EMPTY_LOADING_PARENT_IDS,
  });

  const breadcrumb = useMemo(() => {
    if (!result || !effectiveFocusId) {
      return [];
    }

    return buildBreadcrumbPath(effectiveFocusId, result.directoriesById, result.rootNodeId);
  }, [effectiveFocusId, result]);

  const handleSort = useCallback(
    (column: FolderSortColumn) => {
      if (column === sortColumn) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return;
      }

      setSortColumn(column);
      setSortDirection(column === 'name' ? 'asc' : 'desc');
    },
    [sortColumn],
  );

  const handleFocusChange = useCallback(
    (nodeId: NodeId) => {
      setFocusNodeId(nodeId);
      clearSelection();
      setExpandedIds(new Set());
    },
    [clearSelection],
  );

  const handleToggleExpand = useCallback(
    (nodeId: NodeId, parentPath?: string) => {
      const expanding = !expandedIds.has(nodeId);
      const next = new Set(expandedIds);

      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }

      patchExpandedIdsChange(expandedIds, next);
      setExpandedIds(next);

      if (isFilesGroupId(nodeId) && expanding) {
        const parentId = parentIdFromFilesGroupId(nodeId);
        const dirPath = parentPath ?? (result?.directoriesById[parentId]?.path ?? null);
        if (dirPath) {
          void loadFilesForDirectory(parentId, dirPath);
        }
      }
    },
    [expandedIds, loadFilesForDirectory, patchExpandedIdsChange, result?.directoriesById],
  );

  const handleDrillDown = useCallback(
    (nodeId: NodeId) => {
      if (isFilesGroupId(nodeId)) {
        return;
      }

      handleFocusChange(nodeId);
    },
    [handleFocusChange],
  );

  const shellSegments = useMemo(
    () =>
      breadcrumb.map((node, index) => ({
        id: node.id,
        label: node.name,
        onClick: index < breadcrumb.length - 1 ? () => handleFocusChange(node.id) : undefined,
      })),
    [breadcrumb, handleFocusChange],
  );

  useShellOverrides(result ? shellSegments : [], null);

  if (status === 'scanning') {
    return (
      <DsViewLayout
        header={
          <DsPageHeader
            title="Largest Folders"
            subtitle="Folder rankings from the latest scan."
          />
        }
      >
        <Alert severity="info" variant="outlined">
          Scan in progress — folder rankings will update when the scan completes.
        </Alert>
      </DsViewLayout>
    );
  }

  if (!result) {
    return (
      <DsViewLayout
        header={
          <DsPageHeader
            title="Largest Folders"
            subtitle="Folder rankings from the latest scan."
          />
        }
      >
        <Alert severity="info" variant="outlined">
          Run a scan from Overview to see folder rankings here.
        </Alert>
      </DsViewLayout>
    );
  }

  const focusedNode = effectiveFocusId ? result.directoriesById[effectiveFocusId] : undefined;
  const hasVisibleRows =
    rows.length > 0 || (focusedNode?.fileCount ?? 0) > 0 || (focusedNode?.directoryCount ?? 0) > 0;

  return (
    <DsViewLayout
      mode={hasVisibleRows ? 'data' : 'page'}
      header={
        <DsPageHeader
          title="Largest Folders"
          subtitle={`Analyzing ${result.fileCount.toLocaleString()} files under ${result.rootPath}`}
        />
      }
    >
      {!hasVisibleRows ? (
        <Typography variant="body2" color="text.secondary">
          No subfolders in this directory.
        </Typography>
      ) : (
        <DsCard
          noPadding
          sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {toolbar}
          <DsResizableColumnsProvider columns={FOLDER_TREE_COLUMNS}>
            <DsDataTable
              scroll
              noOuterCard
              aria-label="Largest folders"
              header={
                <DsTableHeadRow>
                  {COLUMNS.map((column) => (
                    <DsResizableHeaderCell key={column.id} columnId={column.id} align={column.align ?? 'left'}>
                      {column.sortable ? (
                        <TableSortLabel
                          active={sortColumn === column.id}
                          direction={sortColumn === column.id ? sortDirection : 'asc'}
                          onClick={() => handleSort(column.id as FolderSortColumn)}
                        >
                          {column.label}
                        </TableSortLabel>
                      ) : (
                        column.label
                      )}
                    </DsResizableHeaderCell>
                  ))}
                </DsTableHeadRow>
              }
            >
              <TableBody>
                {rows.map((row) => (
                  <FolderTreeRow
                    key={row.nodeId}
                    row={row}
                    selectedPath={selectedPath}
                    dissolvingPaths={dissolvingPaths}
                    totalSizeBytes={result.totalSizeBytes}
                    riskReferenceDate={riskReferenceDate}
                    cleanupCandidatesByPath={cleanupCandidatesByPath}
                    onToggleExpand={handleToggleExpand}
                    onDrillDown={handleDrillDown}
                    onSelectTarget={selectTarget}
                    onRowContextMenu={openContextMenu}
                    directoryToDeleteTarget={directoryToDeleteTarget}
                    fileEntryToDeleteTarget={fileEntryToDeleteTarget}
                  />
                ))}
              </TableBody>
            </DsDataTable>
          </DsResizableColumnsProvider>
          {contextMenu}
          {deleteConfirmationUi}
        </DsCard>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
        Select a folder or file to use the toolbar above. Right-click a row for the same actions. Double-click a
        folder to drill in, or expand &lt;Files&gt; to browse individual files.
      </Typography>
    </DsViewLayout>
  );
}
