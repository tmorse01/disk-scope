import { describe, expect, it } from 'vitest';
import type { DirectoryNode, NodeId } from '../../src/shared/types';
import {
  buildBreadcrumbPath,
  compareDirectoryNodes,
  filesGroupId,
  flattenFolderTree,
  flattenFolderTreeRows,
  percentOfRoot,
  sortDirectoryIds,
} from '../../src/renderer/features/largest-folders/folder-tree-utils';

function makeNode(
  id: NodeId,
  overrides: Partial<DirectoryNode> & Pick<DirectoryNode, 'name' | 'path'>,
): DirectoryNode {
  return {
    id,
    parentId: null,
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    childDirectoryIds: [],
    unreadable: false,
    ...overrides,
  };
}

const ROOT_ID = 'root';
const DOCS_ID = 'docs';
const SRC_ID = 'src';
const LIB_ID = 'lib';

const directoriesById: Record<NodeId, DirectoryNode> = {
  [ROOT_ID]: makeNode(ROOT_ID, {
    name: 'project',
    path: 'C:\\project',
    parentId: null,
    sizeBytes: 10_000,
    fileCount: 100,
    directoryCount: 2,
    childDirectoryIds: [DOCS_ID, SRC_ID],
  }),
  [DOCS_ID]: makeNode(DOCS_ID, {
    name: 'docs',
    path: 'C:\\project\\docs',
    parentId: ROOT_ID,
    sizeBytes: 2_000,
    fileCount: 10,
    directoryCount: 0,
    modifiedAt: '2026-01-01T00:00:00.000Z',
  }),
  [SRC_ID]: makeNode(SRC_ID, {
    name: 'src',
    path: 'C:\\project\\src',
    parentId: ROOT_ID,
    sizeBytes: 8_000,
    fileCount: 90,
    directoryCount: 1,
    childDirectoryIds: [LIB_ID],
    modifiedAt: '2026-02-01T00:00:00.000Z',
  }),
  [LIB_ID]: makeNode(LIB_ID, {
    name: 'lib',
    path: 'C:\\project\\src\\lib',
    parentId: SRC_ID,
    sizeBytes: 3_000,
    fileCount: 40,
    directoryCount: 0,
  }),
};

describe('percentOfRoot', () => {
  it('returns zero when root total is zero', () => {
    expect(percentOfRoot(500, 0)).toBe(0);
  });

  it('calculates share of root total', () => {
    expect(percentOfRoot(2_500, 10_000)).toBe(25);
    expect(percentOfRoot(1_000, 10_000)).toBeCloseTo(10);
  });
});

describe('compareDirectoryNodes', () => {
  it('sorts by size descending with name tie-breaker', () => {
    const docs = directoriesById[DOCS_ID]!;
    const src = directoriesById[SRC_ID]!;

    expect(compareDirectoryNodes(src, docs, 'sizeBytes', 'desc', 10_000)).toBeLessThan(0);
    expect(compareDirectoryNodes(docs, src, 'sizeBytes', 'desc', 10_000)).toBeGreaterThan(0);
  });

  it('sorts by percent of root ascending', () => {
    const docs = directoriesById[DOCS_ID]!;
    const src = directoriesById[SRC_ID]!;

    expect(compareDirectoryNodes(docs, src, 'percentOfRoot', 'asc', 10_000)).toBeLessThan(0);
  });
});

