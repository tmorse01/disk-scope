import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import {
  buildBreadcrumbPath,
  DEFAULT_FOLDER_SORT_COLUMN,
  DEFAULT_FOLDER_SORT_DIRECTION,
  flattenFolderTree,
  formatModifiedAt,
  formatPercentOfRoot,
  percentOfRoot,
  type FolderSortColumn,
  type SortDirection,
} from './folder-tree-utils';

type ColumnDef = {
  id: FolderSortColumn | 'risk';
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
];

export function LargestFoldersView() {
  const { status, result } = useScanStore();
  const [focusNodeId, setFocusNodeId] = useState<NodeId | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<NodeId | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<NodeId>>(() => new Set());
  const [sortColumn, setSortColumn] = useState<FolderSortColumn>(DEFAULT_FOLDER_SORT_COLUMN);
  const [sortDirection, setSortDirection] = useState<SortDirection>(DEFAULT_FOLDER_SORT_DIRECTION);

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

    return flattenFolderTree(
      effectiveFocusId,
      result.directoriesById,
      expandedIds,
      sortColumn,
      sortDirection,
      result.totalSizeBytes,
    );
  }, [effectiveFocusId, expandedIds, result, sortColumn, sortDirection]);

  const selectedNode =
    selectedNodeId && result ? result.directoriesById[selectedNodeId] : undefined;

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

  const handleToggleExpand = useCallback((nodeId: NodeId) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const handleDrillDown = useCallback(
    (nodeId: NodeId) => {
      handleFocusChange(nodeId);
    },
    [handleFocusChange],
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Largest Folders"
        subtitle={`Analyzing ${result.fileCount.toLocaleString()} files under ${result.rootPath}`}
      />

      {rows.length === 0 ? (
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
            {rows.map(({ nodeId, node, depth, hasChildren, isExpanded }) => {
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
                </DsTableBodyRow>
              );
            })}
          </TableBody>
        </DsDataTable>
      )}

      <Typography variant="caption" color="text.secondary">
        Double-click a row to drill into that folder.
      </Typography>
    </Box>
  );
}
