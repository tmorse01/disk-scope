import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { summarizeCleanupCandidates } from '../../../shared/cleanup-summary';
import { DsCard } from '../../components/DsCard';
import { radii } from '../../theme/tokens';

type CleanupReclaimHeroProps = {
  candidates: CleanupCandidate[];
  mode?: 'overview' | 'detail';
  onOpenCleanup?: () => void;
  onOpenLargestFiles?: () => void;
  onOpenFileTypes?: () => void;
};

function heroPrimaryBytes(summary: ReturnType<typeof summarizeCleanupCandidates>): number {
  if (summary.reclaimableBytesLowRisk > 0) {
    return summary.reclaimableBytesLowRisk;
  }
  return summary.reclaimableBytesAll;
}

function CleanupReclaimFilledHero({
  candidates,
  onOpenCleanup,
}: {
  candidates: CleanupCandidate[];
  onOpenCleanup?: () => void;
}) {
  const primaryBytes = heroPrimaryBytes(summarizeCleanupCandidates(candidates));
  const headline = `You could gain ${formatBytes(primaryBytes)} back`;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        flexShrink: 0,
        bgcolor: 'primary.light',
        color: 'common.white',
        borderRadius: `${radii.lg}px`,
        px: 2,
        py: 1.25,
      }}
    >
      <Typography component="h2" variant="h5" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
        {headline}
      </Typography>
      <Button
        variant="contained"
        size="small"
        onClick={onOpenCleanup}
        sx={{
          flexShrink: 0,
          bgcolor: 'common.white',
          color: 'primary.light',
          fontWeight: 600,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            bgcolor: 'grey.100',
            boxShadow: 'none',
          },
        }}
      >
        View suggestions
      </Button>
    </Box>
  );
}

function CleanupReclaimEmptyHint({
  onOpenLargestFiles,
  onOpenFileTypes,
}: {
  onOpenLargestFiles?: () => void;
  onOpenFileTypes?: () => void;
}) {
  return (
    <DsCard
      sx={{
        bgcolor: 'background.paper',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.surfaceContainerLow?.main ?? '#f3f4f5'} 100%)`,
      }}
    >
      <Typography variant="h3" component="h2" sx={{ fontSize: '18px', fontWeight: 600, mb: 0.5 }}>
        No known temp or cache folders
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This scan did not match cleanup rules for temp or cache folders. For videos, games, and large personal files,
        try{' '}
        <Button
          size="small"
          variant="text"
          onClick={onOpenLargestFiles}
          sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0, verticalAlign: 'baseline' }}
        >
          Largest Files
        </Button>{' '}
        or{' '}
        <Button
          size="small"
          variant="text"
          onClick={onOpenFileTypes}
          sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0, verticalAlign: 'baseline' }}
        >
          File Types
        </Button>
        .
      </Typography>
    </DsCard>
  );
}

export function CleanupReclaimHero({
  candidates,
  mode = 'detail',
  onOpenCleanup,
  onOpenLargestFiles,
  onOpenFileTypes,
}: CleanupReclaimHeroProps) {
  if (mode === 'detail') {
    return null;
  }

  if (candidates.length === 0) {
    return (
      <CleanupReclaimEmptyHint
        onOpenLargestFiles={onOpenLargestFiles}
        onOpenFileTypes={onOpenFileTypes}
      />
    );
  }

  return <CleanupReclaimFilledHero candidates={candidates} onOpenCleanup={onOpenCleanup} />;
}
