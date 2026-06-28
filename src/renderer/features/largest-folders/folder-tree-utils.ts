import type { DirectoryListingEntry, DirectoryNode, NodeId } from '../../../shared/types';

export const FILES_GROUP_SUFFIX = '::__files__';
export const FILES_TRUNCATED_SUFFIX = '::__files_truncated__';

/** Align with scanner `DEFAULT_TOP_FILES_LIMIT`. */
export const MAX_VISIBLE_FILES_IN_TREE = 500;

export function filesGroupId(parentId: NodeId): NodeId {
  return `${parentId}${FILES_GROUP_SUFFIX}`;
}

export function filesTruncatedRowId(parentId: NodeId): NodeId {
  return `${parentId}${FILES_TRUNCATED_SUFFIX}`;
}

export function isFilesGroupId(nodeId: NodeId): boolean {
  return nodeId.endsWith(FILES_GROUP_SUFFIX);
}

export function parentIdFromFilesGroupId(filesGroupNodeId: NodeId): NodeId {
  return filesGroupNodeId.slice(0, -FILES_GROUP_SUFFIX.length);
}

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

export type FlatDirectoryRow = {
  kind: 'directory';
  nodeId: NodeId;
  node: DirectoryNode;
  depth: number;
  hasChildren: boolean;
  isExpanded: boolean;
};

export type FlatFilesGroupRow = {
  kind: 'files-group';
  nodeId: NodeId;
  parentId: NodeId;
  parentPath: string;
  fileCount: number;
  depth: number;
  isExpanded: boolean;
  isLoading: boolean;
};

export type FlatFileRow = {
  kind: 'file';
  nodeId: NodeId;
  parentId: NodeId;
  entry: DirectoryListingEntry;
  depth: number;
};

export type FlatFilesTruncatedRow = {
  kind: 'files-truncated';
  nodeId: NodeId;
  parentId: NodeId;
  depth: number;
  totalFileCount: number;
  visibleCount: number;
};

export type FlatTreeRow =
  | FlatDirectoryRow
  | FlatFilesGroupRow
  | FlatFileRow
  | FlatFilesTruncatedRow;

export const DEFAULT_FOLDER_SORT_COLUMN: FolderSortColumn = 'sizeBytes';
export const DEFAULT_FOLDER_SORT_DIRECTION: SortDirection = 'desc';

export type SortCache = Map<string, NodeId[]>;

type FlattenRowsContext = {
  directoriesById: Record<NodeId, DirectoryNode>;
  expandedIds: ReadonlySet<NodeId>;
  column: FolderSortColumn;
  direction: SortDirection;
  rootTotalBytes: number;
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]>;
  loadingFilesGroupIds: ReadonlySet<NodeId>;
  sortCache: SortCache;
};

function sortCacheKey(
  parentId: NodeId,
  column: FolderSortColumn,
  direction: SortDirection,
): string {
  return `${parentId}:${column}:${direction}`;
}

export function getSortedChildIds(
  parentId: NodeId,
  childIds: readonly NodeId[],
  directoriesById: Record<NodeId, DirectoryNode>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  cache: SortCache,
): NodeId[] {
  const key = sortCacheKey(parentId, column, direction);
  const cached = cache.get(key);
  if (cached) {
    return cached;
  }

  const sorted = sortDirectoryIds(childIds, directoriesById, column, direction, rootTotalBytes);
  cache.set(key, sorted);
  return sorted;
}

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

/** Compact `folders / files` label for the folder tree contents column. */
export function formatFolderContentsSummary(directoryCount: number, fileCount: number): string {
  return `${directoryCount.toLocaleString()} / ${fileCount.toLocaleString()}`;
}

