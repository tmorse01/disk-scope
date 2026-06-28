import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import { DsCircularProgressRing } from '../../components/DsCircularProgressRing';
import { DsLinearProgressBar } from '../../components/DsLinearProgressBar';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import {
  cancelScanFromStore,
  getPrimarySelectedPath,
  resumeScanFromStore,
} from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { formatElapsed, shortenPath } from './format-elapsed';
import { useScanActivity } from './useScanActivity';

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="overline" sx={{ color: 'text.secondary', display: 'block' }}>
        {label}
      </Typography>
      <DsTabular sx={{ display: 'block', fontSize: { xs: '16px', sm: '18px' }, fontWeight: 600 }}>
        {value}
      </DsTabular>
    </Box>
  );
}

export function ScanProgressHero() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down('sm'));
  const isMedium = useMediaQuery(theme.breakpoints.down('lg'));
  const { status, cancelPending, progress, analyzedPercentFloor } = useScanStore();
  const primaryPath = getPrimarySelectedPath();
  const isPaused = cancelPending || status === 'cancelled';
  const isActive = status === 'scanning' && !cancelPending;
  const { percentAnalyzed, caption } = useScanActivity(
    progress,
    primaryPath,
    isActive,
    analyzedPercentFloor,
  );

  const ringSize = isCompact ? 168 : isMedium ? 220 : 260;
  const strokeWidth = isCompact ? 10 : 12;

  const filesScanned = progress?.filesScanned ?? 0;
  const directoriesScanned = progress?.directoriesScanned ?? 0;
  const bytesDiscovered = progress?.bytesDiscovered ?? 0;
  const errorCount = progress?.errorCount ?? 0;
  const currentPath = progress?.currentPath ?? primaryPath ?? '';
  const elapsedMs = progress?.elapsedMs ?? 0;

  const statsLine = `${filesScanned.toLocaleString()} files · ${directoriesScanned.toLocaleString()} folders · ${formatBytes(bytesDiscovered)} · ${errorCount} errors · ${formatElapsed(elapsedMs)}`;

  const title = status === 'cancelled'
    ? 'Scan cancelled'
    : cancelPending
      ? 'Cancelling scan'
      : 'Scan in progress';

  const statusIcon = status === 'cancelled'
    ? 'cancel'
    : cancelPending
      ? 'pause_circle'
      : 'progress_activity';

  const sectionLabel = isPaused ? 'Scan paused' : 'Scan in progress';

  return (
    <DsCard
      noPadding
      sx={{
        bgcolor: 'surfaceContainerLow.main',
        overflow: 'visible',
      }}
    >
      <Box
        component="section"
        aria-label={sectionLabel}
        sx={{ display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            px: { xs: 2, sm: 3 },
            py: { xs: 1.5, sm: 2 },
            borderBottom: 1,
            borderColor: 'outlineVariant.main',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
            <MaterialIcon
              name={statusIcon}
              style={{ color: 'var(--mui-palette-primary-main)', fontSize: 22, flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap title={statsLine}>
                {statsLine}
              </Typography>
            </Box>
          </Box>
          {isPaused ? (
            <Button
              variant="contained"
              size={isCompact ? 'small' : 'medium'}
              onClick={() => void resumeScanFromStore()}
              startIcon={<MaterialIcon name="play_arrow" aria-hidden={false} />}
              sx={{
                flexShrink: 0,
                borderRadius: `${radii.full}px`,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Resume scan
            </Button>
          ) : (
            <Button
              variant="contained"
              size={isCompact ? 'small' : 'medium'}
              onClick={() => void cancelScanFromStore()}
              startIcon={<MaterialIcon name="close" aria-hidden={false} />}
              sx={{
                flexShrink: 0,
                borderRadius: `${radii.full}px`,
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: 'error.light',
                color: 'error.dark',
                '&:hover': {
                  bgcolor: 'error.main',
                  color: 'error.contrastText',
                },
              }}
            >
              Cancel scan
            </Button>
          )}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'minmax(140px, auto) 1fr' },
            gap: { xs: 2, sm: 3 },
            p: { xs: 2, sm: 3 },
            alignItems: { sm: 'start' },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mx: 'auto',
              width: '100%',
              maxWidth: ringSize,
            }}
          >
            <DsCircularProgressRing
              value={percentAnalyzed}
              label={`${Math.round(percentAnalyzed)}%`}
              sublabel="Analyzed"
              size={ringSize}
              strokeWidth={strokeWidth}
              ariaLabel="Disk analyzed"
            />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <Box>
              <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
                Current path
              </Typography>
              <DsTabular
                sx={{
                  display: 'block',
                  mt: 0.5,
                  px: 1.5,
                  py: 1,
                  bgcolor: 'surfaceContainer.main',
                  borderRadius: `${radii.lg}px`,
                  border: 1,
                  borderColor: 'outlineVariant.main',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '12px', sm: '13px' },
                }}
                title={currentPath}
              >
                {shortenPath(currentPath, isCompact ? 48 : 80)}
              </DsTabular>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: 'repeat(2, minmax(0, 1fr))',
                  md: 'repeat(3, minmax(0, 1fr))',
                },
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <MetricCell label="Folders" value={directoriesScanned.toLocaleString()} />
              <MetricCell label="Total size" value={formatBytes(bytesDiscovered)} />
              <MetricCell label="Elapsed" value={formatElapsed(elapsedMs)} />
              <MetricCell label="Errors" value={errorCount.toLocaleString()} />
              <MetricCell label="Status" value={isPaused ? 'Paused' : caption} />
              <MetricCell label="Files" value={filesScanned.toLocaleString()} />
            </Box>

            <DsLinearProgressBar
              value={percentAnalyzed}
              label="Disk analyzed"
              caption={`${Math.round(percentAnalyzed)}%`}
              height={isCompact ? 6 : 8}
              ariaLabel="Disk analyzed"
            />

            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
              {isPaused
                ? 'Progress is paused. Resume to continue scanning this target.'
                : 'Rankings and cleanup candidates appear when the scan finishes.'}
            </Typography>
          </Box>
        </Box>
      </Box>
    </DsCard>
  );
}
