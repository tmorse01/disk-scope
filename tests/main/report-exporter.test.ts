import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SaveDialogReturnValue } from 'electron';
import type { ScanResult } from '../../src/shared/types';

const showSaveDialog = vi.fn();
const writeFile = vi.fn();

vi.mock('electron', () => ({
  dialog: {
    showSaveDialog,
  },
}));

vi.mock('node:fs/promises', () => ({
  default: {
    writeFile,
  },
}));

function buildResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    scanId: 'scan-1',
    rootPath: 'C:\\Demo',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:05.000Z',
    totalSizeBytes: 900,
    fileCount: 3,
    directoryCount: 2,
    errorCount: 1,
    rootNodeId: 'C:\\Demo',
    directoriesById: {
      'C:\\Demo': {
        id: 'C:\\Demo',
        parentId: null,
        name: 'Demo',
        path: 'C:\\Demo',
        sizeBytes: 900,
        fileCount: 3,
        directoryCount: 2,
        childDirectoryIds: ['C:\\Demo\\Heavy', 'C:\\Demo\\Light'],
        unreadable: false,
      },
      'C:\\Demo\\Heavy': {
        id: 'C:\\Demo\\Heavy',
        parentId: 'C:\\Demo',
        name: 'Heavy',
        path: 'C:\\Demo\\Heavy',
        sizeBytes: 700,
        fileCount: 2,
        directoryCount: 0,
        childDirectoryIds: [],
        unreadable: false,
      },
      'C:\\Demo\\Light': {
        id: 'C:\\Demo\\Light',
        parentId: 'C:\\Demo',
        name: 'Light',
        path: 'C:\\Demo\\Light',
        sizeBytes: 100,
        fileCount: 1,
        directoryCount: 0,
        childDirectoryIds: [],
        unreadable: false,
      },
    },
    largestFiles: [
      {
        path: 'C:\\Demo\\Heavy\\large.bin',
        name: 'large.bin',
        extension: '.bin',
        sizeBytes: 500,
      },
    ],
    extensionSummaries: [{ extension: '.bin', sizeBytes: 500, fileCount: 1 }],
    cleanupCandidates: [
      {
        path: 'C:\\Demo\\Heavy\\node_modules',
        name: 'node_modules',
        label: 'Node modules',
        ruleId: 'node-modules',
        sizeBytes: 400,
        fileCount: 10,
        risk: 'low',
        recommendation: 'Safe to review',
      },
    ],
    errors: [
      {
        path: 'C:\\Demo\\locked',
        operation: 'read-dir',
        code: 'EACCES',
        message: 'Access denied',
      },
    ],
    ...overrides,
  };
}

describe('report exporter', () => {
  beforeEach(() => {
    showSaveDialog.mockReset();
    writeFile.mockReset();
    writeFile.mockResolvedValue(undefined);
  });

  it('builds export payload with summary fields and top folders excluding root', async () => {
    const { buildExportPayload } = await import('../../src/main/services/report-exporter');
    const payload = buildExportPayload(buildResult());

    expect(payload.rootPath).toBe('C:\\Demo');
    expect(payload.totalSizeBytes).toBe(900);
    expect(payload.fileCount).toBe(3);
    expect(payload.directoryCount).toBe(2);
    expect(payload.errorCount).toBe(1);
    expect(payload.topFolders.map((folder) => folder.path)).toEqual([
      'C:\\Demo\\Heavy',
      'C:\\Demo\\Light',
    ]);
    expect(payload.largestFiles).toHaveLength(1);
    expect(payload.extensionSummaries).toHaveLength(1);
    expect(payload.cleanupCandidates).toHaveLength(1);
    expect(payload.errors).toHaveLength(1);
  });

  it('serializes JSON with required sections', async () => {
    const { buildExportPayload, serializeJson } = await import('../../src/main/services/report-exporter');
    const parsed = JSON.parse(serializeJson(buildExportPayload(buildResult())));

    expect(parsed.rootPath).toBe('C:\\Demo');
    expect(parsed.topFolders).toHaveLength(2);
    expect(parsed.largestFiles[0].name).toBe('large.bin');
    expect(parsed.extensionSummaries[0].extension).toBe('.bin');
    expect(parsed.cleanupCandidates[0].ruleId).toBe('node-modules');
    expect(parsed.errors[0].code).toBe('EACCES');
  });

  it('serializes CSV sections and escapes comma-containing paths', async () => {
    const { buildExportPayload, serializeCsv } = await import('../../src/main/services/report-exporter');
    const result = buildResult({
      largestFiles: [
        {
          path: 'C:\\Demo\\weird, name.txt',
          name: 'weird, name.txt',
          extension: '.txt',
          sizeBytes: 42,
        },
      ],
    });
    const csv = serializeCsv(buildExportPayload(result));

    expect(csv).toContain('[summary]');
    expect(csv).toContain('[topFolders]');
    expect(csv).toContain('[largestFiles]');
    expect(csv).toContain('[fileTypes]');
    expect(csv).toContain('[cleanupCandidates]');
    expect(csv).toContain('[errors]');
    expect(csv).toContain('"C:\\Demo\\weird, name.txt"');
  });

  it('returns without writing when save dialog is canceled', async () => {
    showSaveDialog.mockResolvedValue({
      canceled: true,
      filePath: undefined,
    } satisfies SaveDialogReturnValue);

    const { exportScanReport } = await import('../../src/main/services/report-exporter');
    await exportScanReport(undefined, buildResult(), 'json');

    expect(writeFile).not.toHaveBeenCalled();
  });

  it('writes serialized content when save dialog succeeds', async () => {
    showSaveDialog.mockResolvedValue({
      canceled: false,
      filePath: 'C:\\Temp\\report.json',
    } satisfies SaveDialogReturnValue);

    const { exportScanReport } = await import('../../src/main/services/report-exporter');
    await exportScanReport(undefined, buildResult(), 'json');

    expect(writeFile).toHaveBeenCalledTimes(1);
    const [filePath, content] = writeFile.mock.calls[0] as [string, string, string];
    expect(filePath).toBe('C:\\Temp\\report.json');
    expect(content).toContain('"rootPath": "C:\\\\Demo"');
    expect(content).toContain('"topFolders"');
  });
});

describe('scan coordinator completed scans', () => {
  it('exposes getCompletedScanResult for cached scans', async () => {
    const { getCompletedScanResult } = await import('../../src/main/services/scan-coordinator');
    expect(getCompletedScanResult('missing-scan')).toBeUndefined();
  });
});
