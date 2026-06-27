import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import type { LargestFileEntry } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import { DsDataTable, DsTableBodyRow, DsTableHeadRow } from '../../components/DsDataTable';
import {
  DsResizableBodyCell,
  DsResizableColumnsProvider,
  DsResizableHeaderCell,
  type ResizableColumnDef,
} from '../../components/DsResizableColumns';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import type { DeleteTarget } from '../file-actions/delete-target';
import { useSelectableFileActions } from '../file-actions/useSelectableFileActions';
import { formatExtensionLabel } from '../file-types/extension-label';
import { fileIconForExtension } from './file-icon-utils';
import {
  defaultSortDirectionForLargestFileKey,
  formatModifiedAt,
  sortLargestFiles,
  type LargestFileSortKey,
  type SortDirection,
} from './largest-files-utils';

const LARGEST_FILES_COLUMNS: ResizableColumnDef[] = [
  { id: 'name', defaultWidth: 240, minWidth: 120 },
  { id: 'path', defaultWidth: 320, minWidth: 160 },
  { id: 'sizeBytes', defaultWidth: 108, minWidth: 72 },
  { id: 'extension', defaultWidth: 120, minWidth: 80 },
  { id: 'modifiedAt', defaultWidth: 148, minWidth: 100 },
];

function largestFileToDeleteTarget(file: LargestFileEntry): DeleteTarget {
  return {
    path: file.path,
    name: file.name,
    kind: 'file',
    sizeBytes: file.sizeBytes,
  };
}

export function LargestFilesView() {
  const { result, status } = useScanStore();
  const [sortKey, setSortKey] = useState<LargestFileSortKey>('sizeBytes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const { getRowProps, toolbar, contextMenu, deleteConfirmationUi } = useSelectableFileActions();

  const sortedFiles = useMemo(() => {
    if (!result?.largestFiles.length) {
      return [];
    }

    return sortLargestFiles(result.largestFiles, sortKey, sortDirection);
  }, [result?.largestFiles, sortDirection, sortKey]);

  const handleSort = (key: LargestFileSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(defaultSortDirectionForLargestFileKey(key));
  };

  const sortLabelProps = (key: LargestFileSortKey) => ({
    active: sortKey === key,
    direction: sortKey === key ? sortDirection : defaultSortDirectionForLargestFileKey(key),
    onClick: () => handleSort(key),
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Largest Files"
        subtitle="Individual files ranked by size from the latest completed scan."
      />

      {status === 'scanning' && (
        <Alert severity="info" variant="outlined">
          Scan in progress — file rankings will update when the scan completes.
        </Alert>
      )}

      {!result && status !== 'scanning' && (
        <Alert severity="info" variant="outlined">
          Run a scan to see the largest files in the selected folder.
        </Alert>
      )}

      {result && sortedFiles.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No files were found in the scanned directory.
        </Typography>
      )}

      {sortedFiles.length > 0 && (
        <DsCard noPadding sx={{ overflow: 'hidden' }}>
          {toolbar}
          <DsResizableColumnsProvider columns={LARGEST_FILES_COLUMNS}>
            <DsDataTable
              noOuterCard
              aria-label="Largest files"
              header={
                <DsTableHeadRow>
                  <DsResizableHeaderCell columnId="name" sortDirection={sortLabelProps('name').direction}>
                    <TableSortLabel {...sortLabelProps('name')}>Name</TableSortLabel>
                  </DsResizableHeaderCell>
                  <DsResizableHeaderCell columnId="path" sortDirection={sortLabelProps('path').direction}>
                    <TableSortLabel {...sortLabelProps('path')}>Path</TableSortLabel>
                  </DsResizableHeaderCell>
                  <DsResizableHeaderCell
                    columnId="sizeBytes"
                    align="right"
                    sortDirection={sortLabelProps('sizeBytes').direction}
                  >
                    <TableSortLabel {...sortLabelProps('sizeBytes')}>Size</TableSortLabel>
                  </DsResizableHeaderCell>
                  <DsResizableHeaderCell columnId="extension" sortDirection={sortLabelProps('extension').direction}>
                    <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
                  </DsResizableHeaderCell>
                  <DsResizableHeaderCell
                    columnId="modifiedAt"
                    sortDirection={sortLabelProps('modifiedAt').direction}
                  >
                    <TableSortLabel {...sortLabelProps('modifiedAt')}>Modified</TableSortLabel>
                  </DsResizableHeaderCell>
                </DsTableHeadRow>
              }
            >
              <TableBody>
                {sortedFiles.map((file) => {
                  const rowProps = getRowProps(largestFileToDeleteTarget(file));

                  return (
                    <DsTableBodyRow key={file.path} {...rowProps}>
                      <DsResizableBodyCell columnId="name" title={file.name}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                          <MaterialIcon
                            name={fileIconForExtension(file.extension)}
                            style={{ fontSize: 20, color: 'var(--mui-palette-text-secondary)', flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            noWrap
                            sx={{ fontWeight: rowProps.selected ? 600 : 400 }}
                          >
                            {file.name}
                          </Typography>
                        </Box>
                      </DsResizableBodyCell>
                      <DsResizableBodyCell columnId="path" title={file.path}>
                        <DsTabular>{file.path}</DsTabular>
                      </DsResizableBodyCell>
                      <DsResizableBodyCell columnId="sizeBytes" align="right">
                        <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(file.sizeBytes)}</DsTabular>
                      </DsResizableBodyCell>
                      <DsResizableBodyCell columnId="extension">
                        {formatExtensionLabel(file.extension)}
                      </DsResizableBodyCell>
                      <DsResizableBodyCell columnId="modifiedAt">
                        <DsTabular>{formatModifiedAt(file.modifiedAt)}</DsTabular>
                      </DsResizableBodyCell>
                    </DsTableBodyRow>
                  );
                })}
              </TableBody>
            </DsDataTable>
          </DsResizableColumnsProvider>
          {contextMenu}
          {deleteConfirmationUi}
        </DsCard>
      )}
    </Box>
  );
}
