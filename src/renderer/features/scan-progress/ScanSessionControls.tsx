import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import { MaterialIcon } from '../../components/MaterialIcon';
import { cancelScanFromStore, startScanFromStore } from '../../stores/scan-store';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { useScanStore } from '../../hooks/useScanStore';

export function ScanSessionControls() {
  const { status, selectedPath, scanError } = useScanStore();
  const { exclusions } = usePreferencesStore();
  const isScanning = status === 'scanning';
  const canStart = Boolean(selectedPath) && !isScanning && status !== 'selecting-target';
  const showActiveExclusions =
    exclusions.length > 0 && !isScanning && status !== 'completed' && status !== 'cancelled';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 1 }}>
      {showActiveExclusions ? (
        <Box
          aria-label="Active scan exclusions"
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            width: '100%',
            maxWidth: '36rem',
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Active exclusions ({exclusions.length})
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
            {exclusions.map((exclusion) => (
              <Chip
                key={exclusion.id}
                size="small"
                label={exclusion.value}
                icon={
                  <MaterialIcon
                    name={exclusion.kind === 'path' ? 'folder_off' : 'block'}
                    style={{ fontSize: 16 }}
                  />
                }
                sx={{ maxWidth: '100%' }}
              />
            ))}
          </Box>
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!canStart}
          onClick={() => void startScanFromStore()}
          sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
        >
          {isScanning ? 'Scanning…' : 'Start scan'}
        </Button>
        {isScanning ? (
          <Button
            variant="outlined"
            color="warning"
            onClick={() => void cancelScanFromStore()}
            sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
          >
            Cancel scan
          </Button>
        ) : null}
      </Box>

      {scanError ? <Alert severity="error">{scanError}</Alert> : null}
    </Box>
  );
}
