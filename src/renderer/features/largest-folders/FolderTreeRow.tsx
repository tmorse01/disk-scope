import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { memo, type MouseEvent } from 'react';
import type { DirectoryNode } from '../../../shared/types';
import { formatBytes } from '../../../shared/format-bytes';
import { DsTableBodyRow } from '../../components/DsDataTable';
import { DsResizableBodyCell } from '../../components/DsResizableColumns';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { DeleteTarget } from '../file-actions/delete-target';
import { fileIconForExtension } from '../largest-files/file-icon-utils';
import {
  getCleanupCandidateForPath,
  getFolderGridRiskHint,
} from './folder-cleanup-hint';
import { FolderRiskHintCell } from './FolderRiskHintCell';
import { FolderTreeExpandButton, FolderTreeExpandSpacer } from './FolderTreeExpandButton';
import {
  formatFolderContentsSummary,
  formatFolderContentsTitle,
  formatPercentOfRoot,
  percentOfRoot,
  type FlatDirectoryRow,
  type FlatFileRow,
  type FlatFilesGroupRow,
  type FlatFilesTruncatedRow,
  type FlatTreeRow,
} from './folder-tree-utils';

type RowSelectionProps = {
  selected: boolean;
  onSelect: () => void;
  onContextMenu: (event: MouseEvent) => void;
};

type DirectoryRowProps = RowSelectionProps & {
  row: FlatDirectoryRow;
  totalSizeBytes: number;
  riskReferenceDate: Date | undefined;
  cleanupCandidatesByPath: Map<string, import('../../../shared/types').CleanupCandidate>;
  onToggleExpand: (nodeId: string) => void;
  onDrillDown: (nodeId: string) => void;
};

type FilesGroupRowProps = {
  row: FlatFilesGroupRow;
  onToggleExpand: (nodeId: string, parentPath: string) => void;
};

type FileRowProps = RowSelectionProps & {
  row: FlatFileRow;
  riskReferenceDate: Date | undefined;
  cleanupCandidatesByPath: Map<string, import('../../../shared/types').CleanupCandidate>;
};

type FilesTruncatedRowProps = {
  row: FlatFilesTruncatedRow;
};

function FolderTreeContentsCell({ summary, title }: { summary: string; title: string }) {
  return (
    <DsResizableBodyCell columnId="contents" align="right" title={title}>
      <DsTabular>{summary}</DsTabular>
    </DsResizableBodyCell>
  );
}

function FolderTreeContentsEmptyCell() {
  return (
    <DsResizableBodyCell columnId="contents" align="right">
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    </DsResizableBodyCell>
  );
}

export const FolderTreeDirectoryRow = memo(function FolderTreeDirectoryRow({
  row,
  selected,
  totalSizeBytes,
  riskReferenceDate,
  cleanupCandidatesByPath,
  onSelect,
  onContextMenu,
  onToggleExpand,
  onDrillDown,
}: DirectoryRowProps) {
  const { nodeId, node, depth, hasChildren, isExpanded } = row;
  const percent = percentOfRoot(node.sizeBytes, totalSizeBytes);
  const riskHint = getFolderGridRiskHint({
    cleanupCandidatesByPath,
    path: node.path,
    modifiedAt: node.modifiedAt,
    referenceDate: riskReferenceDate,
  });

  return (
    <DsTableBodyRow
      selected={selected}
      onClick={onSelect}
      onContextMenu={onContextMenu}
      onDoubleClick={() => onDrillDown(nodeId)}
    >
      <DsResizableBodyCell columnId="name" multiline title={node.path}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: depth * 2, minWidth: 0 }}>
          {hasChildren ? (
            <FolderTreeExpandButton
              expanded={isExpanded}
              label={isExpanded ? 'Collapse folder' : 'Expand folder'}
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpand(nodeId);
              }}
            />
          ) : (
            <FolderTreeExpandSpacer />
          )}
          <MaterialIcon name="folder" style={{ fontSize: 18, flexShrink: 0 }} />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              noWrap
              title={node.path}
              sx={{ fontWeight: selected ? 600 : 400 }}
            >
              {node.name}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, percent)}
              aria-hidden
              sx={{
                mt: 0.5,
                height: 4,
                borderRadius: 999,
                bgcolor: 'surfaceContainer.main',
                '& .MuiLinearProgress-bar': { borderRadius: 999 },
              }}
            />
          </Box>
        </Box>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="sizeBytes" align="right">
        <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(node.sizeBytes)}</DsTabular>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="percentOfRoot" align="right">
        <DsTabular>{formatPercentOfRoot(node.sizeBytes, totalSizeBytes)}</DsTabular>
      </DsResizableBodyCell>
      <FolderTreeContentsCell
        summary={formatFolderContentsSummary(node.directoryCount, node.fileCount)}
        title={formatFolderContentsTitle(node.directoryCount, node.fileCount)}
      />
      <DsResizableBodyCell columnId="risk" align="right">
        <FolderRiskHintCell hint={riskHint} />
      </DsResizableBodyCell>
    </DsTableBodyRow>
  );
});

