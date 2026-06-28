import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import type { CleanupCandidate, CleanupCandidateCategory, RiskLevel } from '../../../shared/types';
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
import { DeleteDustIcon } from '../../components/delete-dust-sx';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useShellContext } from '../../components/ShellContext';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
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

const CATEGORY_LABELS: Record<CleanupCandidateCategory, string> = {
  general: 'General',
  developer: 'Developer',
};

const CLEANUP_COLUMNS: ResizableColumnDef[] = [
  { id: 'folder', defaultWidth: 260, minWidth: 160 },
  { id: 'category', defaultWidth: 100, minWidth: 72 },
  { id: 'type', defaultWidth: 140, minWidth: 88 },
  { id: 'risk', defaultWidth: 120, minWidth: 88 },
  { id: 'sizeBytes', defaultWidth: 108, minWidth: 72 },
  { id: 'recommendation', defaultWidth: 260, minWidth: 160 },
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
  const { status, result, developerCleanupEnabledAtScan } = useScanStore();
  const { developerCleanupEnabled } = usePreferencesStore();
  const { navigateTo } = useShellContext();
  const candidates = result?.cleanupCandidates ?? [];
  const hasScanResult = status === 'completed' || status === 'cancelled';
  const needsRescan =
    hasScanResult &&
    developerCleanupEnabledAtScan !== null &&
    developerCleanupEnabledAtScan !== developerCleanupEnabled;
  const { getRowProps, toolbar, contextMenu, deleteConfirmationUi } = useSelectableFileActions();
  const hasTable = hasScanResult && candidates.length > 0;

  return (
    <DsViewLayout
      mode={hasTable ? 'data' : 'page'}
      header={
        <DsPageHeader
          title="Cleanup suggestions"
          subtitle="Known temp and cache folders from your scan. Review each item before removing."
        />
      }
    >
      {needsRescan ? (
        <Alert severity="info" variant="outlined" sx={{ flexShrink: 0 }}>
          Developer cleanup detection changed since this scan. Run a new scan to update cleanup
          suggestions.
        </Alert>
      ) : null}

      {!hasScanResult && (
        <Alert severity="info" variant="outlined">
          Run a scan to identify temp folders and other known cleanup targets.
        </Alert>
      )}

      {hasScanResult && candidates.length === 0 && (
        <Alert severity="success" variant="outlined">
          No known temp or cache folders were found in the scanned path. For videos, games, and
          large personal files, try{' '}
          <Button
            size="small"
            variant="text"
            onClick={() => navigateTo('largest-files')}
            sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            Largest Files
          </Button>{' '}
          or{' '}
          <Button
            size="small"
            variant="text"
            onClick={() => navigateTo('file-types')}
            sx={{ textTransform: 'none', fontWeight: 600, p: 0, minWidth: 0, verticalAlign: 'baseline' }}
          >
            File Types
          </Button>
          .
        </Alert>
      )}

      {hasTable && (
        <>
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
                    <DsResizableHeaderCell columnId="category">Source</DsResizableHeaderCell>
                    <DsResizableHeaderCell columnId="type">Category</DsResizableHeaderCell>
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
                            <DeleteDustIcon dissolving={Boolean(rowProps.dissolving)}>
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
                            </DeleteDustIcon>
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
                        <DsResizableBodyCell columnId="category">
                          {CATEGORY_LABELS[candidate.category]}
                        </DsResizableBodyCell>
                        <DsResizableBodyCell columnId="type">{candidate.label}</DsResizableBodyCell>
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
