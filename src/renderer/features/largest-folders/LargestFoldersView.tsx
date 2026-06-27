import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import type { NodeId } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import {
  DsDataTable,
  DsTableBodyRow,
  DsTableHeadRow,
  TableCell as DsTableCell,
} from '../../components/DsDataTable';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useShellOverrides } from '../../components/ShellContext';
import { useScanStore } from '../../hooks/useScanStore';
import { FileRowActions } from '../file-actions/FileRowActions';
import type { DeleteTarget } from '../file-actions/delete-target';
import { fileIconForExtension } from '../largest-files/file-icon-utils';
import {
  buildBreadcrumbPath,
  DEFAULT_FOLDER_SORT_COLUMN,
  DEFAULT_FOLDER_SORT_DIRECTION,
  flattenFolderTreeRows,
  formatModifiedAt,
  formatPercentOfRoot,
  isFilesGroupId,
  parentIdFromFilesGroupId,
  percentOfRoot,
  type FlatTreeRow,
  type FolderSortColumn,
  type SortDirection,
} from './folder-tree-utils';
import { useLazyFolderFiles } from './useLazyFolderFiles';

type ColumnDef = {
  id: FolderSortColumn | 'risk' | 'actions';
  label: string;
  sortable: boolean;
  align?: 'left' | 'right';
};

const COLUMNS: ColumnDef[] = [
  { id: 'name', label: 'Folder', sortable: true },
  { id: 'sizeBytes', label: 'Size', sortable: true, align: 'right' },
  { id: 'percentOfRoot', label: '% of root', sortable: true, align: 'right' },
  { id: 'fileCount', label: 'Files', sortable: true, align: 'right' },
  { id: 'directoryCount', label: 'Folders', sortable: true, align: 'right' },
  { id: 'modifiedAt', label: 'Modified', sortable: true, align: 'right' },
  { id: 'risk', label: 'Risk', sortable: false, align: 'right' },
  { id: 'actions', label: 'Actions', sortable: false, align: 'right' },
];

