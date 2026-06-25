import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Typography from '@mui/material/Typography';
import { useMemo, useState } from 'react';
import { formatBytes } from '../../../shared/format-bytes';
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
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            File Types
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Disk usage grouped by file extension from the latest completed scan.
          </Typography>
        </Box>

        {status === 'scanning' && (
          <Alert severity="info">
            Scan in progress — file type breakdown will update when the scan completes.
          </Alert>
        )}

        {!result && status !== 'scanning' && (
          <Typography variant="body2" color="text.secondary">
            Run a scan to see which file types consume the most space.
          </Typography>
        )}

        {result && sortedSummaries.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No files were found in the scanned directory.
          </Typography>
        )}

        {sortedSummaries.length > 0 && (
          <TableContainer>
            <Table size="small" aria-label="File types">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortLabelProps('extension').direction}>
                    <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={sortLabelProps('sizeBytes').direction}>
                    <TableSortLabel {...sortLabelProps('sizeBytes')}>Total size</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={sortLabelProps('fileCount').direction}>
                    <TableSortLabel {...sortLabelProps('fileCount')}>File count</TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedSummaries.map((summary) => (
                  <TableRow
                    key={summary.extension ?? '__no_extension__'}
                    hover
                  >
                    <TableCell>{formatExtensionLabel(summary.extension)}</TableCell>
                    <TableCell align="right">{formatBytes(summary.sizeBytes)}</TableCell>
                    <TableCell align="right">{summary.fileCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </CardContent>
    </Card>
  );
}