export function formatFolderContentsTitle(directoryCount: number, fileCount: number): string {
  const folders = `${directoryCount.toLocaleString()} subfolder${directoryCount === 1 ? '' : 's'}`;
  const files = `${fileCount.toLocaleString()} file${fileCount === 1 ? '' : 's'}`;
  return `${folders}, ${files}`;
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

function buildVisitedOnPath(
  parentId: NodeId,
  visitedOnPath: ReadonlySet<NodeId>,
): ReadonlySet<NodeId> {
  const nextVisited = new Set(visitedOnPath);
  nextVisited.add(parentId);
  return nextVisited;
}

function buildAncestorVisitedPath(
  nodeId: NodeId,
  directoriesById: Record<NodeId, DirectoryNode>,
): ReadonlySet<NodeId> {
  const visited = new Set<NodeId>();
  let currentId = directoriesById[nodeId]?.parentId ?? null;

  while (currentId) {
    if (visited.has(currentId)) {
      break;
    }

    visited.add(currentId);
    currentId = directoriesById[currentId]?.parentId ?? null;
  }

  return visited;
}

function directoryHasExpandableContent(node: DirectoryNode): boolean {
  return node.childDirectoryIds.length > 0 || node.fileCount > 0;
}

function pushFilesGroupContentRows(
  rows: FlatTreeRow[],
  parentId: NodeId,
  parent: DirectoryNode,
  depth: number,
  ctx: FlattenRowsContext,
): void {
  const cachedEntries = ctx.fileCache.get(parentId) ?? [];
  const fileEntries = cachedEntries.filter((entry) => entry.kind === 'file');
  const visibleCount = Math.min(fileEntries.length, MAX_VISIBLE_FILES_IN_TREE);

  for (let index = 0; index < visibleCount; index += 1) {
    const entry = fileEntries[index]!;
    rows.push({
      kind: 'file',
      nodeId: entry.path,
      parentId,
      entry,
      depth,
    });
  }

  if (parent.fileCount > visibleCount) {
    rows.push({
      kind: 'files-truncated',
      nodeId: filesTruncatedRowId(parentId),
      parentId,
      depth,
      totalFileCount: parent.fileCount,
      visibleCount,
    });
  }
}

function pushFilesGroupRows(
  rows: FlatTreeRow[],
  parentId: NodeId,
  parent: DirectoryNode,
  depth: number,
  ctx: FlattenRowsContext,
): void {
  if (parent.fileCount <= 0) {
    return;
  }

  const groupId = filesGroupId(parentId);
  const isExpanded = ctx.expandedIds.has(groupId);

  rows.push({
    kind: 'files-group',
    nodeId: groupId,
    parentId,
    parentPath: parent.path,
    fileCount: parent.fileCount,
    depth,
    isExpanded,
    isLoading: ctx.loadingFilesGroupIds.has(parentId),
  });

  if (isExpanded) {
    pushFilesGroupContentRows(rows, parentId, parent, depth + 1, ctx);
  }
}

function pushDirectoryChildrenRows(
  rows: FlatTreeRow[],
  parentId: NodeId,
  depth: number,
  visitedOnPath: ReadonlySet<NodeId>,
  ctx: FlattenRowsContext,
): void {
  if (visitedOnPath.has(parentId)) {
    return;
  }

  const parent = ctx.directoriesById[parentId];
  if (!parent) {
    return;
  }

  const nextVisited = buildVisitedOnPath(parentId, visitedOnPath);
  const sortedChildIds = getSortedChildIds(
    parentId,
    parent.childDirectoryIds,
    ctx.directoriesById,
    ctx.column,
    ctx.direction,
    ctx.rootTotalBytes,
    ctx.sortCache,
  );

  for (const childId of sortedChildIds) {
    const node = ctx.directoriesById[childId];
    if (!node) {
      continue;
    }

    if (nextVisited.has(childId)) {
      continue;
    }

    const hasChildren = directoryHasExpandableContent(node);
    const isExpanded = ctx.expandedIds.has(childId);

    rows.push({
      kind: 'directory',
      nodeId: childId,
      node,
      depth,
      hasChildren,
      isExpanded,
    });

    if (isExpanded) {
      pushDirectoryChildrenRows(rows, childId, depth + 1, nextVisited, ctx);
      pushFilesGroupRows(rows, childId, node, depth + 1, ctx);
    }
  }
}

function createFlattenContext(
  directoriesById: Record<NodeId, DirectoryNode>,
  expandedIds: ReadonlySet<NodeId>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]>,
  loadingFilesGroupIds: ReadonlySet<NodeId>,
  sortCache: SortCache = new Map(),
): FlattenRowsContext {
  return {
    directoriesById,
    expandedIds,
    column,
    direction,
    rootTotalBytes,
    fileCache,
    loadingFilesGroupIds,
    sortCache,
  };
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
  sortCache: SortCache = new Map(),
): FlatFolderRow[] {
  if (visitedOnPath.has(parentId)) {
    return [];
  }

  const parent = directoriesById[parentId];
  if (!parent) {
    return [];
  }

  const nextVisited = buildVisitedOnPath(parentId, visitedOnPath);
  const sortedChildIds = getSortedChildIds(
    parentId,
    parent.childDirectoryIds,
    directoriesById,
    column,
    direction,
    rootTotalBytes,
    sortCache,
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
      const nested = flattenFolderTree(
        childId,
        directoriesById,
        expandedIds,
        column,
        direction,
        rootTotalBytes,
        depth + 1,
        nextVisited,
        sortCache,
      );
      for (const nestedRow of nested) {
        rows.push(nestedRow);
      }
    }
  }

  return rows;
}

export function flattenFolderTreeRows(
  parentId: NodeId,
  directoriesById: Record<NodeId, DirectoryNode>,
  expandedIds: ReadonlySet<NodeId>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]> = new Map(),
  loadingFilesGroupIds: ReadonlySet<NodeId> = new Set(),
  depth = 0,
  visitedOnPath: ReadonlySet<NodeId> = new Set(),
  includeFocusFilesGroup = false,
  sortCache: SortCache = new Map(),
): FlatTreeRow[] {
  if (visitedOnPath.has(parentId)) {
    return [];
  }

  const parent = directoriesById[parentId];
  if (!parent) {
    return [];
  }

  const ctx = createFlattenContext(
    directoriesById,
    expandedIds,
    column,
    direction,
    rootTotalBytes,
    fileCache,
    loadingFilesGroupIds,
    sortCache,
  );

  const rows: FlatTreeRow[] = [];

  pushDirectoryChildrenRows(rows, parentId, depth, visitedOnPath, ctx);

  if (includeFocusFilesGroup) {
    pushFilesGroupRows(rows, parentId, parent, depth, ctx);
  }

  return rows;
}

