import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { formatBytes } from '../../../shared/format-bytes';
import {
  DsDataTable,
  DsTableBodyRow,
  DsTableHeadRow,
} from '../../components/DsDataTable';
import {
  DsResizableBodyCell,
  DsResizableColumnsProvider,
  DsResizableHeaderCell,
  type ResizableColumnDef,
} from '../../components/DsResizableColumns';
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

const FILE_TYPES_COLUMNS: ResizableColumnDef[] = [
  { id: 'extension', defaultWidth: 200, minWidth: 120 },
  { id: 'sizeBytes', defaultWidth: 140, minWidth: 88 },
  { id: 'fileCount', defaultWidth: 120, minWidth: 80 },
];

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
        <DsResizableColumnsProvider columns={FILE_TYPES_COLUMNS}>
          <DsDataTable
            aria-label="File types"
            header={
              <DsTableHeadRow>
                <DsResizableHeaderCell columnId="extension" sortDirection={sortLabelProps('extension').direction}>
                  <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
                </DsResizableHeaderCell>
                <DsResizableHeaderCell
                  columnId="sizeBytes"
                  align="right"
                  sortDirection={sortLabelProps('sizeBytes').direction}
                >
                  <TableSortLabel {...sortLabelProps('sizeBytes')}>Total size</TableSortLabel>
                </DsResizableHeaderCell>
                <DsResizableHeaderCell
                  columnId="fileCount"
                  align="right"
                  sortDirection={sortLabelProps('fileCount').direction}
                >
                  <TableSortLabel {...sortLabelProps('fileCount')}>File count</TableSortLabel>
                </DsResizableHeaderCell>
              </DsTableHeadRow>
            }
          >
            <TableBody>
              {sortedSummaries.map((summary) => (
                <DsTableBodyRow key={summary.extension ?? '__no_extension__'}>
                  <DsResizableBodyCell columnId="extension">
                    {formatExtensionLabel(summary.extension)}
                  </DsResizableBodyCell>
                  <DsResizableBodyCell columnId="sizeBytes" align="right">
                    <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(summary.sizeBytes)}</DsTabular>
                  </DsResizableBodyCell>
                  <DsResizableBodyCell columnId="fileCount" align="right">
                    <DsTabular>{summary.fileCount.toLocaleString()}</DsTabular>
                  </DsResizableBodyCell>
                </DsTableBodyRow>
              ))}
            </TableBody>
          </DsDataTable>
        </DsResizableColumnsProvider>
      )}
    </Box>
  );
}
