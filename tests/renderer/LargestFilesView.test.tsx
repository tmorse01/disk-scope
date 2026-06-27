import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { LargestFilesView } from '../../src/renderer/features/largest-files/LargestFilesView';
import { scanStore, resetScanSessionForTest } from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';
import type { ScanResult } from '../../src/shared/types';

function renderView() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <LargestFilesView />
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
    fileCount: 2,
    directoryCount: 1,
    errorCount: 0,
    rootNodeId: 'C:\\Demo',
    directoriesById: {},
    largestFiles: [
      {
        path: 'C:\\Demo\\large.bin',
        name: 'large.bin',
        extension: '.bin',
        sizeBytes: 500,
        modifiedAt: '2026-01-02T00:00:00.000Z',
      },
      {
        path: 'C:\\Demo\\readme',
        name: 'readme',
        extension: null,
        sizeBytes: 100,
      },
    ],
    extensionSummaries: [],
    cleanupCandidates: [],
    errors: [],
    ...overrides,
  };
}

describe('LargestFilesView', () => {
  beforeEach(() => {
    resetScanSessionForTest();
  });

  it('shows an empty state before a scan completes', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'Largest Files' })).toBeInTheDocument();
    expect(screen.getByText(/Run a scan to see the largest files/i)).toBeInTheDocument();
  });

  it('renders largest files from the scan store', () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';

    renderView();

    expect(screen.getByRole('cell', { name: 'large.bin' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '[no extension]' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '500.0 B' })).toBeInTheDocument();
  });

  it('re-sorts rows when a column header is clicked', async () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';

    const user = userEvent.setup();
    renderView();

    const rows = () => screen.getAllByRole('row').slice(1);
    expect(rows()[0]).toHaveTextContent('large.bin');

    await user.click(screen.getByRole('button', { name: /Name/i }));

    expect(rows()[0]).toHaveTextContent('large.bin');
    expect(rows()[1]).toHaveTextContent('readme');
  });
});
