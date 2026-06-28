import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useShellContext } from '../../components/ShellContext';
import { useScanStore } from '../../hooks/useScanStore';
import { showOverviewPicker } from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { CleanupReclaimHero } from '../cleanup-candidates/CleanupReclaimHero';
import { ScanHistoryPanel } from '../scan-picker/ScanHistoryPanel';
import { OverviewLandingView } from './OverviewLandingView';

type OverviewViewProps = {
  message?: string;
};

const NEXT_STEP_ROUTES = [
  {
    id: 'largest-folders' as const,
    label: 'Browse largest folders',
    icon: 'folder',
    variant: 'contained' as const,
  },
  {
    id: 'disk-map' as const,
    label: 'Open disk map',
    icon: 'grid_view',
    variant: 'contained' as const,
  },
  {
    id: 'largest-files' as const,
    label: 'Browse largest files',
    icon: 'description',
    variant: 'contained' as const,
  },
  {
    id: 'cleanup-candidates' as const,
    label: 'View cleanup suggestions',
    icon: 'cleaning_services',
    variant: 'outlined' as const,
  },
];

export function OverviewView(_props: OverviewViewProps = {}) {
  const { status, result, overviewMode } = useScanStore();
  const { navigateTo } = useShellContext();
  const hasResult = result && (status === 'completed' || status === 'cancelled');

  if (status === 'scanning' || overviewMode === 'picker' || !hasResult) {
    return <OverviewLandingView />;
  }

  const cleanupCandidates = result.cleanupCandidates;
  const cleanupCount = cleanupCandidates.length;

  return (
    <DsViewLayout
      header={
        <DsPageHeader
          title="Scan complete"
          subtitle="Explore what's using space or review suggested cleanup items."
          actions={
            <Button
              variant="outlined"
              color="primary"
              onClick={showOverviewPicker}
              startIcon={<MaterialIcon name="add" aria-hidden={false} />}
              sx={{ borderRadius: `${radii.full}px`, textTransform: 'none', fontWeight: 600 }}
            >
              New scan
            </Button>
          }
        />
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <DsCard
          sx={{
            bgcolor: 'background.paper',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.surfaceContainerLow?.main ?? '#f3f4f5'} 100%)`,
          }}
        >
          <Typography variant="overline" color="primary">
            Scan summary
          </Typography>
          <Box
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 2, mt: 1, mb: 2 }}
          >
            <Typography
              variant="h1"
              component="p"
              sx={{ fontWeight: 600, color: 'primary.main', lineHeight: 1 }}
            >
              {formatBytes(result.totalSizeBytes)}
            </Typography>
            <Typography variant="h3" color="text.secondary">
              total scanned
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Files
              </Typography>
              <DsTabular sx={{ display: 'block', fontSize: '22px', fontWeight: 600 }}>
                {result.fileCount.toLocaleString()}
              </DsTabular>
            </Box>
            <Box>
              <Typography variant="overline" color="text.secondary">
                Folders
              </Typography>
              <DsTabular sx={{ display: 'block', fontSize: '22px', fontWeight: 600 }}>
                {result.directoryCount.toLocaleString()}
              </DsTabular>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2, wordBreak: 'break-all' }}>
            Scanned{' '}
            <DsTabular component="span" sx={{ fontSize: 'inherit' }}>
              {result.rootPath}
            </DsTabular>
          </Typography>
        </DsCard>

        <CleanupReclaimHero
          candidates={cleanupCandidates}
          mode="overview"
          onOpenCleanup={() => navigateTo('cleanup-candidates')}
          onOpenLargestFiles={() => navigateTo('largest-files')}
          onOpenFileTypes={() => navigateTo('file-types')}
        />

        <DsCard>
          <Typography
            variant="h3"
            component="h2"
            sx={{ fontSize: '18px', fontWeight: 600, mb: 0.5 }}
          >
            What&apos;s next?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Drill into folders and files to find what you want to clean up.
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {NEXT_STEP_ROUTES.map((route) => (
              <Button
                key={route.id}
                variant={route.variant}
                color="primary"
                size="large"
                onClick={() => navigateTo(route.id)}
                startIcon={<MaterialIcon name={route.icon} aria-hidden={false} />}
                sx={{
                  borderRadius: `${radii.full}px`,
                  textTransform: 'none',
                  fontWeight: 600,
                  flex: { xs: '1 1 100%', sm: '1 1 auto' },
                }}
              >
                {route.label}
                {route.id === 'cleanup-candidates' && cleanupCount > 0
                  ? ` (${cleanupCount.toLocaleString()})`
                  : ''}
              </Button>
            ))}
          </Box>
        </DsCard>
        <ScanHistoryPanel />
      </Box>
    </DsViewLayout>
  );
}
