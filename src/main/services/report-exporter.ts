import fs from 'node:fs/promises';
import { dialog, type BrowserWindow } from 'electron';
import type {
  CleanupCandidate,
  ExportFormat,
  ExtensionSummary,
  LargestFileEntry,
  ScanFileError,
  ScanResult,
} from '../../shared/types';
import {
  computeFilesPerSec,
  computeScanDurationMs,
} from '../../shared/scan-duration';

export const TOP_FOLDERS_LIMIT = 100;

export type ExportFolderRow = {
  path: string;
  name: string;
  sizeBytes: number;
  fileCount: number;
  directoryCount: number;
};

export type ScanReportExport = {
  rootPath: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  filesPerSec: number;
  totalSizeBytes: number;
  fileCount: number;
  directoryCount: number;
  errorCount: number;
  topFolders: ExportFolderRow[];
  largestFiles: LargestFileEntry[];
  extensionSummaries: ExtensionSummary[];
  cleanupCandidates: CleanupCandidate[];
  errors: ScanFileError[];
};

export function buildExportPayload(result: ScanResult): ScanReportExport {
  const topFolders = Object.values(result.directoriesById)
    .filter((node) => node.id !== result.rootNodeId)
    .sort((a, b) => b.sizeBytes - a.sizeBytes)
    .slice(0, TOP_FOLDERS_LIMIT)
    .map((node) => ({
      path: node.path,
      name: node.name,
      sizeBytes: node.sizeBytes,
      fileCount: node.fileCount,
      directoryCount: node.directoryCount,
    }));

  const durationMs = computeScanDurationMs(result);

  return {
    rootPath: result.rootPath,
    startedAt: result.startedAt,
    completedAt: result.completedAt,
    durationMs,
    filesPerSec: computeFilesPerSec(result.fileCount, durationMs),
    totalSizeBytes: result.totalSizeBytes,
    fileCount: result.fileCount,
    directoryCount: result.directoryCount,
    errorCount: result.errorCount,
    topFolders,
    largestFiles: result.largestFiles,
    extensionSummaries: result.extensionSummaries,
    cleanupCandidates: result.cleanupCandidates,
    errors: result.errors,
  };
}

export function serializeJson(payload: ScanReportExport): string {
  return JSON.stringify(payload, null, 2);
}

function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return '';
  }

  const text = String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function csvRow(values: Array<string | number | null | undefined>): string {
  return values.map(csvCell).join(',');
}

export function serializeCsv(payload: ScanReportExport): string {
  const sections: string[] = [];

  sections.push('[summary]');
  sections.push(
    csvRow([
      'rootPath',
      'startedAt',
      'completedAt',
      'durationMs',
      'filesPerSec',
      'totalSizeBytes',
      'fileCount',
      'directoryCount',
      'errorCount',
    ]),
  );
  sections.push(
    csvRow([
      payload.rootPath,
      payload.startedAt,
      payload.completedAt,
      payload.durationMs,
      payload.filesPerSec,
      payload.totalSizeBytes,
      payload.fileCount,
      payload.directoryCount,
      payload.errorCount,
    ]),
  );
  sections.push('');

  sections.push('[topFolders]');
  sections.push(csvRow(['path', 'name', 'sizeBytes', 'fileCount', 'directoryCount']));
  for (const folder of payload.topFolders) {
    sections.push(
      csvRow([
        folder.path,
        folder.name,
        folder.sizeBytes,
        folder.fileCount,
        folder.directoryCount,
      ]),
    );
  }
  sections.push('');

  sections.push('[largestFiles]');
  sections.push(csvRow(['path', 'name', 'extension', 'sizeBytes', 'modifiedAt']));
  for (const file of payload.largestFiles) {
    sections.push(
      csvRow([file.path, file.name, file.extension, file.sizeBytes, file.modifiedAt ?? '']),
    );
  }
  sections.push('');

  sections.push('[fileTypes]');
  sections.push(csvRow(['extension', 'sizeBytes', 'fileCount']));
  for (const summary of payload.extensionSummaries) {
    sections.push(csvRow([summary.extension, summary.sizeBytes, summary.fileCount]));
  }
  sections.push('');

  sections.push('[cleanupCandidates]');
  sections.push(
    csvRow(['path', 'name', 'label', 'ruleId', 'sizeBytes', 'fileCount', 'risk', 'recommendation']),
  );
  for (const candidate of payload.cleanupCandidates) {
    sections.push(
      csvRow([
        candidate.path,
        candidate.name,
        candidate.label,
        candidate.ruleId,
        candidate.sizeBytes,
        candidate.fileCount,
        candidate.risk,
        candidate.recommendation,
      ]),
    );
  }
  sections.push('');

  sections.push('[errors]');
  sections.push(csvRow(['path', 'operation', 'code', 'message']));
  for (const error of payload.errors) {
    sections.push(csvRow([error.path, error.operation, error.code, error.message]));
  }

  return sections.join('\n');
}

function defaultExportFileName(format: ExportFormat): string {
  const date = new Date().toISOString().slice(0, 10);
  return `diskscope-report-${date}.${format === 'json' ? 'json' : 'csv'}`;
}

export async function exportScanReport(
  parentWindow: BrowserWindow | null | undefined,
  result: ScanResult,
  format: ExportFormat,
): Promise<void> {
  const payload = buildExportPayload(result);
  const content = format === 'json' ? serializeJson(payload) : serializeCsv(payload);

  const saveOptions = {
    title: 'Export scan report',
    defaultPath: defaultExportFileName(format),
    filters: [
      format === 'json'
        ? { name: 'JSON', extensions: ['json'] as string[] }
        : { name: 'CSV', extensions: ['csv'] as string[] },
    ],
  };

  const dialogResult = parentWindow
    ? await dialog.showSaveDialog(parentWindow, saveOptions)
    : await dialog.showSaveDialog(saveOptions);

  if (dialogResult.canceled || !dialogResult.filePath) {
    return;
  }

  await fs.writeFile(dialogResult.filePath, content, 'utf8');
}
