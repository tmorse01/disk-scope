import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate, RiskLevel } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import {
  DsDataTable,
  DsTableBodyRow,
  DsTableHeadRow,
  TableCell as DsTableCell,
} from '../../components/DsDataTable';
import { DsPageHeader, DsStatusChip } from '../../components/DsStatusChip';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import { radii } from '../../theme/tokens';
import type { DeleteTarget } from '../file-actions/delete-target';
import { useSelectableFileActions } from '../file-actions/useSelectableFileActions';

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Minimal',
  medium: 'Moderate',
  high: 'High',
  'do-not-touch': 'Do not touch',
};

const RISK_VARIANTS: Record<RiskLevel, 'success' | 'warning' | 'error' | 'neutral'> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  'do-not-touch': 'neutral',
};

function candidateToDeleteTarget(candidate: CleanupCandidate): DeleteTarget {
  return {
    path: candidate.path,
    name: candidate.name,
    kind: 'directory',
    sizeBytes: candidate.sizeBytes,
    childFileCount: candidate.fileCount,
    risk: candidate.risk,
  };
}

export function CleanupCandidatesView() {
  const { status, result } = useScanStore();
  const candidates = result?.cleanupCandidates ?? [];
  const hasScanResult = status === 'completed' || status === 'cancelled';
  const totalReclaimable = candidates.reduce((sum, candidate) => sum + candidate.sizeBytes, 0);
  const { getRowProps, toolbar, contextMenu, deleteConfirmationUi } = useSelectableFileActions();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <DsPageHeader
        title="Cleanup Candidates"
        subtitle="Developer bloat folders detected during the scan, grouped by reclaimable risk."
      />

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
          <DsCard
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.contrastText',
              border: 'none',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 200,
            }}
          >
            <Box sx={{ position: 'absolute', top: 16, right: 16, opacity: 0.1 }}>
              <MaterialIcon name="delete_sweep" style={{ fontSize: 160 }} />
            </Box>
            <Typography variant="h3" sx={{ opacity: 0.85, mb: 1 }}>
              Cleanup readiness
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="h1" sx={{ fontWeight: 800, lineHeight: 1 }}>
                {formatBytes(totalReclaimable)}
              </Typography>
              <Typography variant="h3" sx={{ opacity: 0.85 }}>
                potential reclaimable space
              </Typography>
            </Box>
            <Typography variant="body1" sx={{ mt: 2, maxWidth: 520, opacity: 0.9 }}>
              {candidates.length} folder{candidates.length === 1 ? '' : 's'} matched developer cleanup
              rules. Review each item before removing — use Reveal or Copy path to inspect safely.
            </Typography>
          </DsCard>

          <DsCard noPadding sx={{ overflow: 'hidden' }}>
            {toolbar}
            <DsDataTable
              noOuterCard
              aria-label="Cleanup candidates"
              header={
                <DsTableHeadRow>
                  <DsTableCell>Folder</DsTableCell>
                  <DsTableCell>Category</DsTableCell>
                  <DsTableCell>Risk</DsTableCell>
                  <DsTableCell align="right">Size</DsTableCell>
                  <DsTableCell>Why flagged</DsTableCell>
                </DsTableHeadRow>
              }
            >
              <TableBody>
                {candidates.map((candidate) => {
                  const rowProps = getRowProps(candidateToDeleteTarget(candidate));

                  return (
                    <DsTableBodyRow key={candidate.path} {...rowProps}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: `${radii.lg}px`,
                              bgcolor: 'surfaceContainerHighest.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MaterialIcon name="folder_zip" style={{ color: 'var(--mui-palette-primary-main)' }} />
                          </Box>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: rowProps.selected ? 700 : 400 }}>
                              {candidate.name}
                            </Typography>
                            <DsTabular sx={{ color: 'text.secondary', fontSize: '11px', wordBreak: 'break-all' }}>
                              {candidate.path}
                            </DsTabular>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{candidate.label}</TableCell>
                      <TableCell>
                        <DsStatusChip label={RISK_LABELS[candidate.risk]} variant={RISK_VARIANTS[candidate.risk]} />
                      </TableCell>
                      <TableCell align="right">
                        <DsTabular sx={{ fontWeight: 700 }}>{formatBytes(candidate.sizeBytes)}</DsTabular>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 280 }}>
                        <Typography variant="body2" color="text.secondary">
                          {candidate.recommendation}
                        </Typography>
                      </TableCell>
                    </DsTableBodyRow>
                  );
                })}
              </TableBody>
            </DsDataTable>
            {contextMenu}
            {deleteConfirmationUi}
          </DsCard>

          <Alert severity="info" variant="outlined" icon={<MaterialIcon name="info" filled aria-hidden={false} />}>
            Safe-first approach: DiskScope recommends targets only. Select a row and use the toolbar, or right-click
            for the same actions.
          </Alert>
        </>
      )}
    </Box>
  );
}
