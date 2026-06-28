import { describe, expect, it } from 'vitest';
import { summarizeCleanupCandidates } from '../../src/shared/cleanup-summary';
import type { CleanupCandidate } from '../../src/shared/types';

function createCandidate(overrides: Partial<CleanupCandidate> = {}): CleanupCandidate {
  return {
    path: 'C:\\Demo\\Temp',
    name: 'Temp',
    label: 'User temp files',
    ruleId: 'user-temp',
    sizeBytes: 100,
    fileCount: 1,
    risk: 'low',
    recommendation: 'Safe to clear.',
    category: 'general',
    ...overrides,
  };
}

describe('cleanup-summary', () => {
  it('sums all candidate bytes and low-risk bytes separately', () => {
    const summary = summarizeCleanupCandidates([
      createCandidate({ sizeBytes: 500, risk: 'low' }),
      createCandidate({ sizeBytes: 300, risk: 'medium', ruleId: 'chrome-cache' }),
      createCandidate({ sizeBytes: 200, risk: 'low', ruleId: 'steam-downloading' }),
    ]);

    expect(summary.reclaimableBytesAll).toBe(1000);
    expect(summary.reclaimableBytesLowRisk).toBe(700);
    expect(summary.candidateCount).toBe(3);
    expect(summary.lowRiskCandidateCount).toBe(2);
  });

  it('returns zero totals for an empty candidate list', () => {
    const summary = summarizeCleanupCandidates([]);

    expect(summary.reclaimableBytesAll).toBe(0);
    expect(summary.reclaimableBytesLowRisk).toBe(0);
    expect(summary.candidateCount).toBe(0);
    expect(summary.lowRiskCandidateCount).toBe(0);
  });
});
