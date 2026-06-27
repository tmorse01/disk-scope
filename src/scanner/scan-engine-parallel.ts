import { normalizePath, pathToNodeId } from './path-utils';
import { resolveReadDirectory } from './native-enumerator';
import { processDirectorySlice } from './scan-engine-slice';
import { mergeScanPartials } from './scan-merge';
import {
  DEFAULT_PROGRESS_INTERVAL_MS,
  DEFAULT_SCAN_ENGINE_TUNING,
  type ParallelScanOptions,
  type ScanEngineRunResult,
  type ScanPartialResult,
  resolveWorkerCount,
} from './scan-types';

type QueueItem = {
  dirPath: string;
  parentId: string | null;
  nodeId: string;
  inodeKey: string;
};

export async function runScanParallel(
  options: ParallelScanOptions,
): Promise<ScanEngineRunResult> {
  const startedAt = new Date().toISOString();
  const startMs = Date.now();
  const progressIntervalMs = options.progressIntervalMs ?? DEFAULT_PROGRESS_INTERVAL_MS;
  const workerCount = resolveWorkerCount(options.workerCount);
  const readDirectory = options.readDirectory ?? resolveReadDirectory();

  const rootPath = normalizePath(options.rootPath);
  const rootNodeId = pathToNodeId(rootPath);
  const visitedInodes = new Set<string>();
  const partials: ScanPartialResult[] = [];
  const queue: QueueItem[] = [];

  let cancelled = false;
  let totalFileCount = 0;
  let totalDirectoryCount = 0;
  let bytesDiscovered = 0;
  let errorCount = 0;
  let currentPath = rootPath;
  let lastProgressAt = 0;
  let running = 0;

  const enqueue = (item: QueueItem): void => {
    if (visitedInodes.has(item.inodeKey)) {
      return;
    }
    visitedInodes.add(item.inodeKey);
    queue.push(item);
  };

  enqueue({ dirPath: rootPath, parentId: null, nodeId: rootNodeId, inodeKey: rootPath });

  const shouldCancel = (): boolean => {
    if (options.shouldCancel?.()) {
      cancelled = true;
      return true;
    }
    return cancelled;
  };

  const emitProgress = (force = false): void => {
    if (!options.onProgress) {
      return;
    }

    const now = Date.now();
    if (!force && now - lastProgressAt < progressIntervalMs) {
      return;
    }

    lastProgressAt = now;
    options.onProgress({
      scanId: options.scanId,
      filesScanned: totalFileCount,
      directoriesScanned: totalDirectoryCount,
      bytesDiscovered,
      currentPath,
      errorCount,
      elapsedMs: now - startMs,
    });
  };

  await new Promise<void>((resolve) => {
    const trySchedule = (): void => {
      if (shouldCancel()) {
        if (running === 0) {
          resolve();
        }
        return;
      }

      while (running < workerCount && queue.length > 0) {
        const job = queue.shift();
        if (!job) {
          break;
        }

        running += 1;
        void processDirectorySlice({
          job: {
            dirPath: job.dirPath,
            parentId: job.parentId,
            nodeId: job.nodeId,
          },
          readDirectory,
          exclusions: options.exclusions ?? [],
          tuning: options.tuning ?? DEFAULT_SCAN_ENGINE_TUNING,
          shouldCancel,
        })
          .then((partial) => {
            partials.push(partial);
            totalFileCount += partial.fileCount;
            totalDirectoryCount += partial.directoryCount;
            bytesDiscovered += partial.bytesDiscovered;
            errorCount += partial.errorCount;
            currentPath = partial.currentPath;

            for (const child of partial.childDirs) {
              enqueue({
                dirPath: child.dirPath,
                parentId: child.parentId,
                nodeId: pathToNodeId(normalizePath(child.dirPath)),
                inodeKey: child.inodeKey,
              });
            }

            emitProgress();
          })
          .finally(() => {
            running -= 1;
            if (queue.length > 0) {
              trySchedule();
            } else if (running === 0) {
              resolve();
            }
          });
      }

      if (queue.length === 0 && running === 0) {
        resolve();
      }
    };

    emitProgress(true);
    trySchedule();
  });

  emitProgress(true);

  if (options.shouldCancel?.()) {
    cancelled = true;
  }

  const result = mergeScanPartials(partials, {
    scanId: options.scanId,
    rootPath,
    rootNodeId,
    startedAt,
    topFilesLimit: options.topFilesLimit,
  });

  return { result, cancelled };
}
