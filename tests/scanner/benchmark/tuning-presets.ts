import {
  DEFAULT_SCAN_ENGINE_TUNING,
  LEGACY_SCAN_ENGINE_TUNING,
  type ScanEngineTuning,
} from '../../../src/scanner/scan-types';

export type OptimizationKey = keyof ScanEngineTuning;

export const OPTIMIZATION_LABELS: Record<OptimizationKey, string> = {
  postOrderRollup: 'post-order size rollup',
  skipRedundantLstat: 'skip redundant lstat',
  minHeapTopFiles: 'min-heap top-N',
  deferMtimeFormatting: 'deferred mtime formatting',
  inodeLoopDetection: 'inode loop detection',
  exclusionShortCircuit: 'exclusion subtree short-circuit',
  batchedProgress: 'batched progress checks',
};

export const OPTIMIZATION_KEYS = Object.keys(OPTIMIZATION_LABELS) as OptimizationKey[];

export function tuningWithOnly(key: OptimizationKey): ScanEngineTuning {
  return { ...LEGACY_SCAN_ENGINE_TUNING, [key]: true };
}

export function tuningWithout(key: OptimizationKey): ScanEngineTuning {
  return { ...DEFAULT_SCAN_ENGINE_TUNING, [key]: false };
}

export { DEFAULT_SCAN_ENGINE_TUNING, LEGACY_SCAN_ENGINE_TUNING };
