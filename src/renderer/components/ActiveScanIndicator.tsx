import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatBytes } from '../../shared/format-bytes';
import { targetIcon, targetTitle } from '../features/scan-picker/scan-target-utils';
import { useScanStore } from '../hooks/useScanStore';
import { getPrimarySelectedPath, showOverviewRecentScans } from '../stores/scan-store';
import { CONTEXT_BAR_INLINE_HEIGHT } from '../theme/mui-theme';
import { radii } from '../theme/tokens';
import { useShellContext } from './ShellContext';
import { MaterialIcon } from './MaterialIcon';

type StatusPresentation = {
  label: string;
  dotColor: string;
  textColor: string;
};

const STATUS_DOT_COLORS = {
  success: '#1e8e3e',
  warning: '#e6a700',
  error: '#ba1a1a',
  neutral: '#727785',
  info: '#0656cf',
} as const;

function getStatusPresentation(
  status: string,
  cancelPending: boolean,
  hasResult: boolean,
): StatusPresentation {
  if (status === 'scanning') {
    return cancelPending
      ? { label: 'Cancelling', dotColor: STATUS_DOT_COLORS.warning, textColor: 'warning.dark' }
      : { label: 'Scanning', dotColor: STATUS_DOT_COLORS.info, textColor: 'primary.main' };
  }
  if (status === 'cancelled') {
    return { label: 'Paused', dotColor: STATUS_DOT_COLORS.warning, textColor: 'warning.dark' };
  }
  if (status === 'failed') {
    return { label: 'Failed', dotColor: STATUS_DOT_COLORS.error, textColor: 'error.main' };
  }
  if (status === 'completed' || hasResult) {
    return { label: 'Complete', dotColor: STATUS_DOT_COLORS.success, textColor: 'success.dark' };
  }
  return { label: 'Selected', dotColor: STATUS_DOT_COLORS.neutral, textColor: 'text.secondary' };
}

function formatScanCompletedAt(completedAt: string | undefined): string | null {
  if (!completedAt) {
    return null;
  }
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const inlineTextSx = {
  lineHeight: 1.2,
  fontSize: '0.875rem',
} as const;

export function ActiveScanIndicator() {
  const { navigateTo } = useShellContext();
  const { status, result, cancelPending, scanTargetMissing } = useScanStore();
  const activePath = result?.rootPath ?? getPrimarySelectedPath();

  if (!activePath) {
    return null;
  }

  const handleClick = () => {
    showOverviewRecentScans();
    navigateTo('overview');
  };

  const hasResult = Boolean(result);
  const statusPresentation = getStatusPresentation(status, cancelPending, hasResult);
  const completedAt = formatScanCompletedAt(result?.completedAt);
  const sizeLabel = result ? formatBytes(result.totalSizeBytes) : null;

  const tooltipContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
      <Typography variant="caption" sx={{ fontWeight: 600 }}>
        Active scan · {activePath}
      </Typography>
      {sizeLabel ? (
        <Typography variant="caption">
          {sizeLabel} · {(result?.fileCount ?? 0).toLocaleString()} files
        </Typography>
      ) : null}
      {completedAt ? <Typography variant="caption">Completed {completedAt}</Typography> : null}
      {scanTargetMissing ? (
        <Typography variant="caption" color="warning.light">
          Target missing on disk
        </Typography>
      ) : null}
    </Box>
  );

  return (
    <Tooltip title={tooltipContent} enterDelay={400}>
      <Box
        component="button"
        type="button"
        onClick={handleClick}
        aria-label={`Active scan: ${targetTitle(activePath)}, ${statusPresentation.label}. Open recent scans.`}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          height: CONTEXT_BAR_INLINE_HEIGHT,
          maxWidth: { xs: 176, sm: 220 },
          px: 1,
          borderRadius: `${radii.full}px`,
          bgcolor: 'surfaceContainerHigh.main',
          border: 1,
          borderColor: scanTargetMissing ? 'warning.main' : 'outlineVariant.main',
          flexShrink: 0,
          cursor: 'pointer',
          font: 'inherit',
          color: 'inherit',
          '&:hover': {
            bgcolor: 'surfaceContainerHighest.main',
            borderColor: 'primary.main',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <MaterialIcon
          name={targetIcon(activePath)}
          filled={statusPresentation.label === 'Complete'}
          style={{
            fontSize: 16,
            color: 'var(--mui-palette-primary-main)',
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          noWrap
          sx={{
            ...inlineTextSx,
            fontWeight: 600,
            color: 'text.primary',
            minWidth: 0,
            maxWidth: { xs: 72, sm: 96 },
          }}
        >
          {targetTitle(activePath)}
        </Typography>
        <Box
          component="span"
          aria-hidden
          sx={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            bgcolor: statusPresentation.dotColor,
            flexShrink: 0,
          }}
        />
        <Typography
          variant="body2"
          sx={{
            ...inlineTextSx,
            color: statusPresentation.textColor,
            flexShrink: 0,
            fontSize: '0.75rem',
            fontWeight: 600,
          }}
        >
          {statusPresentation.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
