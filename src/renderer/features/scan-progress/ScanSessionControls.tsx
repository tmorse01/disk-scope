import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import { cancelScanFromStore, startScanFromStore } from '../../stores/scan-store';
import { useScanStore } from '../../hooks/useScanStore';

export function ScanSessionControls() {
  const { status, selectedPath, scanError } = useScanStore();
  const isScanning = status === 'scanning';
  const canStart = Boolean(selectedPath) && !isScanning && status !== 'selecting-target';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, mt: 1 }}>
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
