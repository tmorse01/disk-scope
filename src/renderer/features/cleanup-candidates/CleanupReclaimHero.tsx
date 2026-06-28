import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { summarizeCleanupCandidates } from '../../../shared/cleanup-summary';
import { DsCard } from '../../components/DsCard';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { radii } from '../../theme/tokens';

const PREVIEW_CANDIDATE_LIMIT = 3;

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
  mode,
  onOpenCleanup,
}: {
  candidates: CleanupCandidate[];
  mode: 'overview' | 'detail';
  onOpenCleanup?: () => void;
}) {
  const summary = summarizeCleanupCandidates(candidates);
  const primaryBytes = heroPrimaryBytes(summary);
  const showSecondaryTotal =
    summary.reclaimableBytesLowRisk > 0 &&
    summary.reclaimableBytesAll > summary.reclaimableBytesLowRisk;
  const previewCandidates = candidates.slice(0, PREVIEW_CANDIDATE_LIMIT);
  const isInteractive = mode === 'overview' && onOpenCleanup !== undefined;
  const title = mode === 'overview' ? 'You could reclaim' : 'Cleanup readiness';

  const content = (
    <>
      <Box sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.1 }}>
        <MaterialIcon name="delete_sweep" style={{ fontSize: 160 }} />
      </Box>
      <Typography variant="h3" sx={{ opacity: 0.85, mb: 1 }}>
        {title}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="h1" sx={{ fontWeight: 800, lineHeight: 1 }}>
          {formatBytes(primaryBytes)}
        </Typography>
        <Typography variant="h3" sx={{ opacity: 0.85 }}>
          {summary.reclaimableBytesLowRisk > 0 ? 'from low-risk cleanup targets' : 'potential reclaimable space'}
        </Typography>
      </Box>
      {showSecondaryTotal ? (
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.85 }}>
          Up to {formatBytes(summary.reclaimableBytesAll)} including items that need review.
        </Typography>
      ) : null}
      <Typography variant="body1" sx={{ mt: 2, maxWidth: 560, opacity: 0.9 }}>
        {summary.candidateCount} folder{summary.candidateCount === 1 ? '' : 's'} matched cleanup rules.
        {mode === 'overview'
          ? ' Open cleanup suggestions to review the largest items first.'
          : ' Review each item before removing — use Reveal or Copy path to inspect safely.'}
      </Typography>
      {previewCandidates.length > 0 ? (
        <Box
          component="ul"
          sx={{
            mt: 2,
            mb: 0,
            pl: 2.5,
            maxWidth: 560,
            opacity: 0.92,
            '& li': { mb: 0.5 },
          }}
        >
          {previewCandidates.map((candidate) => (
            <Box component="li" key={candidate.path}>
              <Typography component="span" variant="body2" sx={{ fontWeight: 600 }}>
                {candidate.name}
              </Typography>
              <Typography component="span" variant="body2" sx={{ opacity: 0.85 }}>
                {' '}
                · {candidate.label} ·{' '}
              </Typography>
              <DsTabular component="span" sx={{ fontSize: 'inherit', fontWeight: 700 }}>
                {formatBytes(candidate.sizeBytes)}
              </DsTabular>
            </Box>
          ))}
        </Box>
      ) : null}
      {isInteractive ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 2, opacity: 0.9 }}>
          <MaterialIcon name="arrow_forward" aria-hidden={false} />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            View cleanup suggestions
          </Typography>
        </Box>
      ) : null}
    </>
  );

  if (isInteractive) {
    return (
      <Box
        component="button"
        type="button"
        onClick={onOpenCleanup}
        aria-label={`You could reclaim ${formatBytes(primaryBytes)}. View cleanup suggestions.`}
        sx={{
          flexShrink: 0,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          border: 'none',
          borderRadius: `${radii.xl}px`,
          position: 'relative',
          overflow: 'hidden',
          minHeight: 200,
          width: '100%',
          p: 3,
          textAlign: 'left',
          cursor: 'pointer',
          transition: (theme) =>
            theme.transitions.create(['transform', 'box-shadow'], {
              duration: theme.transitions.duration.short,
            }),
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: 4,
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.contrastText',
            outlineOffset: 2,
          },
        }}
      >
        {content}
      </Box>
    );
  }

  return (
    <DsCard
      sx={{
        flexShrink: 0,
        bgcolor: 'primary.light',
        color: 'primary.contrastText',
        border: 'none',
        position: 'relative',
        overflow: 'hidden',
        minHeight: 200,
      }}
    >
      {content}
    </DsCard>
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
  if (candidates.length === 0) {
    if (mode !== 'overview') {
      return null;
    }

    return (
      <CleanupReclaimEmptyHint
        onOpenLargestFiles={onOpenLargestFiles}
        onOpenFileTypes={onOpenFileTypes}
      />
    );
  }

  return (
    <CleanupReclaimFilledHero candidates={candidates} mode={mode} onOpenCleanup={onOpenCleanup} />
  );
}
