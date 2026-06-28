import type { CleanupCandidate, RiskLevel } from '../../../shared/types';

export type FolderGridRiskHint = {
  label: string;
  variant: 'success' | 'warning' | 'error' | 'neutral' | 'info';
  title?: string;
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: 'Low',
  medium: 'Moderate',
  high: 'High',
  'do-not-touch': 'Do not touch',
};

const RISK_VARIANTS: Record<RiskLevel, FolderGridRiskHint['variant']> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  'do-not-touch': 'neutral',
};

/** Placeholder threshold until a fuller cleanup-risk model lands. */
const STALE_DAYS = 90;

export function buildCleanupCandidatePathIndex(
  candidates: CleanupCandidate[],
): Map<string, CleanupCandidate> {
  const index = new Map<string, CleanupCandidate>();

  for (const candidate of candidates) {
    index.set(candidate.path, candidate);
    index.set(candidate.path.toLowerCase(), candidate);
  }

  return index;
}

function daysSinceModified(modifiedAt: string, referenceDate: Date): number {
  const modified = new Date(modifiedAt);
  if (Number.isNaN(modified.getTime())) {
    return 0;
  }

  return (referenceDate.getTime() - modified.getTime()) / (1000 * 60 * 60 * 24);
}

function staleAccessHint(modifiedAt: string | undefined, referenceDate: Date): FolderGridRiskHint | null {
  if (!modifiedAt) {
    return null;
  }

  const days = daysSinceModified(modifiedAt, referenceDate);
  if (days < STALE_DAYS) {
    return null;
  }

  return {
    label: 'Stale',
    variant: 'info',
    title: `Not modified in ${Math.floor(days)} days — review for cleanup`,
  };
}

export function getFolderGridRiskHint(options: {
  cleanupCandidatesByPath: Map<string, CleanupCandidate>;
  path: string;
  modifiedAt?: string;
  referenceDate?: string | Date;
}): FolderGridRiskHint | null {
  const { cleanupCandidatesByPath, path, modifiedAt, referenceDate } = options;
  const candidate =
    cleanupCandidatesByPath.get(path) ?? cleanupCandidatesByPath.get(path.toLowerCase());

  if (candidate) {
    return {
      label: RISK_LABELS[candidate.risk],
      variant: RISK_VARIANTS[candidate.risk],
      title: candidate.recommendation,
    };
  }

  const reference =
    referenceDate instanceof Date
      ? referenceDate
      : referenceDate
        ? new Date(referenceDate)
        : new Date();
  return staleAccessHint(modifiedAt, reference);
}

export function getCleanupCandidateForPath(
  cleanupCandidatesByPath: Map<string, CleanupCandidate>,
  path: string,
): CleanupCandidate | undefined {
  return cleanupCandidatesByPath.get(path) ?? cleanupCandidatesByPath.get(path.toLowerCase());
}
