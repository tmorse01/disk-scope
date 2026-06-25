import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { ScanProgressHero } from '../../src/renderer/features/scan-progress/ScanProgressHero';
import {
  applyScanProgressForTest,
  resetScanSessionForTest,
  scanStore,
} from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderHero() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <ScanProgressHero />
    </ThemeProvider>,
  );
}

describe('ScanProgressHero', () => {
  beforeEach(() => {
    resetScanSessionForTest();
    scanStore.status = 'scanning';
    scanStore.scanId = 'test-scan';
    scanStore.selectedPaths = ['C:\\Users\\Demo\\Projects'];
    scanStore.progress = {
      filesScanned: 124502,
      directoriesScanned: 842,
      bytesDiscovered: 42_800_000_000,
      currentPath: 'C:\\Users\\Demo\\Projects\\node_modules\\typescript',
      errorCount: 0,
      elapsedMs: 45_000,
    };
  });

  it('shows scan status header and consolidated stats', () => {
    renderHero();

    expect(screen.getByLabelText('Scan in progress')).toBeInTheDocument();
    expect(screen.getByText('Scan in progress')).toBeInTheDocument();
    expect(screen.getAllByRole('progressbar', { name: 'Disk analyzed' }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Folders', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getByText('45s')).toBeInTheDocument();
  });

  it('shows analyzed percent in the ring center', () => {
    renderHero();
    expect(screen.getByText('Analyzed')).toBeInTheDocument();
    const ring = screen.getAllByRole('progressbar', { name: 'Disk analyzed' })[0];
    expect(ring).toHaveAttribute('aria-valuenow');
    expect(Number(ring.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });

  it('shows current path and cancel action', () => {
    renderHero();
    expect(screen.getByText(/node_modules/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel scan/i })).toBeInTheDocument();
  });

  it('updates when progress snapshot changes', () => {
    renderHero();

    act(() => {
      applyScanProgressForTest({
        scanId: 'test-scan',
        filesScanned: 200000,
        directoriesScanned: 900,
        bytesDiscovered: 50_000_000_000,
        currentPath: 'C:\\Users\\Demo\\Projects\\src',
        errorCount: 0,
        elapsedMs: 60_000,
      });
    });

    expect(screen.getAllByText('200,000').length).toBeGreaterThanOrEqual(1);
    const ring = screen.getAllByRole('progressbar', { name: 'Disk analyzed' })[0];
    expect(Number(ring.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
  });
});
