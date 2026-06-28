import path from 'node:path';
import { Worker } from 'node:worker_threads';
import type { ScanExclusion, ScanProgressEvent, ScanSessionId } from '../shared/types';
import { mergeScanPartials } from './scan-merge';
import type { ScanPartialResult } from './scan-types';
import {
  DEFAULT_PROGRESS_INTERVAL_MS,
  type ScanEngineRunResult,
  type SliceWorkerInboundMessage,
  type SliceWorkerOutboundMessage,
} from './scan-types';
import { normalizePath, pathToNodeId } from './path-utils';

export type ScanWorkerPoolOptions = {
  scanId: ScanSessionId;
  rootPath: string;
  exclusions: ScanExclusion[];
  developerCleanupEnabled: boolean;
  workerCount: number;
  onProgress?: (event: ScanProgressEvent) => void;
  shouldCancel?: () => boolean;
};

type PendingJob = {
  jobId: number;
  dirPath: string;
  parentId: string | null;
  nodeId: string;
  inodeKey: string;
};

function getSliceWorkerPath(): string {
  const workerDir = __dirname.includes('app.asar')
    ? __dirname.replace('app.asar', 'app.asar.unpacked')
    : __dirname;
  return path.join(workerDir, 'scan-slice-worker.js');
}

export class ScanWorkerPool {
  private readonly workers: Worker[] = [];
  private readonly idleWorkers = new Set<Worker>();
  private readonly queue: PendingJob[] = [];
  private readonly visitedInodes = new Set<string>();
  private readonly partials: ScanPartialResult[] = [];
  private readonly options: ScanWorkerPoolOptions;

  private nextJobId = 1;
  private cancelled = false;
  private startedAt = new Date().toISOString();
  private startMs = Date.now();
  private lastProgressAt = 0;
  private totalFileCount = 0;
  private totalDirectoryCount = 0;
  private bytesDiscovered = 0;
  private errorCount = 0;
  private currentPath = '';
  private resolveComplete: ((result: ScanEngineRunResult) => void) | null = null;
  private rejectComplete: ((error: Error) => void) | null = null;
  private readyCount = 0;

  constructor(options: ScanWorkerPoolOptions) {
    this.options = options;
    this.currentPath = normalizePath(options.rootPath);
  }

  start(): Promise<ScanEngineRunResult> {
    this.startedAt = new Date().toISOString();
    this.startMs = Date.now();

    const rootPath = normalizePath(this.options.rootPath);
    const rootNodeId = pathToNodeId(rootPath);
    this.queue.push({
      jobId: this.nextJobId++,
      dirPath: rootPath,
      parentId: null,
      nodeId: rootNodeId,
      inodeKey: rootPath,
    });
    this.visitedInodes.add(rootPath);

    return new Promise<ScanEngineRunResult>((resolve, reject) => {
      this.resolveComplete = resolve;
      this.rejectComplete = reject;

      for (let index = 0; index < this.options.workerCount; index += 1) {
        const worker = new Worker(getSliceWorkerPath());
        this.workers.push(worker);

        worker.on('message', (message: SliceWorkerOutboundMessage) => {
          this.handleWorkerMessage(worker, message);
        });

        worker.on('error', (error) => {
          this.rejectComplete?.(error);
        });

        const initMessage: SliceWorkerInboundMessage = {
          type: 'init',
          payload: {
            exclusions: this.options.exclusions,
            developerCleanupEnabled: this.options.developerCleanupEnabled,
          },
        };
        worker.postMessage(initMessage);
      }

      this.emitProgress(true);
    });
  }

  cancel(): void {
    this.cancelled = true;
    for (const worker of this.workers) {
      const cancelMessage: SliceWorkerInboundMessage = { type: 'cancel' };
      worker.postMessage(cancelMessage);
    }
  }

  async terminate(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.terminate()));
    this.workers.length = 0;
    this.idleWorkers.clear();
  }

  private handleWorkerMessage(worker: Worker, message: SliceWorkerOutboundMessage): void {
    if (message.type === 'ready') {
      this.readyCount += 1;
      this.idleWorkers.add(worker);
      if (this.readyCount === this.workers.length) {
        this.dispatchJobs();
      }
      return;
    }

    if (message.type === 'error') {
      this.rejectComplete?.(new Error(message.payload.message));
      void this.terminate();
      return;
    }

    if (message.type === 'partial') {
      this.idleWorkers.add(worker);
      this.handlePartial(message.payload);
      this.dispatchJobs();
      this.tryComplete();
    }
  }

  private handlePartial(partial: ScanPartialResult): void {
    this.partials.push(partial);
    this.totalFileCount += partial.fileCount;
    this.totalDirectoryCount += partial.directoryCount;
    this.bytesDiscovered += partial.bytesDiscovered;
    this.errorCount += partial.errorCount;
    this.currentPath = partial.currentPath;

    for (const child of partial.childDirs) {
      if (this.visitedInodes.has(child.inodeKey)) {
        continue;
      }
      this.visitedInodes.add(child.inodeKey);
      this.queue.push({
        jobId: this.nextJobId++,
        dirPath: child.dirPath,
        parentId: child.parentId,
        nodeId: pathToNodeId(normalizePath(child.dirPath)),
        inodeKey: child.inodeKey,
      });
    }

    this.emitProgress();
  }

  private dispatchJobs(): void {
    if (this.cancelled || this.options.shouldCancel?.()) {
      this.cancelled = true;
      return;
    }

    while (this.queue.length > 0 && this.idleWorkers.size > 0) {
      const job = this.queue.shift();
      if (!job) {
        break;
      }

      const worker = this.idleWorkers.values().next().value;
      if (!worker) {
        break;
      }

      this.idleWorkers.delete(worker);
      const processMessage: SliceWorkerInboundMessage = {
        type: 'process',
        payload: {
          dirPath: job.dirPath,
          parentId: job.parentId,
          nodeId: job.nodeId,
        },
        jobId: job.jobId,
      };
      worker.postMessage(processMessage);
    }
  }

  private tryComplete(): void {
    if (this.queue.length > 0 || this.idleWorkers.size < this.workers.length) {
      return;
    }

    this.emitProgress(true);
    const rootPath = normalizePath(this.options.rootPath);
    const result = mergeScanPartials(this.partials, {
      scanId: this.options.scanId,
      rootPath,
      rootNodeId: pathToNodeId(rootPath),
      startedAt: this.startedAt,
    });

    void this.terminate().then(() => {
      this.resolveComplete?.({ result, cancelled: this.cancelled });
    });
  }

  private emitProgress(force = false): void {
    if (!this.options.onProgress) {
      return;
    }

    const now = Date.now();
    if (!force && now - this.lastProgressAt < DEFAULT_PROGRESS_INTERVAL_MS) {
      return;
    }

    this.lastProgressAt = now;
    this.options.onProgress({
      scanId: this.options.scanId,
      filesScanned: this.totalFileCount,
      directoriesScanned: this.totalDirectoryCount,
      bytesDiscovered: this.bytesDiscovered,
      currentPath: this.currentPath,
      errorCount: this.errorCount,
      elapsedMs: now - this.startMs,
    });
  }
}
