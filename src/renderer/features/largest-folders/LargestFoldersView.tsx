import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Link from '@mui/material/Link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import type { NodeId } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { MaterialIcon } from '../../components/MaterialIcon';
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

  if (status === 'scanning') {
    return (
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Largest Folders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Scan in progress — folder rankings will update when the scan completes.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  if (!result) {
    return (
      <Card variant="outlined">
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Largest Folders
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Run a scan from Overview to see folder rankings here.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500, flex: 1 }}>
            Largest Folders
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<MaterialIcon name="folder_open" aria-hidden={false} />}
            disabled={!selectedNode}
            onClick={handleReveal}
            sx={{ textTransform: 'none' }}
          >
            Reveal in Explorer
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<MaterialIcon name="content_copy" aria-hidden={false} />}
            disabled={!selectedNode}
            onClick={handleCopyPath}
            sx={{ textTransform: 'none' }}
          >
            Copy path
          </Button>
        </Box>

        <Breadcrumbs aria-label="Folder drilldown">
          {breadcrumb.map((node, index) => {
            const isLast = index === breadcrumb.length - 1;

            if (isLast) {
              return (
                <Typography key={node.id} variant="body2" color="text.primary">
                  {node.name}
                </Typography>
              );
            }

            return (
              <Link
                key={node.id}
                component="button"
                type="button"
                variant="body2"
                underline="hover"
                color="inherit"
                onClick={() => handleFocusChange(node.id)}
                sx={{ cursor: 'pointer', fontFamily: 'inherit' }}
              >
                {node.name}
              </Link>
            );
          })}
        </Breadcrumbs>

        {rows.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            No subfolders in this directory.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small" aria-label="Largest folders">
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => (
                    <TableCell key={column.id} align={column.align ?? 'left'}>
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
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map(({ nodeId, node, depth, hasChildren, isExpanded }) => {
                  const isSelected = selectedNodeId === nodeId;
                  const percent = percentOfRoot(node.sizeBytes, result.totalSizeBytes);

                  return (
                    <TableRow
                      key={nodeId}
                      hover
                      selected={isSelected}
                      onClick={() => setSelectedNodeId(nodeId)}
                      onDoubleClick={() => handleDrillDown(nodeId)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            pl: depth * 2,
                          }}
                        >
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
                                borderRadius: 1,
                                bgcolor: 'action.hover',
                                '& .MuiLinearProgress-bar': { borderRadius: 1 },
                              }}
                            />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell align="right">{formatBytes(node.sizeBytes)}</TableCell>
                      <TableCell align="right">
                        {formatPercentOfRoot(node.sizeBytes, result.totalSizeBytes)}
                      </TableCell>
                      <TableCell align="right">{node.fileCount.toLocaleString()}</TableCell>
                      <TableCell align="right">{node.directoryCount.toLocaleString()}</TableCell>
                      <TableCell align="right">{formatModifiedAt(node.modifiedAt)}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.disabled">
                          —
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Typography variant="caption" color="text.secondary">
          Double-click a row to drill into that folder. Risk labels will appear after cleanup rules
          are enabled.
        </Typography>
      </CardContent>
    </Card>
  );
}