function fileEntryToDeleteTarget(entry: FlatTreeRow & { kind: 'file' }): DeleteTarget {
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
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<NodeId>>(() => new Set());
  const [sortColumn, setSortColumn] = useState<FolderSortColumn>(DEFAULT_FOLDER_SORT_COLUMN);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_FOLDER_SORT_DIRECTION);
  const { fileCache, loadingParentIds, loadFilesForDirectory, refreshFilesForDirectory } =
    useLazyFolderFiles();

  const effectiveFocusId = focusNodeId ?? result?.rootNodeId ?? null;

  const breadcrumb = useMemo(() => {
    if (!result || !effectiveFocusId) {
      return [];
    }

    return buildBreadcrumbPath(effectiveFocusId, result.directoriesById, result.rootNodeId);
  }, [effectiveFocusId, result]);

  const rows = useMemo(() => {
    if (!result || !effectiveFocusId) {
      return [];
    }

    return flattenFolderTreeRows(
      effectiveFocusId,
      result.directoriesById,
      expandedIds,
      sortColumn,
      sortDirection,
      result.totalSizeBytes,
      fileCache,
      loadingParentIds,
      0,
      new Set(),
      true,
    );
  }, [effectiveFocusId, expandedIds, fileCache, loadingParentIds, result, sortColumn, sortDirection]);

  const selectedNode =
    selectedNodeId && result && !isFilesGroupId(selectedNodeId)
      ? result.directoriesById[selectedNodeId]
      : undefined;

  const handleSort = useCallback(
    (column: FolderSortColumn) => {
      if (column === sortColumn) {
        setSortDirection((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        return;
      }

      setSortColumn(column);
      setSortDirection(column === 'name' || column === 'modifiedAt' ? 'asc' : 'desc');
    },
    [sortColumn],
  );

  const handleFocusChange = useCallback((nodeId: NodeId) => {
    setFocusNodeId(nodeId);
    setSelectedNodeId(null);
    setExpandedIds(new Set());
  }, []);

  const handleToggleExpand = useCallback(
    (nodeId: NodeId, parentPath?: string) => {
      const expanding = !expandedIds.has(nodeId);

      setExpandedIds((current) => {
        const next = new Set(current);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });

      if (isFilesGroupId(nodeId) && expanding) {
        const parentId = parentIdFromFilesGroupId(nodeId);
        const dirPath =
          parentPath ?? (result?.directoriesById[parentId]?.path ?? null);
        if (dirPath) {
          void loadFilesForDirectory(parentId, dirPath);
        }
      }
    },
    [expandedIds, loadFilesForDirectory, result?.directoriesById],
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

  const handleFileDeleteSuccess = useCallback(
    (row: FlatTreeRow & { kind: 'file' }) => {
      const parent = result?.directoriesById[row.parentId];
      if (parent) {
        void refreshFilesForDirectory(row.parentId, parent.path);
      }
    },
    [refreshFilesForDirectory, result?.directoriesById],
  );

  const handleReveal = useCallback(() => {
    if (!selectedNode || typeof window.diskScope === 'undefined') {
      return;
    }

    void window.diskScope.revealPath(selectedNode.path);
  }, [selectedNode]);

  const handleCopyPath = useCallback(() => {
    if (!selectedNode || typeof window.diskScope === 'undefined') {
      return;
    }

    void window.diskScope.copyPath(selectedNode.path);
  }, [selectedNode]);

  const shellSegments = useMemo(
    () =>
      breadcrumb.map((node, index) => ({
        id: node.id,
        label: node.name,
        onClick: index < breadcrumb.length - 1 ? () => handleFocusChange(node.id) : undefined,
      })),
    [breadcrumb, handleFocusChange],
  );

  const shellActions = useMemo(
    () => (
      <>
        <Button
          size="small"
          variant="outlined"
          disabled={!selectedNode}
          onClick={handleReveal}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Reveal in Explorer
        </Button>
        <Button
          size="small"
          variant="contained"
          disabled={!selectedNode}
          onClick={handleCopyPath}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Copy path
        </Button>
      </>
    ),
    [handleCopyPath, handleReveal, selectedNode],
  );

  useShellOverrides(result ? shellSegments : [], result ? shellActions : null);

  if (status === 'scanning') {
    return (
      <Alert severity="info" variant="outlined">
        Scan in progress — folder rankings will update when the scan completes.
      </Alert>
    );
  }

  if (!result) {
    return (
      <Alert severity="info" variant="outlined">
        Run a scan from Overview to see folder rankings here.
      </Alert>
    );
  }

  const focusedNode = effectiveFocusId ? result.directoriesById[effectiveFocusId] : undefined;
  const hasVisibleRows =
    rows.length > 0 || (focusedNode?.fileCount ?? 0) > 0 || (focusedNode?.directoryCount ?? 0) > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Largest Folders"
        subtitle={`Analyzing ${result.fileCount.toLocaleString()} files under ${result.rootPath}`}
      />

      {!hasVisibleRows ? (
        <Typography variant="body2" color="text.secondary">
          No subfolders in this directory.
        </Typography>
      ) : (
        <DsDataTable
          aria-label="Largest folders"
          header={
            <DsTableHeadRow>
              {COLUMNS.map((column) => (
                <DsTableCell key={column.id} align={column.align ?? 'left'}>
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
                </DsTableCell>
              ))}
            </DsTableHeadRow>
          }
        >
          <TableBody>
            {rows.map((row) => {
              if (row.kind === 'directory') {
                const { nodeId, node, depth, hasChildren, isExpanded } = row;
                const isSelected = selectedNodeId === nodeId;
                const percent = percentOfRoot(node.sizeBytes, result.totalSizeBytes);

                return (
                  <DsTableBodyRow
                    key={nodeId}
                    selected={isSelected}
                    onClick={() => setSelectedNodeId(nodeId)}
                    onDoubleClick={() => handleDrillDown(nodeId)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: depth * 2 }}>
                        {hasChildren ? (
                          <IconButton
                            size="small"
                            aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleToggleExpand(nodeId);
                            }}
                            sx={{ p: 0.25 }}
                          >
                            <MaterialIcon
                              name={isExpanded ? 'expand_more' : 'chevron_right'}
                              style={{ fontSize: 20 }}
                            />
                          </IconButton>
                        ) : (
                          <Box sx={{ width: 28, flexShrink: 0 }} />
                        )}
                        <MaterialIcon name="folder" style={{ fontSize: 18, flexShrink: 0 }} />
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography
                            variant="body2"
                            noWrap
                            title={node.path}
                            sx={{ fontWeight: isSelected ? 600 : 400 }}
                          >
                            {node.name}
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(100, percent)}
                            aria-hidden
                            sx={{
                              mt: 0.5,
                              height: 4,
                              borderRadius: 999,
                              bgcolor: 'surfaceContainer.main',
                              '& .MuiLinearProgress-bar': { borderRadius: 999 },
                            }}
                          />
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(node.sizeBytes)}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular>{formatPercentOfRoot(node.sizeBytes, result.totalSizeBytes)}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular>{node.fileCount.toLocaleString()}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular>{node.directoryCount.toLocaleString()}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular>{formatModifiedAt(node.modifiedAt)}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                  </DsTableBodyRow>
                );
              }

              if (row.kind === 'files-group') {
                const isSelected = selectedNodeId === row.nodeId;

                return (
                  <DsTableBodyRow
                    key={row.nodeId}
                    selected={isSelected}
                    onClick={() => setSelectedNodeId(row.nodeId)}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: row.depth * 2 }}>
                        <IconButton
                          size="small"
                          aria-label={row.isExpanded ? 'Collapse files group' : 'Expand files group'}
                          onClick={(event) => {
                            event.stopPropagation();
                            handleToggleExpand(row.nodeId, row.parentPath);
                          }}
                          sx={{ p: 0.25 }}
                        >
                          {row.isLoading ? (
                            <CircularProgress size={16} aria-label="Loading files" />
                          ) : (
                            <MaterialIcon
                              name={row.isExpanded ? 'expand_more' : 'chevron_right'}
                              style={{ fontSize: 20 }}
                            />
                          )}
                        </IconButton>
                        <MaterialIcon name="draft" style={{ fontSize: 18, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 500, fontStyle: 'italic' }}>
                          &lt;Files&gt;
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <DsTabular>{row.fileCount.toLocaleString()}</DsTabular>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" color="text.disabled">
                        —
                      </Typography>
                    </TableCell>
                  </DsTableBodyRow>
                );
              }

              const extension = row.entry.name.includes('.')
                ? `.${row.entry.name.split('.').pop()}`
                : null;

              return (
                <DsTableBodyRow key={row.nodeId}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: row.depth * 2 }}>
                      <Box sx={{ width: 28, flexShrink: 0 }} />
                      <MaterialIcon
                        name={fileIconForExtension(extension)}
                        style={{ fontSize: 18, flexShrink: 0 }}
                      />
                      <Typography variant="body2" noWrap title={row.entry.path}>
                        {row.entry.name}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(row.entry.sizeBytes)}</DsTabular>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <DsTabular>
                      {row.entry.modifiedAt ? formatModifiedAt(row.entry.modifiedAt) : '—'}
                    </DsTabular>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" color="text.disabled">
                      —
                    </Typography>
                  </TableCell>
                  <TableCell align="right" onClick={(event) => event.stopPropagation()}>
                    <FileRowActions
                      target={fileEntryToDeleteTarget(row)}
                      onDeleteSuccess={() => handleFileDeleteSuccess(row)}
                    />
                  </TableCell>
                </DsTableBodyRow>
              );
            })}
          </TableBody>
        </DsDataTable>
      )}

      <Typography variant="caption" color="text.secondary">
        Double-click a folder row to drill into that folder. Expand &lt;Files&gt; to browse and delete individual
        files.
      </Typography>
    </Box>
  );
}
