import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { DsStatusChip } from '../../components/DsStatusChip';
import type { FolderGridRiskHint } from './folder-cleanup-hint';

export function FolderRiskHintCell({ hint }: { hint: FolderGridRiskHint | null }) {
  if (!hint) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  return (
    <Box title={hint.title}>
      <DsStatusChip label={hint.label} variant={hint.variant} />
    </Box>
  );
}
