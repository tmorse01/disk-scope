import os from 'node:os';
import type {
  ScanCompleteEvent,
  ScanErrorEvent,
  ScanExclusion,
  ScanProgressEvent,
  ScanResult,
  ScanSessionId,
} from '../shared/types';

export const DEFAULT_TOP_FILES_LIMIT = 500;
export const DEFAULT_PROGRESS_INTERVAL_MS = 250;

/** Internal toggles for benchmark A/B of individual Tier 1 optimizations. */
export type ScanEngineTuning = {
  postOrderRollup: boolean;
  skipRedundantLstat: boolean;
  minHeapTopFiles: boolean;
  deferMtimeFormatting: boolean;
  inodeLoopDetection: boolean;
  exclusionShortCircuit: boolean;
  batchedProgress: boolean;
};

export const DEFAULT_SCAN_ENGINE_TUNING: ScanEngineTuning = {
  postOrderRollup: true,
  skipRedundantLstat: true,
  minHeapTopFiles: true,
  deferMtimeFormatting: true,
  inodeLoopDetection: true,
  exclusionShortCircuit: true,
  batchedProgress: true,
};

export const LEGACY_SCAN_ENGINE_TUNING: ScanEngineTuning = {
  postOrderRollup: false,
  skipRedundantLstat: false,
  minHeapTopFiles: false,
  deferMtimeFormatting: false,
  inodeLoopDetection: false,
  exclusionShortCircuit: false,
  batchedProgress: false,
};

/** One directory entry returned by a ReadDirFn (native or TypeScript enumerator). */
export type DirectoryEntry = {
  name: string;
  path: string;
  isDirectory: boolean;
  isSymlink: boolean;
  sizeBytes: number;
  mtimeMs?: number;
};

export type ReadDirFn = (dirPath: string) => Promise<DirectoryEntry[]>;

export type ScanEngineOptions = {
  rootPath: string;
  scanId: ScanSessionId;
  topFilesLimit?: number;
  progressIntervalMs?: number;
  exclusions?: ScanExclusion[];
  shouldCancel?: () => boolean;
  onProgress?: (event: ScanProgressEvent) => void;
  /** Benchmark-only; production scans use DEFAULT_SCAN_ENGINE_TUNING. */
  tuning?: Partial<ScanEngineTuning>;
  /** Override directory enumeration (native or TS fallback). Omit to use legacy Tier 1 readdir path. */
  readDirectory?: ReadDirFn;
};

export type ScanEngineRunResult = {
  result: ScanResult;
  cancelled: boolean;
};

export type WorkerStartPayload = {
  scanId: ScanSessionId;
  rootPath: string;
  exclusions: ScanExclusion[];
};

export type WorkerInboundMessage =
  | { type: 'start'; payload: WorkerStartPayload }
  | { type: 'cancel' };

export type WorkerOutboundMessage =
  | { type: 'progress'; payload: ScanProgressEvent }
  | { type: 'complete'; payload: ScanCompleteEvent }
  | { type: 'error'; payload: ScanErrorEvent };

export type ExtensionAccumulator = {
  extension: string | null;
  sizeBytes: number;
  fileCount: number;
};

export type ScanPartialResult = {
  directoriesById: Record<string, import('../shared/types').DirectoryNode>;
  fileCount: number;
  directoryCount: number;
  bytesDiscovered: number;
  errorCount: number;
  largestFileCandidates: import('./top-files-tracker').TopFileCandidate[];
  extensionTotals: Map<string | null, ExtensionAccumulator>;
  cleanupMatches: Map<string, import('./cleanup-rules').CleanupRuleMatch>;
  errors: import('../shared/types').ScanFileError[];
  childDirs: Array<{ dirPath: string; parentId: string; inodeKey: string }>;
  currentPath: string;
};

export type DirectorySliceJob = {
  dirPath: string;
  parentId: string | null;
  nodeId: string;
};

export type SliceWorkerStartPayload = {
  exclusions: ScanExclusion[];
};

export type SliceWorkerInboundMessage =
  | { type: 'init'; payload: SliceWorkerStartPayload }
  | { type: 'process'; payload: DirectorySliceJob; jobId: number }
  | { type: 'cancel' };

export type SliceWorkerOutboundMessage =
  | { type: 'ready' }
  | { type: 'partial'; payload: ScanPartialResult; jobId: number }
  | { type: 'error'; payload: { jobId: number; message: string } };

export type ParallelScanOptions = ScanEngineOptions & {
  workerCount?: number;
};

const DEFAULT_MAX_WORKERS = 4;

export function resolveWorkerCount(override?: number): number {
  if (override !== undefined) {
    return Math.max(1, override);
  }

  const envValue = process.env.SCAN_WORKER_COUNT;
  if (envValue !== undefined && envValue !== '') {
    const parsed = Number.parseInt(envValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      return parsed;
    }
  }

  const cpus = os.cpus().length;
  return Math.max(1, Math.min(DEFAULT_MAX_WORKERS, cpus - 1));
}
