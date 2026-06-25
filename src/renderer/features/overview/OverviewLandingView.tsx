import Box from '@mui/material/Box';
import { DsPageHeader } from '../../components/DsStatusChip';
import { useScanStore } from '../../hooks/useScanStore';
import { getPrimarySelectedPath } from '../../stores/scan-store';
import { ScanProgressHero } from '../scan-progress/ScanProgressHero';
import { ScanTargetPanel } from '../scan-picker/ScanTargetPanel';

export function OverviewLandingView() {
  const { status } = useScanStore();

  if (status === 'scanning') {
    const primaryPath = getPrimarySelectedPath();
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DsPageHeader
          title="Scanning"
          subtitle={primaryPath ?? 'Analyzing selected storage…'}
          compact
        />
        <ScanProgressHero />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Overview"
        subtitle="Select folders or drives to analyze."
        compact
      />
      <ScanTargetPanel />
    </Box>
  );
}
