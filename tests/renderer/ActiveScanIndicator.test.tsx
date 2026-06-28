import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveScanIndicator } from '../../src/renderer/components/ActiveScanIndicator';
import { ShellProvider } from '../../src/renderer/components/ShellContext';
import { resetScanSessionForTest, scanStore } from '../../src/renderer/stores/scan-store';
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
    cleanupCandidates: [],
    errors: [],
    ...overrides,
  };
}

function renderIndicator(navigateTo = vi.fn()) {
  return {
    navigateTo,
    ...render(
      <ThemeProvider theme={muiTheme} defaultMode="light">
        <CssBaseline />
        <ShellProvider navigateTo={navigateTo}>
          <ActiveScanIndicator />
        </ShellProvider>
      </ThemeProvider>,
    ),
  };
}

describe('ActiveScanIndicator', () => {
  beforeEach(() => {
    resetScanSessionForTest();
  });

  it('renders nothing when no scan target is active', () => {
    renderIndicator();
    expect(screen.queryByLabelText(/Active scan/i)).not.toBeInTheDocument();
  });

  it('shows the active completed scan target and status', () => {
    scanStore.result = buildResult();
    scanStore.status = 'completed';
    scanStore.scanId = 'scan-1';

    renderIndicator();

    expect(screen.getByLabelText(/Active scan: Projects, Complete/i)).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  it('shows scanning status for an in-progress scan', () => {
    scanStore.status = 'scanning';
    scanStore.scanId = 'scan-active';
    scanStore.selectedPaths = ['D:\\'];

    renderIndicator();

    expect(screen.getByLabelText(/Active scan: D: drive, Scanning/i)).toBeInTheDocument();
    expect(screen.getByText('D: drive')).toBeInTheDocument();
    expect(screen.getByText('Scanning')).toBeInTheDocument();
  });

  it('opens overview recent scans when clicked', async () => {
    const navigateTo = vi.fn();
    scanStore.result = buildResult();
    scanStore.status = 'completed';
    scanStore.scanId = 'scan-1';

    renderIndicator(navigateTo);

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Open recent scans/i }));

    expect(navigateTo).toHaveBeenCalledWith('overview');
    expect(scanStore.overviewTab).toBe('recent-scans');
    expect(scanStore.overviewMode).toBe('picker');
  });
});