describe('sortDirectoryIds', () => {
  it('orders siblings by size descending by default', () => {
    const sorted = sortDirectoryIds(
      directoriesById[ROOT_ID]!.childDirectoryIds,
      directoriesById,
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(sorted).toEqual([SRC_ID, DOCS_ID]);
  });

  it('orders siblings by name ascending', () => {
    const sorted = sortDirectoryIds(
      directoriesById[ROOT_ID]!.childDirectoryIds,
      directoriesById,
      'name',
      'asc',
      10_000,
    );

    expect(sorted).toEqual([DOCS_ID, SRC_ID]);
  });
});

describe('flattenFolderTree', () => {
  it('returns sorted immediate children at depth zero', () => {
    const rows = flattenFolderTree(
      ROOT_ID,
      directoriesById,
      new Set(),
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(rows.map((row) => row.nodeId)).toEqual([SRC_ID, DOCS_ID]);
    expect(rows.every((row) => row.depth === 0)).toBe(true);
  });

  it('includes nested rows when parent is expanded', () => {
    const rows = flattenFolderTree(
      ROOT_ID,
      directoriesById,
      new Set([SRC_ID]),
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(rows.map((row) => row.nodeId)).toEqual([SRC_ID, LIB_ID, DOCS_ID]);
    expect(rows.find((row) => row.nodeId === LIB_ID)?.depth).toBe(1);
  });

  it('hides nested rows when parent is collapsed', () => {
    const rows = flattenFolderTree(
      ROOT_ID,
      directoriesById,
      new Set(),
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(rows.some((row) => row.nodeId === LIB_ID)).toBe(false);
  });

  it('does not recurse into cyclic child links', () => {
    const cycleA = 'cycle-a';
    const cycleB = 'cycle-b';
    const cyclicDirectories: Record<NodeId, DirectoryNode> = {
      [ROOT_ID]: makeNode(ROOT_ID, {
        name: 'project',
        path: 'C:\\project',
        parentId: null,
        sizeBytes: 10_000,
        childDirectoryIds: [cycleA],
      }),
      [cycleA]: makeNode(cycleA, {
        name: 'a',
        path: 'C:\\project\\a',
        parentId: ROOT_ID,
        sizeBytes: 5_000,
        childDirectoryIds: [cycleB],
      }),
      [cycleB]: makeNode(cycleB, {
        name: 'b',
        path: 'C:\\project\\b',
        parentId: cycleA,
        sizeBytes: 5_000,
        childDirectoryIds: [cycleA],
      }),
    };

    const rows = flattenFolderTree(
      ROOT_ID,
      cyclicDirectories,
      new Set([cycleA, cycleB]),
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(rows.map((row) => row.nodeId)).toEqual([cycleA, cycleB]);
  });
});

describe('flattenFolderTreeRows', () => {
  it('includes a focus-level files group when the focused directory has files', () => {
    const rows = flattenFolderTreeRows(
      ROOT_ID,
      directoriesById,
      new Set(),
      'sizeBytes',
      'desc',
      10_000,
      new Map(),
      new Set(),
      0,
      new Set(),
      true,
    );

    expect(rows.some((row) => row.kind === 'files-group' && row.parentId === ROOT_ID)).toBe(true);
  });

  it('adds a files group after expanded child folders with files', () => {
    const rows = flattenFolderTreeRows(
      ROOT_ID,
      directoriesById,
      new Set([DOCS_ID]),
      'sizeBytes',
      'desc',
      10_000,
    );

    expect(rows.some((row) => row.kind === 'files-group' && row.parentId === DOCS_ID)).toBe(true);
  });

  it('renders cached file rows when the files group is expanded', () => {
    const groupId = filesGroupId(DOCS_ID);
    const rows = flattenFolderTreeRows(
      ROOT_ID,
      directoriesById,
      new Set([DOCS_ID, groupId]),
      'sizeBytes',
      'desc',
      10_000,
      new Map([
        [
          DOCS_ID,
          [
            {
              name: 'readme.md',
              path: 'C:\\project\\docs\\readme.md',
              kind: 'file',
              sizeBytes: 128,
            },
          ],
        ],
      ]),
    );

    expect(rows.some((row) => row.kind === 'file' && row.entry.name === 'readme.md')).toBe(true);
  });
});

describe('buildBreadcrumbPath', () => {
  it('returns root-only path when focused on root', () => {
    expect(buildBreadcrumbPath(ROOT_ID, directoriesById, ROOT_ID).map((node) => node.id)).toEqual([
      ROOT_ID,
    ]);
  });

  it('returns full ancestor chain for nested focus', () => {
    expect(buildBreadcrumbPath(LIB_ID, directoriesById, ROOT_ID).map((node) => node.id)).toEqual([
      ROOT_ID,
      SRC_ID,
      LIB_ID,
    ]);
  });

  it('stops when parent chain contains a cycle', () => {
    const cycleA = 'cycle-a';
    const cycleB = 'cycle-b';
    const cyclicDirectories: Record<NodeId, DirectoryNode> = {
      [cycleA]: makeNode(cycleA, {
        name: 'a',
        path: 'C:\\a',
        parentId: cycleB,
      }),
      [cycleB]: makeNode(cycleB, {
        name: 'b',
        path: 'C:\\b',
        parentId: cycleA,
      }),
    };

    expect(
      buildBreadcrumbPath(cycleA, cyclicDirectories, ROOT_ID).map((node) => node.id),
    ).toEqual([cycleB, cycleA]);
  });
});
