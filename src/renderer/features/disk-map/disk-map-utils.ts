import type { DirectoryNode, NodeId } from '../../../shared/types';

export const MAX_VISIBLE_FOLDER_TILES = 39;
export const OTHER_TILE_ID = '__other__';

export type TreemapItemKind = 'directory' | 'files' | 'other';

export type TreemapItem = {
  id: string;
  kind: TreemapItemKind;
  name: string;
  path: string;
  sizeBytes: number;
  omittedCount?: number;
  omittedNames?: string[];
};

export function filesGroupId(parentId: NodeId): NodeId {
  return `${parentId}::__files__`;
}

/** Direct file bytes in a folder (subtree total minus child folder totals). */
export function directFilesBytes(
  node: DirectoryNode,
  directoriesById: Record<NodeId, DirectoryNode>,
): number {
  const childDirBytes = node.childDirectoryIds.reduce((sum, childId) => {
    const child = directoriesById[childId];
    return child ? sum + child.sizeBytes : sum;
  }, 0);

  return Math.max(0, node.sizeBytes - childDirBytes);
}

export function buildTreemapItems(
  focusNode: DirectoryNode,
  directoriesById: Record<NodeId, DirectoryNode>,
  maxFolderTiles = MAX_VISIBLE_FOLDER_TILES,
): TreemapItem[] {
  const filesBytes = directFilesBytes(focusNode, directoriesById);
  const hasFilesTile = filesBytes > 0 && focusNode.fileCount > 0;

  const childDirs = focusNode.childDirectoryIds
    .map((childId) => directoriesById[childId])
    .filter((node): node is DirectoryNode => node != null && node.sizeBytes > 0)
    .sort((a, b) => b.sizeBytes - a.sizeBytes);

  const folderSlotBudget = hasFilesTile ? maxFolderTiles - 1 : maxFolderTiles;
  const visibleDirs = childDirs.slice(0, folderSlotBudget);
  const omittedDirs = childDirs.slice(folderSlotBudget);

  const items: TreemapItem[] = visibleDirs.map((node) => ({
    id: node.id,
    kind: 'directory',
    name: node.name,
    path: node.path,
    sizeBytes: node.sizeBytes,
  }));

  if (omittedDirs.length > 0) {
    const otherBytes = omittedDirs.reduce((sum, node) => sum + node.sizeBytes, 0);
    items.push({
      id: OTHER_TILE_ID,
      kind: 'other',
      name: 'Other',
      path: focusNode.path,
      sizeBytes: otherBytes,
      omittedCount: omittedDirs.length,
      omittedNames: omittedDirs.slice(0, 5).map((node) => node.name),
    });
  }

  if (hasFilesTile) {
    items.push({
      id: filesGroupId(focusNode.id),
      kind: 'files',
      name: 'Files',
      path: focusNode.path,
      sizeBytes: filesBytes,
    });
  }

  return items.sort((a, b) => b.sizeBytes - a.sizeBytes);
}
