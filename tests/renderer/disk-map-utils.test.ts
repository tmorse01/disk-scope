import { describe, expect, it } from 'vitest';
import type { DirectoryNode, NodeId } from '../../src/shared/types';
import {
  OTHER_TILE_ID,
  buildTreemapItems,
  directFilesBytes,
  filesGroupId,
} from '../../src/renderer/features/disk-map/disk-map-utils';

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
    ...overrides,
  };
}

describe('directFilesBytes', () => {
  it('subtracts child folder totals from node size', () => {
    const directoriesById: Record<NodeId, DirectoryNode> = {
      root: makeNode('root', {
        name: 'root',
        path: 'C:\\root',
        sizeBytes: 1000,
        fileCount: 2,
        childDirectoryIds: ['child'],
      }),
      child: makeNode('child', {
        name: 'child',
        path: 'C:\\root\\child',
        sizeBytes: 700,
        parentId: 'root',
      }),
    };

    expect(directFilesBytes(directoriesById.root, directoriesById)).toBe(300);
  });

  it('never returns negative bytes', () => {
    const directoriesById: Record<NodeId, DirectoryNode> = {
      root: makeNode('root', {
        name: 'root',
        path: 'C:\\root',
        sizeBytes: 100,
        childDirectoryIds: ['child'],
      }),
      child: makeNode('child', {
        name: 'child',
        path: 'C:\\root\\child',
        sizeBytes: 500,
        parentId: 'root',
      }),
    };

    expect(directFilesBytes(directoriesById.root, directoriesById)).toBe(0);
  });
});

describe('buildTreemapItems', () => {
  it('includes a Files tile for direct file bytes', () => {
    const directoriesById: Record<NodeId, DirectoryNode> = {
      root: makeNode('root', {
        name: 'root',
        path: 'C:\\root',
        sizeBytes: 500,
        fileCount: 3,
        childDirectoryIds: ['apps'],
      }),
      apps: makeNode('apps', {
        name: 'apps',
        path: 'C:\\root\\apps',
        sizeBytes: 200,
        parentId: 'root',
      }),
    };

    const items = buildTreemapItems(directoriesById.root, directoriesById);
    const filesTile = items.find((item) => item.kind === 'files');

    expect(filesTile).toMatchObject({
      id: filesGroupId('root'),
      name: 'Files',
      sizeBytes: 300,
    });
  });

  it('aggregates overflow folders into an Other tile', () => {
    const childIds = Array.from({ length: 42 }, (_, index) => `dir-${index}`);
    const directoriesById: Record<NodeId, DirectoryNode> = {
      root: makeNode('root', {
        name: 'root',
        path: 'C:\\root',
        sizeBytes: 4200,
        childDirectoryIds: childIds,
      }),
    };

    for (const [index, childId] of childIds.entries()) {
      directoriesById[childId] = makeNode(childId, {
        name: childId,
        path: `C:\\root\\${childId}`,
        sizeBytes: 100 - index,
        parentId: 'root',
      });
    }

    const items = buildTreemapItems(directoriesById.root, directoriesById, 39);
    const folderTiles = items.filter((item) => item.kind === 'directory');
    const otherTile = items.find((item) => item.kind === 'other');

    expect(folderTiles).toHaveLength(39);
    expect(otherTile).toMatchObject({
      id: OTHER_TILE_ID,
      omittedCount: 3,
    });
    expect(otherTile?.sizeBytes).toBe(100 - 39 + (100 - 40) + (100 - 41));
  });

  it('returns no tiles for an empty leaf folder', () => {
    const directoriesById: Record<NodeId, DirectoryNode> = {
      root: makeNode('root', {
        name: 'root',
        path: 'C:\\root',
        sizeBytes: 0,
        childDirectoryIds: [],
        fileCount: 0,
      }),
    };

    expect(buildTreemapItems(directoriesById.root, directoriesById)).toEqual([]);
  });
});
