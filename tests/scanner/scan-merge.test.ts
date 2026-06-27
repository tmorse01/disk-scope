import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { DirectoryNode } from '../../src/shared/types';
import { mergeScanPartials, rollupDirectorySizes } from '../../src/scanner/scan-merge';
import type { ScanPartialResult } from '../../src/scanner/scan-types';
import { createTopFilesTracker } from '../../src/scanner/top-files-tracker';

function makeNode(
  nodePath: string,
  parentId: string | null,
  overrides: Partial<DirectoryNode> = {},
): DirectoryNode {
  return {
    id: nodePath,
    parentId,
    name: path.basename(nodePath),
    path: nodePath,
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    childDirectoryIds: [],
    unreadable: false,
    ...overrides,
  };
}

function emptyPartial(overrides: Partial<ScanPartialResult> = {}): ScanPartialResult {
  return {
    directoriesById: {},
    fileCount: 0,
    directoryCount: 0,
    bytesDiscovered: 0,
    errorCount: 0,
    largestFileCandidates: [],
    extensionTotals: new Map(),
    cleanupMatches: new Map(),
    errors: [],
    childDirs: [],
    currentPath: '',
    ...overrides,
  };
}

describe('scan-merge', () => {
  it('rolls up child directory sizes to parents bottom-up', () => {
    const root = '/scan/root';
    const child = path.join(root, 'child');
    const directoriesById: Record<string, DirectoryNode> = {
      [root]: makeNode(root, null, {
        sizeBytes: 100,
        fileCount: 1,
        childDirectoryIds: [child],
        directoryCount: 1,
      }),
      [child]: makeNode(child, root, {
        sizeBytes: 250,
        fileCount: 1,
      }),
    };

    rollupDirectorySizes(directoriesById);

    expect(directoriesById[root].sizeBytes).toBe(350);
    expect(directoriesById[child].sizeBytes).toBe(250);
  });

  it('merges disjoint partial trees and matches expected totals', () => {
    const root = '/scan/root';
    const childA = path.join(root, 'a');
    const childB = path.join(root, 'b');

    const partialA = emptyPartial({
      fileCount: 1,
      directoryCount: 1,
      bytesDiscovered: 100,
      directoriesById: {
        [childA]: makeNode(childA, root, { sizeBytes: 100, fileCount: 1 }),
      },
      largestFileCandidates: [
        { path: path.join(childA, 'a.txt'), name: 'a.txt', extension: '.txt', sizeBytes: 100 },
      ],
      extensionTotals: new Map([
        ['.txt', { extension: '.txt', sizeBytes: 100, fileCount: 1 }],
      ]),
    });

    const partialB = emptyPartial({
      fileCount: 1,
      directoryCount: 2,
      bytesDiscovered: 250,
      directoriesById: {
        [root]: makeNode(root, null, {
          sizeBytes: 0,
          childDirectoryIds: [childA, childB],
          directoryCount: 2,
        }),
        [childB]: makeNode(childB, root, { sizeBytes: 250, fileCount: 1 }),
      },
      largestFileCandidates: [
        { path: path.join(childB, 'b.txt'), name: 'b.txt', extension: '.txt', sizeBytes: 250 },
      ],
      extensionTotals: new Map([
        ['.txt', { extension: '.txt', sizeBytes: 250, fileCount: 1 }],
      ]),
    });

    const result = mergeScanPartials([partialA, partialB], {
      scanId: 'merge-test',
      rootPath: root,
      rootNodeId: root,
      startedAt: new Date().toISOString(),
    });

    expect(result.fileCount).toBe(2);
    expect(result.directoryCount).toBe(3);
    expect(result.totalSizeBytes).toBe(350);
    expect(result.extensionSummaries).toEqual([
      { extension: '.txt', sizeBytes: 350, fileCount: 2 },
    ]);
    expect(result.largestFiles[0]?.sizeBytes).toBe(250);
    expect(result.largestFiles[1]?.sizeBytes).toBe(100);
  });

  it('merges top-500 candidates across partials', () => {
    const root = '/scan/root';
    const tracker = createTopFilesTracker(2, true);
    const candidates = [
      { path: '/f1', name: 'f1', extension: null, sizeBytes: 300 },
      { path: '/f2', name: 'f2', extension: null, sizeBytes: 200 },
      { path: '/f3', name: 'f3', extension: null, sizeBytes: 100 },
    ];

    const partials = candidates.map((candidate) =>
      emptyPartial({
        largestFileCandidates: [candidate],
      }),
    );

    const result = mergeScanPartials(partials, {
      scanId: 'top-merge',
      rootPath: root,
      rootNodeId: root,
      startedAt: new Date().toISOString(),
      topFilesLimit: 2,
    });

    expect(result.largestFiles.map((entry) => entry.sizeBytes)).toEqual([300, 200]);
    void tracker;
  });

  it('merges cleanup matches after rollup', () => {
    const root = '/scan/root';
    const nm = path.join(root, 'node_modules');

    const partial = emptyPartial({
      directoryCount: 1,
      directoriesById: {
        [root]: makeNode(root, null, { childDirectoryIds: [nm], directoryCount: 1 }),
        [nm]: makeNode(nm, root, { sizeBytes: 500, fileCount: 10 }),
      },
      cleanupMatches: new Map([
        [
          nm,
          {
            ruleId: 'node_modules',
            label: 'Node dependencies',
            risk: 'low',
            recommendation: 'Safe to remove; reinstall with your package manager.',
          },
        ],
      ]),
    });

    const result = mergeScanPartials([partial], {
      scanId: 'cleanup-merge',
      rootPath: root,
      rootNodeId: root,
      startedAt: new Date().toISOString(),
    });

    expect(result.cleanupCandidates).toHaveLength(1);
    expect(result.cleanupCandidates[0]?.sizeBytes).toBe(500);
    expect(result.totalSizeBytes).toBe(500);
  });
});
