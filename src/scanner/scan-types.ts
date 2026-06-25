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
