import { describe, expect, it } from 'vitest';
import type { CleanupCandidate } from '../../src/shared/types';
import {
  buildCleanupCandidatePathIndex,
  getFolderGridRiskHint,
} from '../../src/renderer/features/largest-folders/folder-cleanup-hint';

function makeCandidate(overrides: Partial<CleanupCandidate> = {}): CleanupCandidate {
  return {
    path: 'C:\\Demo\\node_modules',
    name: 'node_modules',
    label: 'Node dependencies',
    ruleId: 'node_modules',
    sizeBytes: 1024,
    fileCount: 10,
    risk: 'low',
    recommendation: 'Safe to remove; reinstall with your package manager.',
    ...overrides,
  };
}

describe('folder-cleanup-hint', () => {
  it('maps known cleanup candidates to risk chips', () => {
    const index = buildCleanupCandidatePathIndex([makeCandidate()]);

    expect(
      getFolderGridRiskHint({
        cleanupCandidatesByPath: index,
        path: 'C:\\Demo\\node_modules',
      }),
    ).toEqual({
      label: 'Low',
      variant: 'success',
      title: 'Safe to remove; reinstall with your package manager.',
    });
  });

  it('flags stale items when modifiedAt is older than the threshold', () => {
    const modifiedAt = '2026-01-01T00:00:00.000Z';
    const referenceDate = '2026-06-01T00:00:00.000Z';
    const days = Math.floor(
      (new Date(referenceDate).getTime() - new Date(modifiedAt).getTime()) / (1000 * 60 * 60 * 24),
    );

    expect(
      getFolderGridRiskHint({
        cleanupCandidatesByPath: new Map(),
        path: 'C:\\Demo\\old-backup.zip',
        modifiedAt,
        referenceDate,
      }),
    ).toEqual({
      label: 'Stale',
      variant: 'info',
      title: `Not modified in ${days} days — review for cleanup`,
    });
  });

  it('returns null when no cleanup signal is available', () => {
    expect(
      getFolderGridRiskHint({
        cleanupCandidatesByPath: new Map(),
        path: 'C:\\Demo\\src',
        modifiedAt: '2026-05-01T00:00:00.000Z',
        referenceDate: '2026-06-01T00:00:00.000Z',
      }),
    ).toBeNull();
  });
});