/** Rows rendered under an expanded directory or files-group anchor. */
export function flattenSubtreeRows(
  anchorNodeId: NodeId,
  anchorDepth: number,
  directoriesById: Record<NodeId, DirectoryNode>,
  expandedIds: ReadonlySet<NodeId>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]> = new Map(),
  loadingFilesGroupIds: ReadonlySet<NodeId> = new Set(),
): FlatTreeRow[] {
  const sortCache: SortCache = new Map();
  const ctx = createFlattenContext(
    directoriesById,
    expandedIds,
    column,
    direction,
    rootTotalBytes,
    fileCache,
    loadingFilesGroupIds,
    sortCache,
  );
  const rows: FlatTreeRow[] = [];

  if (isFilesGroupId(anchorNodeId)) {
    const parentId = parentIdFromFilesGroupId(anchorNodeId);
    const parent = directoriesById[parentId];
    if (!parent) {
      return rows;
    }

    pushFilesGroupContentRows(rows, parentId, parent, anchorDepth + 1, ctx);
    return rows;
  }

  const node = directoriesById[anchorNodeId];
  if (!node) {
    return rows;
  }

  const childDepth = anchorDepth + 1;
  const visitedOnPath = buildAncestorVisitedPath(anchorNodeId, directoriesById);
  pushDirectoryChildrenRows(rows, anchorNodeId, childDepth, visitedOnPath, ctx);
  pushFilesGroupRows(rows, anchorNodeId, node, childDepth, ctx);
  return rows;
}

function isExpandableTreeRow(row: FlatTreeRow): row is FlatDirectoryRow | FlatFilesGroupRow {
  return row.kind === 'directory' || row.kind === 'files-group';
}

export function insertSubtreeAfterRow(
  rows: FlatTreeRow[],
  anchorNodeId: NodeId,
  subtreeRows: FlatTreeRow[],
): FlatTreeRow[] {
  const index = rows.findIndex(
    (row) => isExpandableTreeRow(row) && row.nodeId === anchorNodeId,
  );
  if (index === -1) {
    return rows;
  }

  const anchor = rows[index]!;
  if (!isExpandableTreeRow(anchor)) {
    return rows;
  }

  const next = rows.slice();
  next[index] = { ...anchor, isExpanded: true };
  next.splice(index + 1, 0, ...subtreeRows);
  return next;
}

/** Refresh expanded `<Files>` rows when cache or loading state changes (no full-tree rebuild). */
export function patchFileListingInRows(
  rows: FlatTreeRow[],
  directoriesById: Record<NodeId, DirectoryNode>,
  expandedIds: ReadonlySet<NodeId>,
  column: FolderSortColumn,
  direction: SortDirection,
  rootTotalBytes: number,
  fileCache: ReadonlyMap<NodeId, DirectoryListingEntry[]>,
  loadingParentIds: ReadonlySet<NodeId>,
): FlatTreeRow[] {
  const patched: FlatTreeRow[] = [];
  let index = 0;

  while (index < rows.length) {
    const row = rows[index]!;

    if (row.kind !== 'files-group') {
      patched.push(row);
      index += 1;
      continue;
    }

    const filesGroupRow: FlatFilesGroupRow = {
      ...row,
      isLoading: loadingParentIds.has(row.parentId),
    };
    patched.push(filesGroupRow);
    index += 1;

    if (!filesGroupRow.isExpanded) {
      continue;
    }

    const anchorDepth = filesGroupRow.depth;
    while (index < rows.length && rows[index]!.depth > anchorDepth) {
      const child = rows[index]!;
      if (child.kind === 'file' || child.kind === 'files-truncated') {
        index += 1;
        continue;
      }
      break;
    }

    const fileRows = flattenSubtreeRows(
      filesGroupRow.nodeId,
      filesGroupRow.depth,
      directoriesById,
      expandedIds,
      column,
      direction,
      rootTotalBytes,
      fileCache,
      loadingParentIds,
    );
    for (const fileRow of fileRows) {
      patched.push(fileRow);
    }
  }

  return patched;
}

export function removeSubtreeRows(rows: FlatTreeRow[], anchorNodeId: NodeId): FlatTreeRow[] {
  const index = rows.findIndex(
    (row) => isExpandableTreeRow(row) && row.nodeId === anchorNodeId,
  );
  if (index === -1) {
    return rows;
  }

  const anchor = rows[index]!;
  if (!isExpandableTreeRow(anchor)) {
    return rows;
  }

  const anchorDepth = anchor.depth;
  let removeCount = 0;
  for (let rowIndex = index + 1; rowIndex < rows.length; rowIndex += 1) {
    if (rows[rowIndex]!.depth <= anchorDepth) {
      break;
    }
    removeCount += 1;
  }

  const next = rows.slice();
  next[index] = { ...anchor, isExpanded: false };
  next.splice(index + 1, removeCount);
  return next;
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
