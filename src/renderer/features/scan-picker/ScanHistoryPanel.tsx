import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import { DsEmptyState } from '../../components/DsEmptyState';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import { activateScanFromHistory, showOverviewPicker } from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { isDriveRoot, targetIcon, targetTitle } from './scan-target-utils';

function formatScanCompletedAt(completedAt: string): string {
  const date = new Date(completedAt);
  if (Number.isNaN(date.getTime())) {
    return completedAt;
  }

  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type ScanHistoryPanelProps = {
  showNewScanAction?: boolean;
  /** Hides the section header when rendered inside overview tabs. */
  embedded?: boolean;
};

export function ScanHistoryPanel({
  showNewScanAction = false,
  embedded = false,
}: ScanHistoryPanelProps) {
  const { scanHistory, scanId } = useScanStore();

  if (scanHistory.length === 0) {
    if (!embedded) {
      return null;
    }

    return (
      <DsCard sx={{ p: { xs: 2, sm: 3 } }}>
        <DsEmptyState
          icon="history"
          title="No recent scans yet"
          description="Completed scans appear here so you can switch between previous results."
        />
      </DsCard>
    );
  }

  return (
    <DsCard sx={{ p: { xs: 2, sm: 2.5 } }}>
      {!embedded ? (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1.5,
            mb: 2,
          }}
        >
          <Box>
            <Typography variant="h3" component="h2" sx={{ fontSize: '20px', fontWeight: 600 }}>
              Recent scans
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Switch between previous results or start a new scan below.
            </Typography>
          </Box>
          {showNewScanAction ? (
            <Button
              variant="outlined"
              size="medium"
              onClick={showOverviewPicker}
              startIcon={<MaterialIcon name="add" aria-hidden={false} />}
              sx={{
                borderRadius: `${radii.lg}px`,
                textTransform: 'none',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              New scan
            </Button>
          ) : null}
        </Box>
      ) : showNewScanAction ? (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={showOverviewPicker}
            startIcon={<MaterialIcon name="add" aria-hidden={false} />}
            sx={{
              borderRadius: `${radii.lg}px`,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            New scan
          </Button>
        </Box>
      ) : null}

      <List
        dense
        disablePadding
        aria-label="Recent scans"
        sx={{
          border: 1,
          borderColor: 'outlineVariant.main',
          borderRadius: `${radii.lg}px`,
          bgcolor: 'surfaceContainerLowest.main',
          overflow: 'hidden',
        }}
      >
        {scanHistory.map((entry, index) => {
          const { result } = entry;
          const isActive = entry.scanId === scanId;

          return (
            <ListItemButton
              key={entry.scanId}
              selected={isActive}
              onClick={() => activateScanFromHistory(entry.scanId)}
              sx={{
                borderBottom: index < scanHistory.length - 1 ? 1 : 0,
                borderColor: 'outlineVariant.main',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: `${radii.md}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcon
                    name={targetIcon(result.rootPath)}
                    filled={isDriveRoot(result.rootPath)}
                    style={{
                      fontSize: 20,
                      color: isActive
                        ? 'var(--mui-palette-primary-main)'
                        : 'var(--mui-palette-text-secondary)',
                    }}
                  />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <Typography component="span" sx={{ fontWeight: 600 }} noWrap>
                      {targetTitle(result.rootPath)}
                    </Typography>
                    {entry.rootPathMissing ? (
                      <Chip
                        size="small"
                        color="warning"
                        label="Target missing"
                        sx={{ flexShrink: 0, height: 22, fontSize: '11px' }}
                      />
                    ) : null}
                    <DsTabular
                      component="span"
                      sx={{ fontSize: '12px', color: 'text.secondary', flexShrink: 0 }}
                    >
                      {formatBytes(result.totalSizeBytes)}
                    </DsTabular>
                  </Box>
                }
                secondary={
                  <DsTabular
                    component="span"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                    }}
                    title={result.rootPath}
                  >
                    {formatScanCompletedAt(result.completedAt)} · {result.rootPath}
                  </DsTabular>
                }
              />
            </ListItemButton>
          );
        })}
      </List>
    </DsCard>
  );
}
