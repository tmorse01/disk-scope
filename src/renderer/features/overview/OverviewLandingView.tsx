import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { useScanStore } from '../../hooks/useScanStore';
import { getPrimarySelectedPath } from '../../stores/scan-store';
import { ScanProgressHero } from '../scan-progress/ScanProgressHero';
import { ScanHistoryPanel } from '../scan-picker/ScanHistoryPanel';
import { ScanTargetPanel } from '../scan-picker/ScanTargetPanel';

export function OverviewLandingView() {
  const { status } = useScanStore();

  if (status === 'scanning' || status === 'cancelled') {
    const primaryPath = getPrimarySelectedPath();
    const title = status === 'cancelled' ? 'Scan cancelled' : 'Scanning';
    const subtitle =
      status === 'cancelled'
        ? 'Resume to continue scanning this target.'
        : (primaryPath ?? 'Analyzing selected storage…');
    return (
      <DsViewLayout
        header={
          <DsPageHeader
            title={title}
            subtitle={subtitle}
            compact
          />
        }
      >
        <ScanProgressHero />
      </DsViewLayout>
    );
  }

  return (
    <DsViewLayout
      header={
        <DsPageHeader title="Overview" subtitle="Select folders or drives to analyze." compact />
      }
    >
      <ScanTargetPanel />
      <ScanHistoryPanel />
    </DsViewLayout>
  );
}
