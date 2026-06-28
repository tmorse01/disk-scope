import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { useScanStore } from '../../hooks/useScanStore';
import { getPrimarySelectedPath } from '../../stores/scan-store';
import { ScanProgressHero } from '../scan-progress/ScanProgressHero';
import { ScanHistoryPanel } from '../scan-picker/ScanHistoryPanel';
import { ScanTargetPanel } from '../scan-picker/ScanTargetPanel';

export function OverviewLandingView() {
  const { status } = useScanStore();

  if (status === 'scanning') {
    const primaryPath = getPrimarySelectedPath();
    return (
      <DsViewLayout
        header={
          <DsPageHeader
            title="Scanning"
            subtitle={primaryPath ?? 'Analyzing selected storage…'}
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