export const FolderTreeFilesGroupRow = memo(function FolderTreeFilesGroupRow({
  row,
  onToggleExpand,
}: FilesGroupRowProps) {
  return (
    <DsTableBodyRow onClick={() => onToggleExpand(row.nodeId, row.parentPath)}>
      <DsResizableBodyCell columnId="name" multiline>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: row.depth * 2 }}>
          <FolderTreeExpandButton
            expanded={row.isExpanded}
            loading={row.isLoading}
            label={row.isExpanded ? 'Collapse files group' : 'Expand files group'}
            onClick={(event) => {
              event.stopPropagation();
              onToggleExpand(row.nodeId, row.parentPath);
            }}
          />
          <MaterialIcon name="draft" style={{ fontSize: 18, flexShrink: 0 }} />
          <Typography variant="body2" sx={{ fontWeight: 500, fontStyle: 'italic' }}>
            &lt;Files&gt;
          </Typography>
        </Box>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="sizeBytes" align="right">
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="percentOfRoot" align="right">
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      </DsResizableBodyCell>
      <FolderTreeContentsCell
        summary={formatFolderContentsSummary(0, row.fileCount)}
        title={formatFolderContentsTitle(0, row.fileCount)}
      />
      <DsResizableBodyCell columnId="risk" align="right">
        <FolderRiskHintCell hint={null} />
      </DsResizableBodyCell>
    </DsTableBodyRow>
  );
});

export const FolderTreeFileRow = memo(function FolderTreeFileRow({
  row,
  selected,
  riskReferenceDate,
  cleanupCandidatesByPath,
  onSelect,
  onContextMenu,
}: FileRowProps) {
  const extension = row.entry.name.includes('.') ? `.${row.entry.name.split('.').pop()}` : null;
  const riskHint = getFolderGridRiskHint({
    cleanupCandidatesByPath,
    path: row.entry.path,
    modifiedAt: row.entry.modifiedAt,
    referenceDate: riskReferenceDate,
  });

  return (
    <DsTableBodyRow selected={selected} onClick={onSelect} onContextMenu={onContextMenu}>
      <DsResizableBodyCell columnId="name" title={row.entry.path}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: row.depth * 2, minWidth: 0 }}>
          <FolderTreeExpandSpacer />
          <MaterialIcon
            name={fileIconForExtension(extension)}
            style={{ fontSize: 18, flexShrink: 0 }}
          />
          <Typography variant="body2" noWrap sx={{ fontWeight: selected ? 600 : 400 }}>
            {row.entry.name}
          </Typography>
        </Box>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="sizeBytes" align="right">
        <DsTabular sx={{ fontWeight: 600 }}>{formatBytes(row.entry.sizeBytes)}</DsTabular>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="percentOfRoot" align="right">
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      </DsResizableBodyCell>
      <FolderTreeContentsEmptyCell />
      <DsResizableBodyCell columnId="risk" align="right">
        <FolderRiskHintCell hint={riskHint} />
      </DsResizableBodyCell>
    </DsTableBodyRow>
  );
});

