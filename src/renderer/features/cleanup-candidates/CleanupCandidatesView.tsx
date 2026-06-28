import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate, RiskLevel } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { DsCard } from '../../components/DsCard';
import {
  DsDataTable,
  DsTableBodyRow,
  DsTableHeadRow,
} from '../../components/DsDataTable';
import {
  DsResizableBodyCell,
  DsResizableColumnsProvider,
  DsResizableHeaderCell,
  type ResizableColumnDef,
} from '../../components/DsResizableColumns';
import { DsPageHeader, DsStatusChip } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
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

const CLEANUP_COLUMNS: ResizableColumnDef[] = [
  { id: 'folder', defaultWidth: 280, minWidth: 160 },
  { id: 'category', defaultWidth: 140, minWidth: 88 },
  { id: 'risk', defaultWidth: 120, minWidth: 88 },
  { id: 'sizeBytes', defaultWidth: 108, minWidth: 72 },
  { id: 'recommendation', defaultWidth: 280, minWidth: 160 },
];

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

  const hasTable = hasScanResult && candidates.length > 0;

  return (
    <DsViewLayout
      mode={hasTable ? 'data' : 'page'}
      header={
        <DsPageHeader
          title="Cleanup Candidates"
          subtitle="Developer bloat folders detected during the scan, grouped by reclaimable risk."
        />
      }
    >
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

      {hasTable && (
        <>
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

          <DsCard
            noPadding
            sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
          >
            {toolbar}
            <DsResizableColumnsProvider columns={CLEANUP_COLUMNS}>
              <DsDataTable
                scroll
                noOuterCard
                aria-label="Cleanup candidates"
                header={
                  <DsTableHeadRow>
                    <DsResizableHeaderCell columnId="folder">Folder</DsResizableHeaderCell>
                    <DsResizableHeaderCell columnId="category">Category</DsResizableHeaderCell>
                    <DsResizableHeaderCell columnId="risk">Risk</DsResizableHeaderCell>
                    <DsResizableHeaderCell columnId="sizeBytes" align="right">
                      Size
                    </DsResizableHeaderCell>
                    <DsResizableHeaderCell columnId="recommendation">Why flagged</DsResizableHeaderCell>
                  </DsTableHeadRow>
                }
              >
                <TableBody>
                  {candidates.map((candidate) => {
                    const rowProps = getRowProps(candidateToDeleteTarget(candidate));

                    return (
                      <DsTableBodyRow key={candidate.path} {...rowProps}>
                        <DsResizableBodyCell columnId="folder" multiline title={candidate.path}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
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
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="body2" noWrap sx={{ fontWeight: rowProps.selected ? 700 : 400 }}>
                                {candidate.name}
                              </Typography>
                              <DsTabular
                                sx={{
                                  display: 'block',
                                  color: 'text.secondary',
                                  fontSize: '11px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {candidate.path}
                              </DsTabular>
                            </Box>
                          </Box>
                        </DsResizableBodyCell>
                        <DsResizableBodyCell columnId="category">{candidate.label}</DsResizableBodyCell>
                        <DsResizableBodyCell columnId="risk">
                          <DsStatusChip label={RISK_LABELS[candidate.risk]} variant={RISK_VARIANTS[candidate.risk]} />
                        </DsResizableBodyCell>
                        <DsResizableBodyCell columnId="sizeBytes" align="right">
                          <DsTabular sx={{ fontWeight: 700 }}>{formatBytes(candidate.sizeBytes)}</DsTabular>
                        </DsResizableBodyCell>
                        <DsResizableBodyCell columnId="recommendation">
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {candidate.recommendation}
                          </Typography>
                        </DsResizableBodyCell>
                      </DsTableBodyRow>
                    );
                  })}
                </TableBody>
              </DsDataTable>
            </DsResizableColumnsProvider>
            {contextMenu}
            {deleteConfirmationUi}
          </DsCard>

          <Alert
            severity="info"
            variant="outlined"
            icon={<MaterialIcon name="info" filled aria-hidden={false} />}
            sx={{ flexShrink: 0 }}
          >
            Safe-first approach: DiskScope recommends targets only. Select a row and use the toolbar, or right-click
            for the same actions.
          </Alert>
        </>
      )}
    </DsViewLayout>
  );
}
