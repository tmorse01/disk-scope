import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { FileTypesView } from '../../src/renderer/features/file-types/FileTypesView';
import { scanStore, resetScanSessionForTest } from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';
import type { ScanResult } from '../../src/shared/types';

function renderView() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <FileTypesView />
    </ThemeProvider>,
  );
}

function buildResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    scanId: 'scan-1',
    rootPath: 'C:\\Demo',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:05.000Z',
    durationMs: 5000,
    totalSizeBytes: 600,
    fileCount: 4,
    directoryCount: 1,
    errorCount: 0,
    rootNodeId: 'C:\\Demo',
    directoriesById: {},
    largestFiles: [],
    extensionSummaries: [
      { extension: '.txt', sizeBytes: 300, fileCount: 3 },
      { extension: null, sizeBytes: 120, fileCount: 2 },
      { extension: '.zip', sizeBytes: 900, fileCount: 1 },
    ],
    cleanupCandidates: [],
    errors: [],
    ...overrides,
  };
}

describe('FileTypesView', () => {
  beforeEach(() => {
    resetScanSessionForTest();
  });

  it('shows an empty state before a scan completes', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'File Types' })).toBeInTheDocument();
    expect(screen.getByText(/Run a scan to see which file types/i)).toBeInTheDocument();
  });

  it('renders extension summaries including the no-extension group', () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';

    renderView();

    expect(screen.getByRole('cell', { name: '.zip' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '[no extension]' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '900.0 B' })).toBeInTheDocument();
  });

  it('re-sorts rows when a column header is clicked', async () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';

    const user = userEvent.setup();
    renderView();

    const rows = () => screen.getAllByRole('row').slice(1);
    expect(rows()[0]).toHaveTextContent('.zip');

    await user.click(screen.getByRole('button', { name: /Extension/i }));

    expect(rows()[0]).toHaveTextContent('.txt');
    expect(rows().at(-1)).toHaveTextContent('[no extension]');
  });
});
