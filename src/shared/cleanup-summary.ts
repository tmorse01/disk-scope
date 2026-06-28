import type { CleanupCandidate, RiskLevel } from './types';

export type CleanupReclaimSummary = {
  reclaimableBytesAll: number;
  reclaimableBytesLowRisk: number;
  candidateCount: number;
  lowRiskCandidateCount: number;
};

export function sumCleanupCandidateBytes(candidates: CleanupCandidate[]): number {
  return candidates.reduce((sum, candidate) => sum + candidate.sizeBytes, 0);
}

export function sumCleanupCandidateBytesByRisk(
  candidates: CleanupCandidate[],
  risk: RiskLevel,
): number {
  return candidates
    .filter((candidate) => candidate.risk === risk)
    .reduce((sum, candidate) => sum + candidate.sizeBytes, 0);
}

export function summarizeCleanupCandidates(candidates: CleanupCandidate[]): CleanupReclaimSummary {
  const lowRiskCandidates = candidates.filter((candidate) => candidate.risk === 'low');

  return {
    reclaimableBytesAll: sumCleanupCandidateBytes(candidates),
    reclaimableBytesLowRisk: sumCleanupCandidateBytes(lowRiskCandidates),
    candidateCount: candidates.length,
    lowRiskCandidateCount: lowRiskCandidates.length,
  };
}
