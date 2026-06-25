import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
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
import { useScanStore } from '../../hooks/useScanStore';
import { formatExtensionLabel } from '../file-types/extension-label';
import { fileIconForExtension } from './file-icon-utils';
import {
  defaultSortDirectionForLargestFileKey,
  formatModifiedAt,
  sortLargestFiles,
  type LargestFileSortKey,
  type SortDirection,
} from './largest-files-utils';

export function LargestFilesView() {
  const { result, status } = useScanStore();
  const [sortKey, setSortKey] = useState<LargestFileSortKey>('sizeBytes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

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
        <DsDataTable
          aria-label="Largest files"
          header={
            <DsTableHeadRow>
              <DsTableCell sortDirection={sortLabelProps('name').direction}>
                <TableSortLabel {...sortLabelProps('name')}>Name</TableSortLabel>
              </DsTableCell>
              <DsTableCell sortDirection={sortLabelProps('path').direction}>
                <TableSortLabel {...sortLabelProps('path')}>Path</TableSortLabel>
              </DsTableCell>
              <DsTableCell align="right" sortDirection={sortLabelProps('sizeBytes').direction}>
                <TableSortLabel {...sortLabelProps('sizeBytes')}>Size</TableSortLabel>
              </DsTableCell>
              <DsTableCell sortDirection={sortLabelProps('extension').direction}>
                <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
              </DsTableCell>
              <DsTableCell sortDirection={sortLabelProps('modifiedAt').direction}>
                <TableSortLabel {...sortLabelProps('modifiedAt')}>Modified</TableSortLabel>
              </DsTableCell>
            </DsTableHeadRow>
          }
        >
          <TableBody>
            {sortedFiles.map((file) => (
              <DsTableBodyRow key={file.path}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <MaterialIcon
                      name={fileIconForExtension(file.extension)}
                      style={{ fontSize: 20, color: 'var(--mui-palette-text-secondary)' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {file.name}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell
                  sx={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  title={file.path}
                >
                  <DsTabular>{file.path}</DsTabular>
                </TableCell>
                <TableCell align="right">
                  <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(file.sizeBytes)}</DsTabular>
                </TableCell>
                <TableCell>{formatExtensionLabel(file.extension)}</TableCell>
                <TableCell>
                  <DsTabular>{formatModifiedAt(file.modifiedAt)}</DsTabular>
                </TableCell>
              </DsTableBodyRow>
            ))}
          </TableBody>
        </DsDataTable>
      )}
    </Box>
  );
}
