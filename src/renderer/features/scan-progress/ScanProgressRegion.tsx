import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { formatBytes } from '../../../shared/format-bytes';
import { MaterialIcon } from '../../components/MaterialIcon';
import { cancelScanFromStore } from '../../stores/scan-store';
import { useScanStore } from '../../hooks/useScanStore';
import { formatElapsed, shortenPath } from './format-elapsed';

function statusIcon(status: string): string {
  switch (status) {
    case 'scanning':
      return 'progress_activity';
    case 'completed':
      return 'check_circle';
    case 'cancelled':
      return 'cancel';
    case 'failed':
      return 'error';
    default:
      return 'hourglass_empty';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'scanning':
      return 'Scan in progress';
    case 'completed':
      return 'Scan complete';
    case 'cancelled':
      return 'Scan cancelled';
    case 'failed':
      return 'Scan failed';
    default:
      return 'No scan in progress';
  }
}

export function ScanProgressRegion() {
  const { status, progress, result, scanError } = useScanStore();
  const isScanning = status === 'scanning';
  const hasSummary = status === 'completed' || status === 'cancelled';

  let detail = 'Scan progress will appear here during active scans.';

  if (isScanning && progress) {
    detail = `${progress.filesScanned.toLocaleString()} files · ${progress.directoriesScanned.toLocaleString()} folders · ${formatBytes(progress.bytesDiscovered)} · ${progress.errorCount} errors · ${formatElapsed(progress.elapsedMs)} · ${shortenPath(progress.currentPath)}`;
  } else if (hasSummary && result) {
    detail = `${result.fileCount.toLocaleString()} files · ${result.directoryCount.toLocaleString()} folders · ${formatBytes(result.totalSizeBytes)} · ${result.errorCount} errors`;
  } else if (status === 'failed') {
    detail = scanError ?? 'The scan could not be completed.';
  }

  return (
    <Box
      component="footer"
      aria-label="Scan status"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: 48,
        px: 3,
        py: 1,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        color: 'text.secondary',
        fontSize: '0.875rem',
        fontWeight: 500,
      }}
    >
      <MaterialIcon
        name={statusIcon(status)}
        style={{
          color: isScanning
            ? 'var(--mui-palette-primary-main)'
            : status === 'failed'
              ? 'var(--mui-palette-error-main)'
              : status === 'completed'
                ? 'var(--mui-palette-success-main)'
                : undefined,
          fontSize: 20,
        }}
      />
      <Typography component="span" variant="body2" sx={{ fontWeight: 500, flexShrink: 0 }}>
        {statusLabel(status)}
      </Typography>
      <Typography
        component="span"
        variant="body2"
        color="text.primary"
        sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        title={progress?.currentPath ?? result?.rootPath}
      >
        {detail}
      </Typography>
      {isScanning ? (
        <Button
          size="small"
          color="warning"
          onClick={() => void cancelScanFromStore()}
          sx={{ flexShrink: 0, textTransform: 'none' }}
        >
          Cancel
        </Button>
      ) : null}
    </Box>
  );
}
