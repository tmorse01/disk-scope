import type { DirectoryNode, NodeId } from '../../../shared/types';

export type FolderSortColumn =
  | 'name'
  | 'sizeBytes'
  | 'percentOfRoot'
  | 'fileCount'
  | 'directoryCount'
  | 'modifiedAt';

export type SortDirection = 'asc' | 'desc';

export type FlatFolderRow = {
  nodeId: NodeId;
  node: DirectoryNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

export const DEFAULT_FOLDER_SORT_COLUMN: FolderSortColumn = 'sizeBytes';
export const DEFAULT_FOLDER_SORT_DIRECTION: SortDirection = 'desc';

/** Share of scan root total size (0–100). */
export function percentOfRoot(sizeBytes: number, rootTotalBytes: number): number {
  if (rootTotalBytes <= 0 || !Number.isFinite(sizeBytes)) {
    return 0;
  }

  return (sizeBytes / rootTotalBytes) * 100;
}

export function formatPercentOfRoot(sizeBytes: number, rootTotalBytes: number): string {
  return `${percentOfRoot(sizeBytes, rootTotalBytes).toFixed(1)}%`;
}

export function compareDirectoryNodes(
  a: DirectoryNode,
  b: DirectoryNode,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
): number {
  let comparison = 0;

  switch (column) {
    case 'name':
      comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      break;
    case 'sizeBytes':
      comparison = a.sizeBytes - b.sizeBytes;
      break;
    case 'percentOfRoot':
      comparison =
        percentOfRoot(a.sizeBytes, rootTotalBytes) - percentOfRoot(b.sizeBytes, rootTotalBytes);
      break;
    case 'fileCount':
      comparison = a.fileCount - b.fileCount;
      break;
    case 'directoryCount':
      comparison = a.directoryCount - b.directoryCount;
      break;
    case 'modifiedAt':
      comparison = (a.modifiedAt ?? '').localeCompare(b.modifiedAt ?? '');
      break;
    default:
      comparison = 0;
  }

  if (comparison === 0) {
    comparison = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  }

  return direction === 'asc' ? comparison : -comparison;
}

export function sortDirectoryIds(
  childIds: readonly NodeId[],
  directoriesById: Record<NodeId, DirectoryNode>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
): NodeId[] {
  return [...childIds].sort((idA, idB) => {
    const nodeA = directoriesById[idA];
    const nodeB = directoriesById[idB];
    if (!nodeA || !nodeB) {
      return 0;
    }

    return compareDirectoryNodes(nodeA, nodeB, column, direction, rootTotalBytes);
  });
}

export function flattenFolderTree(
  parentId: NodeId,
  directoriesById: Record<NodeId, DirectoryNode>,
  expandedIds: ReadonlySet<NodeId>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  depth = 0,
  visitedOnPath: ReadonlySet<NodeId> = new Set(),
): FlatFolderRow[] {
  if (visitedOnPath.has(parentId)) {
    return [];
  }

  const parent = directoriesById[parentId];
  if (!parent) {
    return [];
  }

  const nextVisited = new Set(visitedOnPath);
  nextVisited.add(parentId);

  const sortedChildIds = sortDirectoryIds(
    parent.childDirectoryIds,
    directoriesById,
    column,
    direction,
    rootTotalBytes,
  );

  const rows: FlatFolderRow[] = [];

  for (const childId of sortedChildIds) {
    const node = directoriesById[childId];
    if (!node) {
      continue;
    }

    if (nextVisited.has(childId)) {
      continue;
    }

    const hasChildren = node.childDirectoryIds.length > 0;
    const isExpanded = expandedIds.has(childId);

    rows.push({ nodeId: childId, node, depth, hasChildren, isExpanded });

    if (hasChildren && isExpanded) {
      rows.push(
        ...flattenFolderTree(
          childId,
          directoriesById,
          expandedIds,
          column,
          direction,
          rootTotalBytes,
          depth + 1,
          nextVisited,
        ),
      );
    }
  }

  return rows;
}

/** Ancestor chain from scan root to focus node (inclusive). */
export function buildBreadcrumbPath(
  focusNodeId: NodeId,
  directoriesById: Record<NodeId, DirectoryNode>,
  rootNodeId: NodeId,
): DirectoryNode[] {
  const breadcrumb: DirectoryNode[] = [];
  const visited = new Set<NodeId>();
  let currentId: NodeId | null = focusNodeId;

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);

    const node: DirectoryNode | undefined = directoriesById[currentId];
    if (!node) {
      break;
    }

    breadcrumb.unshift(node);

    if (currentId === rootNodeId) {
      break;
    }

    currentId = node.parentId;
  }

  return breadcrumb;
}

export function formatModifiedAt(modifiedAt?: string): string {
  if (!modifiedAt) {
    return '—';
  }

  const date = new Date(modifiedAt);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}
