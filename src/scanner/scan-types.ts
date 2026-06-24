import type { ScanResult, ScanCompleteEvent, ScanErrorEvent, ScanProgressEvent, ScanSessionId } from '../shared/types';

export const DEFAULT_TOP_FILES_LIMIT = 500;
export const DEFAULT_PROGRESS_INTERVAL_MS = 250;

export type ScanEngineOptions = {
  rootPath: string;
  scanId: ScanSessionId;
  topFilesLimit?: number;
  progressIntervalMs?: number;
  shouldCancel?: () => boolean;
  onProgress?: (event: ScanProgressEvent) => void;
};

export type ScanEngineRunResult = {
  result: ScanResult;
  cancelled: boolean;
};

export type WorkerStartPayload = {
  scanId: ScanSessionId;
  rootPath: string;
};

export type WorkerInboundMessage =
  | { type: 'start'; payload: WorkerStartPayload }
  | { type: 'cancel' };

export type WorkerOutboundMessage =
  | { type: 'progress'; payload: ScanProgressEvent }
  | { type: 'complete'; payload: ScanCompleteEvent }
  | { type: 'error'; payload: ScanErrorEvent };
