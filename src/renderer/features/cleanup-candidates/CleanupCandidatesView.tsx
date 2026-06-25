import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate, RiskLevel } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';

const RISK_ORDER: RiskLevel[] = ['low', 'medium', 'high', 'do-not-touch'];

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low risk',
  medium: 'Medium risk',
  high: 'High risk',
  'do-not-touch': 'Do not touch',
};

type ReclaimableByRisk = Record<RiskLevel, { count: number; sizeBytes: number }>;

function summarizeReclaimableByRisk(candidates: CleanupCandidate[]): ReclaimableByRisk {
  const totals: ReclaimableByRisk = {
    low: { count: 0, sizeBytes: 0 },
    medium: { count: 0, sizeBytes: 0 },
    high: { count: 0, sizeBytes: 0 },
    'do-not-touch': { count: 0, sizeBytes: 0 },
  };

  for (const candidate of candidates) {
    totals[candidate.risk].count += 1;
    totals[candidate.risk].sizeBytes += candidate.sizeBytes;
  }

  return totals;
}

const RISK_CHIP_COLORS: Record<
  RiskLevel,
  'success' | 'warning' | 'error' | 'default'
> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  'do-not-touch': 'default',
};

function RiskSummaryCards({ candidates }: { candidates: CleanupCandidate[] }) {
  const totals = summarizeReclaimableByRisk(candidates);

  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={1.5}
      useFlexGap
      sx={{ flexWrap: 'wrap' }}
    >
      {RISK_ORDER.map((risk) => {
        const entry = totals[risk];
        if (entry.count === 0) {
          return null;
        }

        return (
          <Card key={risk} variant="outlined" sx={{ minWidth: 160, flex: '1 1 160px' }}>
            <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="overline" color="text.secondary">
                {RISK_LABELS[risk]}
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {formatBytes(entry.sizeBytes)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {entry.count} folder{entry.count === 1 ? '' : 's'}
              </Typography>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}

async function revealCandidatePath(candidatePath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.revealPath(candidatePath);
}

async function copyCandidatePath(candidatePath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.copyPath(candidatePath);
}

function CandidateActions({ candidatePath }: { candidatePath: string }) {
  return (
    <Stack direction="row" spacing={0.5}>
      <Tooltip title="Reveal in file explorer">
        <IconButton
          size="small"
          aria-label="Reveal in file explorer"
          onClick={() => {
            void revealCandidatePath(candidatePath);
          }}
        >
          <MaterialIcon name="folder_open" />
        </IconButton>
      </Tooltip>
      <Tooltip title="Copy path">
        <IconButton
          size="small"
          aria-label="Copy path"
          onClick={() => {
            void copyCandidatePath(candidatePath);
          }}
        >
          <MaterialIcon name="content_copy" />
        </IconButton>
      </Tooltip>
    </Stack>
  );
}

function CandidatesTable({ candidates }: { candidates: CleanupCandidate[] }) {
  return (
    <TableContainer>
      <Table size="small" aria-label="Cleanup candidates">
        <TableHead>
          <TableRow>
            <TableCell>Folder</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Risk</TableCell>
            <TableCell align="right">Size</TableCell>
            <TableCell>Why flagged</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {candidates.map((candidate) => (
            <TableRow key={candidate.path} hover>
              <TableCell>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {candidate.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
                >
                  {candidate.path}
                </Typography>
              </TableCell>
              <TableCell>{candidate.label}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={RISK_LABELS[candidate.risk]}
                  color={RISK_CHIP_COLORS[candidate.risk]}
                  variant="outlined"
                />
              </TableCell>
              <TableCell align="right">{formatBytes(candidate.sizeBytes)}</TableCell>
              <TableCell sx={{ maxWidth: 280 }}>
                <Typography variant="body2" color="text.secondary">
                  {candidate.recommendation}
                </Typography>
              </TableCell>
              <TableCell align="right">
                <CandidateActions candidatePath={candidate.path} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export function CleanupCandidatesView() {
  const { status, result } = useScanStore();
  const candidates = result?.cleanupCandidates ?? [];
  const hasScanResult = status === 'completed' || status === 'cancelled';

  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Cleanup Candidates
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Developer bloat folders detected during the scan, grouped by reclaimable risk.
          </Typography>
        </Box>

        {!hasScanResult && (
          <Alert severity="info" variant="outlined">
            Run a scan to identify cleanup candidates such as package caches and build output.
          </Alert>
        )}

        {hasScanResult && candidates.length === 0 && (
          <Alert severity="success" variant="outlined">
            No known developer cleanup folders were found in the scanned path.
          </Alert>
        )}

        {hasScanResult && candidates.length > 0 && (
          <>
            <RiskSummaryCards candidates={candidates} />
            <CandidatesTable candidates={candidates} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
