import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShellProvider } from '../../src/renderer/components/ShellContext';
import { OverviewView } from '../../src/renderer/features/overview/OverviewView';
import { scanStore, resetScanSessionForTest } from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';
import type { ScanResult } from '../../src/shared/types';

function buildResult(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    scanId: 'scan-1',
    rootPath: 'C:\\Demo\\Projects',
    startedAt: '2026-01-01T00:00:00.000Z',
    completedAt: '2026-01-01T00:00:05.000Z',
    durationMs: 5000,
    totalSizeBytes: 1024 * 1024 * 48,
    fileCount: 1200,
    directoryCount: 85,
    errorCount: 0,
    rootNodeId: 'C:\\Demo\\Projects',
    directoriesById: {},
    largestFiles: [],
    extensionSummaries: [],
    cleanupCandidates: [
      {
        path: 'C:\\Demo\\Heavy\\user-temp',
        name: 'Temp',
        label: 'User temp files',
        ruleId: 'user-temp',
        sizeBytes: 4096,
        fileCount: 3,
        risk: 'medium',
        recommendation: 'Often safe to clear.',
        category: 'general',
      },
    ],
    errors: [],
    ...overrides,
  };
}

function renderView(navigateTo = vi.fn()) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <ShellProvider navigateTo={navigateTo}>
        <OverviewView />
      </ShellProvider>
    </ThemeProvider>,
  );
}

describe('OverviewView', () => {
  beforeEach(() => {
    resetScanSessionForTest();
  });

  it('shows scan target picker before a scan completes', () => {
    renderView();

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add folder or drive/i })).toBeInTheDocument();
  });

  it('shows next-step navigation after a scan completes', async () => {
    const navigateTo = vi.fn();
    scanStore.result = buildResult();
    scanStore.status = 'completed';
    scanStore.overviewMode = 'summary';
    scanStore.scanId = 'scan-1';
    scanStore.scanHistory = [
      {
        scanId: 'scan-1',
        result: buildResult(),
        status: 'completed',
        developerCleanupEnabledAtScan: false,
      },
    ];

    renderView(navigateTo);

    expect(screen.getByRole('heading', { name: 'Scan complete' })).toBeInTheDocument();
    expect(screen.getAllByText(/C:\\Demo\\Projects/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Browse largest folders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Browse largest files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /View cleanup suggestions \(1\)/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Export JSON/i })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Browse largest folders/i }));

    expect(navigateTo).toHaveBeenCalledWith('largest-folders');
  });

  it('shows reclaim hero with formatted total and navigates to cleanup on click', async () => {
    const navigateTo = vi.fn();
    scanStore.result = buildResult();
    scanStore.status = 'completed';
    scanStore.overviewMode = 'summary';
    scanStore.scanId = 'scan-1';

    renderView(navigateTo);

    expect(screen.getByRole('heading', { name: 'You could gain 4.0 KB back' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'View suggestions' }));

    expect(navigateTo).toHaveBeenCalledWith('cleanup-candidates');
  });

  it('shows empty cleanup hint when no candidates were found', async () => {
    const navigateTo = vi.fn();
    scanStore.result = buildResult({ cleanupCandidates: [] });
    scanStore.status = 'completed';
    scanStore.overviewMode = 'summary';
    scanStore.scanId = 'scan-1';

    renderView(navigateTo);

    expect(screen.getByRole('heading', { name: 'No known temp or cache folders' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /View cleanup suggestions\./i })).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Largest Files' }));

    expect(navigateTo).toHaveBeenCalledWith('largest-files');
  });

  it('returns to the folder picker when New scan is clicked', async () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';
    scanStore.overviewMode = 'summary';
    scanStore.scanId = 'scan-1';

    renderView();

    expect(screen.getByRole('heading', { name: 'Scan complete' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /New scan/i }));

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add folder or drive/i })).toBeInTheDocument();
  });
});
