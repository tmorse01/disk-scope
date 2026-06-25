import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { ExportFormat } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import { APP_ROUTES } from '../../routes';
import { exportReportFromStore } from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { OverviewLandingView } from './OverviewLandingView';
import { ScanSessionControls } from '../scan-progress/ScanSessionControls';

type OverviewViewProps = {
  message?: string;
};

export function OverviewView(_props: OverviewViewProps = {}) {
  const { status, result } = useScanStore();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const hasResult = result && (status === 'completed' || status === 'cancelled');

  async function handleExport(format: ExportFormat): Promise<void> {
    setExportingFormat(format);
    try {
      await exportReportFromStore(format);
    } finally {
      setExportingFormat(null);
    }
  }

  if (status === 'scanning' || !hasResult) {
    return <OverviewLandingView />;
  }

  const navChips = APP_ROUTES.filter((route) =>
    ['largest-folders', 'largest-files', 'file-types', 'cleanup-candidates'].includes(route.id),
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DsPageHeader title="Overview" subtitle="Summary from your latest completed scan." />

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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: 2, mt: 1, mb: 2 }}>
          <Typography variant="h1" component="p" sx={{ fontWeight: 600, color: 'primary.main', lineHeight: 1 }}>
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
          <Box>
            <Typography variant="overline" color="text.secondary">
              Cleanup candidates
            </Typography>
            <DsTabular sx={{ display: 'block', fontSize: '22px', fontWeight: 600 }}>
              {result.cleanupCandidates.length}
            </DsTabular>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 3 }}>
          {navChips.map((route) => (
            <Chip
              key={route.id}
              icon={<MaterialIcon name={route.icon} style={{ fontSize: 18 }} aria-hidden={false} />}
              label={route.label}
              variant="outlined"
              sx={{ borderRadius: `${radii.full}px` }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={exportingFormat !== null}
            onClick={() => void handleExport('json')}
            startIcon={<MaterialIcon name="download" aria-hidden={false} />}
            sx={{ borderRadius: `${radii.full}px`, textTransform: 'none', fontWeight: 600 }}
          >
            {exportingFormat === 'json' ? 'Exporting…' : 'Export JSON'}
          </Button>
          <Button
            variant="outlined"
            size="small"
            disabled={exportingFormat !== null}
            onClick={() => void handleExport('csv')}
            startIcon={<MaterialIcon name="download" aria-hidden={false} />}
            sx={{ borderRadius: `${radii.full}px`, textTransform: 'none', fontWeight: 600 }}
          >
            {exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Box>
      </DsCard>

      <DsCard>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Scanned path
        </Typography>
        <DsTabular sx={{ wordBreak: 'break-all' }}>{result.rootPath}</DsTabular>
        <Box sx={{ mt: 2 }}>
          <ScanSessionControls />
        </Box>
      </DsCard>
    </Box>
  );
}
