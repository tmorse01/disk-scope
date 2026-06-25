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
import { useScanStore } from '../../hooks/useScanStore';
import {
  defaultSortDirectionForExtensionKey,
  sortExtensionSummaries,
  type ExtensionSortKey,
  type SortDirection,
} from './file-types-utils';
import { formatExtensionLabel } from './extension-label';

export function FileTypesView() {
  const { result, status } = useScanStore();
  const [sortKey, setSortKey] = useState<ExtensionSortKey>('sizeBytes');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedSummaries = useMemo(() => {
    if (!result?.extensionSummaries.length) {
      return [];
    }

    return sortExtensionSummaries(result.extensionSummaries, sortKey, sortDirection);
  }, [result?.extensionSummaries, sortDirection, sortKey]);

  const handleSort = (key: ExtensionSortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(defaultSortDirectionForExtensionKey(key));
  };

  const sortLabelProps = (key: ExtensionSortKey) => ({
    active: sortKey === key,
    direction: sortKey === key ? sortDirection : defaultSortDirectionForExtensionKey(key),
    onClick: () => handleSort(key),
  });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="File Types"
        subtitle="Disk usage grouped by file extension from the latest completed scan."
      />

      {status === 'scanning' && (
        <Alert severity="info" variant="outlined">
          Scan in progress — file type breakdown will update when the scan completes.
        </Alert>
      )}

      {!result && status !== 'scanning' && (
        <Alert severity="info" variant="outlined">
          Run a scan to see which file types consume the most space.
        </Alert>
      )}

      {result && sortedSummaries.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No files were found in the scanned directory.
        </Typography>
      )}

      {sortedSummaries.length > 0 && (
        <DsDataTable
          aria-label="File types"
          header={
            <DsTableHeadRow>
              <DsTableCell sortDirection={sortLabelProps('extension').direction}>
                <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
              </DsTableCell>
              <DsTableCell align="right" sortDirection={sortLabelProps('sizeBytes').direction}>
                <TableSortLabel {...sortLabelProps('sizeBytes')}>Total size</TableSortLabel>
              </DsTableCell>
              <DsTableCell align="right" sortDirection={sortLabelProps('fileCount').direction}>
                <TableSortLabel {...sortLabelProps('fileCount')}>File count</TableSortLabel>
              </DsTableCell>
            </DsTableHeadRow>
          }
        >
          <TableBody>
            {sortedSummaries.map((summary) => (
              <DsTableBodyRow key={summary.extension ?? '__no_extension__'}>
                <TableCell>{formatExtensionLabel(summary.extension)}</TableCell>
                <TableCell align="right">
                  <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(summary.sizeBytes)}</DsTabular>
                </TableCell>
                <TableCell align="right">
                  <DsTabular>{summary.fileCount.toLocaleString()}</DsTabular>
                </TableCell>
              </DsTableBodyRow>
            ))}
          </TableBody>
        </DsDataTable>
      )}
    </Box>
  );
}
