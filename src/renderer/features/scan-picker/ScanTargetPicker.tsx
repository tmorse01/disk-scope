import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { ScanTargetPanel } from './ScanTargetPanel';

/** @deprecated Use ScanTargetPanel on Overview instead. */
export function ScanTargetPicker() {
  return (
    <Box
      component="section"
      aria-labelledby="scan-target-heading"
      sx={{ maxWidth: '42rem', mx: 'auto', mt: 2 }}
    >
      <Typography
        id="scan-target-heading"
        variant="caption"
        component="h2"
        sx={{ fontWeight: 600, letterSpacing: '0.02em', textTransform: 'uppercase', mb: 1, display: 'block' }}
      >
        Scan target
      </Typography>
      <ScanTargetPanel />
    </Box>
  );
}