export const FolderTreeFilesTruncatedRow = memo(function FolderTreeFilesTruncatedRow({
  row,
}: FilesTruncatedRowProps) {
  const hiddenCount = row.totalFileCount - row.visibleCount;

  return (
    <DsTableBodyRow>
      <DsResizableBodyCell columnId="name">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pl: row.depth * 2 }}>
          <FolderTreeExpandSpacer />
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            … and {hiddenCount.toLocaleString()} more file{hiddenCount === 1 ? '' : 's'}
          </Typography>
        </Box>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="sizeBytes" align="right">
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      </DsResizableBodyCell>
      <DsResizableBodyCell columnId="percentOfRoot" align="right">
        <Typography variant="body2" color="text.disabled">
          —
        </Typography>
      </DsResizableBodyCell>
      <FolderTreeContentsEmptyCell />
      <DsResizableBodyCell columnId="risk" align="right">
        <FolderRiskHintCell hint={null} />
      </DsResizableBodyCell>
    </DsTableBodyRow>
  );
});

export type FolderTreeRowProps = {
  row: FlatTreeRow;
  selectedPath: string | null;
  totalSizeBytes: number;
  riskReferenceDate: Date | undefined;
  cleanupCandidatesByPath: Map<string, import('../../../shared/types').CleanupCandidate>;
  onToggleExpand: (nodeId: string, parentPath?: string) => void;
  onDrillDown: (nodeId: string) => void;
  onSelectTarget: (target: DeleteTarget) => void;
  onRowContextMenu: (event: MouseEvent, target: DeleteTarget) => void;
  directoryToDeleteTarget: (
    node: DirectoryNode,
    cleanupCandidate?: import('../../../shared/types').CleanupCandidate,
  ) => DeleteTarget;
  fileEntryToDeleteTarget: (row: FlatFileRow) => DeleteTarget;
};

export const FolderTreeRow = memo(function FolderTreeRow({
  row,
  selectedPath,
  totalSizeBytes,
  riskReferenceDate,
  cleanupCandidatesByPath,
  onToggleExpand,
  onDrillDown,
  onSelectTarget,
  onRowContextMenu,
  directoryToDeleteTarget,
  fileEntryToDeleteTarget,
}: FolderTreeRowProps) {
  if (row.kind === 'directory') {
    const cleanupCandidate = getCleanupCandidateForPath(cleanupCandidatesByPath, row.node.path);
    const target = directoryToDeleteTarget(row.node, cleanupCandidate);

    return (
      <FolderTreeDirectoryRow
        row={row}
        selected={selectedPath === row.node.path}
        totalSizeBytes={totalSizeBytes}
        riskReferenceDate={riskReferenceDate}
        cleanupCandidatesByPath={cleanupCandidatesByPath}
        onSelect={() => onSelectTarget(target)}
        onContextMenu={(event) => onRowContextMenu(event, target)}
        onToggleExpand={(nodeId) => onToggleExpand(nodeId)}
        onDrillDown={onDrillDown}
      />
    );
  }

  if (row.kind === 'files-group') {
    return <FolderTreeFilesGroupRow row={row} onToggleExpand={onToggleExpand} />;
  }

  if (row.kind === 'files-truncated') {
    return <FolderTreeFilesTruncatedRow row={row} />;
  }

  const target = fileEntryToDeleteTarget(row);

  return (
    <FolderTreeFileRow
      row={row}
      selected={selectedPath === row.entry.path}
      riskReferenceDate={riskReferenceDate}
      cleanupCandidatesByPath={cleanupCandidatesByPath}
      onSelect={() => onSelectTarget(target)}
      onContextMenu={(event) => onRowContextMenu(event, target)}
    />
  );
});
