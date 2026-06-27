import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import type { NodeId } from '../../../shared/types';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { useShellOverrides } from '../../components/ShellContext';
import { useScanStore } from '../../hooks/useScanStore';
import { buildBreadcrumbPath } from '../largest-folders/folder-tree-utils';
import { DiskMapTreemap } from './DiskMapTreemap';
import { buildTreemapItems } from './disk-map-utils';

export function DiskMapView() {
  const { status, result } = useScanStore();
  const [focusNodeId, setFocusNodeId] = useState<NodeId | null>(null);

  const effectiveFocusId = focusNodeId ?? result?.rootNodeId ?? null;

  const breadcrumb = useMemo(() => {
    if (!result || !effectiveFocusId) {
      return [];
    }

    return buildBreadcrumbPath(effectiveFocusId, result.directoriesById, result.rootNodeId);
  }, [effectiveFocusId, result]);

  const handleFocusChange = useCallback((nodeId: NodeId) => {
    setFocusNodeId(nodeId);
  }, []);

  const shellSegments = useMemo(
    () =>
      breadcrumb.map((node, index) => ({
        id: node.id,
        label: node.name,
        onClick: index < breadcrumb.length - 1 ? () => handleFocusChange(node.id) : undefined,
      })),
    [breadcrumb, handleFocusChange],
  );

  useShellOverrides(result ? shellSegments : [], null);

  const focusedNode = useMemo(() => {
    if (!result || !effectiveFocusId) {
      return null;
    }

    return result.directoriesById[effectiveFocusId] ?? null;
  }, [effectiveFocusId, result]);

  const treemapItems = useMemo(() => {
    if (!result || !focusedNode) {
      return [];
    }

    return buildTreemapItems(focusedNode, result.directoriesById);
  }, [focusedNode, result]);

  if (status === 'scanning') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DsPageHeader
          title="Disk Map"
          subtitle="Visual map of folder sizes from your latest scan."
        />
        <Alert severity="info" variant="outlined">
          Scan in progress — the disk map will update when the scan completes.
        </Alert>
      </Box>
    );
  }

  if (!result) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DsPageHeader
          title="Disk Map"
          subtitle="Visual map of folder sizes from your latest scan."
        />
        <Alert severity="info" variant="outlined">
          Run a scan from Overview to see a treemap of folder sizes here.
        </Alert>
      </Box>
    );
  }

  const focusTotalBytes = focusedNode?.sizeBytes ?? result.totalSizeBytes;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Disk Map"
        subtitle={`Tile area reflects size under ${result.rootPath}. Click a folder to drill in.`}
      />

      <Typography variant="body2" color="text.secondary">
        Colors distinguish folders. The <strong>Files</strong> tile shows direct files in the
        current folder (not files inside subfolders).
      </Typography>

      <DsCard noPadding sx={{ p: 1.5 }}>
        <DiskMapTreemap
          items={treemapItems}
          focusTotalBytes={focusTotalBytes}
          onDirectoryClick={handleFocusChange}
        />
      </DsCard>
    </Box>
  );
}
