import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import {
  getPrimarySelectedPath,
  setOverviewTab,
  showOverviewPicker,
  showOverviewScanProgress,
  type OverviewTab,
} from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { ScanProgressHero } from '../scan-progress/ScanProgressHero';
import { ScanHistoryPanel } from '../scan-picker/ScanHistoryPanel';
import { ScanTargetPanel } from '../scan-picker/ScanTargetPanel';

function OverviewTabs({
  value,
  onChange,
}: {
  value: OverviewTab;
  onChange: (tab: OverviewTab) => void;
}) {
  return (
    <Tabs
      value={value}
      onChange={(_event, nextTab: OverviewTab) => onChange(nextTab)}
      aria-label="Overview sections"
      sx={{
        minHeight: 40,
        mb: 2,
        borderBottom: 1,
        borderColor: 'outlineVariant.main',
        '& .MuiTab-root': {
          minHeight: 40,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '0.875rem',
        },
      }}
    >
      <Tab
        value="new-scan"
        label="New scan"
        icon={<MaterialIcon name="add" style={{ fontSize: 18 }} />}
        iconPosition="start"
      />
      <Tab
        value="recent-scans"
        label="Recent scans"
        icon={<MaterialIcon name="history" style={{ fontSize: 18 }} />}
        iconPosition="start"
      />
    </Tabs>
  );
}

export function OverviewLandingView() {
  const { status, overviewMode, overviewTab } = useScanStore();
  const isActiveScan = status === 'scanning' || status === 'cancelled';
  const showScanProgress = isActiveScan && overviewMode !== 'picker';

  if (showScanProgress) {
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
            actions={
              <Button
                variant="outlined"
                color="primary"
                onClick={showOverviewPicker}
                startIcon={<MaterialIcon name="arrow_back" aria-hidden={false} />}
                sx={{ borderRadius: `${radii.full}px`, textTransform: 'none', fontWeight: 600 }}
              >
                Back to overview
              </Button>
            }
          />
        }
      >
        <ScanProgressHero />
      </DsViewLayout>
    );
  }

  const primaryPath = getPrimarySelectedPath();

  return (
    <DsViewLayout
      header={
        <DsPageHeader title="Overview" subtitle="Select folders or drives to analyze." compact />
      }
    >
      <OverviewTabs
        value={overviewTab}
        onChange={(tab) => {
          if (tab === 'recent-scans') {
            setOverviewTab('recent-scans');
            return;
          }
          showOverviewPicker();
        }}
      />

      {overviewTab === 'recent-scans' ? (
        <ScanHistoryPanel embedded showNewScanAction />
      ) : (
        <>
          {isActiveScan ? (
            <Alert
              severity="info"
              sx={{ mb: 2 }}
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={showOverviewScanProgress}
                  sx={{ textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  View scan progress
                </Button>
              }
            >
              Scan in progress
              {primaryPath ? (
                <>
                  {' '}
                  on <strong>{primaryPath}</strong>
                </>
              ) : null}
              . Rankings appear when the scan finishes.
            </Alert>
          ) : null}
          <ScanTargetPanel />
        </>
      )}
    </DsViewLayout>
  );
}
