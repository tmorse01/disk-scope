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
import { formatExtensionLabel } from '../file-types/extension-label';
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
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Largest Files
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Individual files ranked by size from the latest completed scan.
          </Typography>
        </Box>

        {status === 'scanning' && (
          <Alert severity="info">Scan in progress — file rankings will update when the scan completes.</Alert>
        )}

        {!result && status !== 'scanning' && (
          <Typography variant="body2" color="text.secondary">
            Run a scan to see the largest files in the selected folder.
          </Typography>
        )}

        {result && sortedFiles.length === 0 && (
          <Typography variant="body2" color="text.secondary">
            No files were found in the scanned directory.
          </Typography>
        )}

        {sortedFiles.length > 0 && (
          <TableContainer>
            <Table size="small" aria-label="Largest files">
              <TableHead>
                <TableRow>
                  <TableCell sortDirection={sortLabelProps('name').direction}>
                    <TableSortLabel {...sortLabelProps('name')}>Name</TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortLabelProps('path').direction}>
                    <TableSortLabel {...sortLabelProps('path')}>Path</TableSortLabel>
                  </TableCell>
                  <TableCell align="right" sortDirection={sortLabelProps('sizeBytes').direction}>
                    <TableSortLabel {...sortLabelProps('sizeBytes')}>Size</TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortLabelProps('extension').direction}>
                    <TableSortLabel {...sortLabelProps('extension')}>Extension</TableSortLabel>
                  </TableCell>
                  <TableCell sortDirection={sortLabelProps('modifiedAt').direction}>
                    <TableSortLabel {...sortLabelProps('modifiedAt')}>Modified</TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedFiles.map((file) => (
                  <TableRow key={file.path} hover>
                    <TableCell>{file.name}</TableCell>
                    <TableCell
                      sx={{
                        fontFamily: 'monospace',
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={file.path}
                    >
                      {file.path}
                    </TableCell>
                    <TableCell align="right">{formatBytes(file.sizeBytes)}</TableCell>
                    <TableCell>{formatExtensionLabel(file.extension)}</TableCell>
                    <TableCell>{formatModifiedAt(file.modifiedAt)}</TableCell>
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
