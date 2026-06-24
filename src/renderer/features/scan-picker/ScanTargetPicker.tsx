import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { pickScanTarget } from '../../stores/scan-store';
import { useScanStore } from '../../hooks/useScanStore';

export function ScanTargetPicker() {
  const { status, selectedPath, pickerError } = useScanStore();
  const isSelecting = status === 'selecting-target';

  return (
    <Box
      component="section"
      aria-labelledby="scan-target-heading"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1.5,
        maxWidth: '36rem',
        mx: 'auto',
        mt: 2,
        p: 2,
        border: 1,
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.default',
        textAlign: 'left',
      }}
    >
      <Typography
        id="scan-target-heading"
        variant="caption"
        component="h2"
        sx={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase' }}
      >
        Scan target
      </Typography>

      <Button
        variant="contained"
        onClick={() => void pickScanTarget()}
        disabled={isSelecting}
        sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
      >
        {isSelecting ? 'Opening folder picker…' : 'Select folder'}
      </Button>

      {selectedPath ? (
        <Typography
          data-testid="selected-path"
          variant="body2"
          sx={{ wordBreak: 'break-all', color: 'text.primary' }}
        >
          {selectedPath}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          No folder selected yet.
        </Typography>
      )}

      {pickerError ? <Alert severity="error">{pickerError}</Alert> : null}
    </Box>
  );
}
