import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanTargetPanel } from '../../src/renderer/features/scan-picker/ScanTargetPanel';
import { scanStore, setSelectedPath } from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderPanel() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <ScanTargetPanel />
    </ThemeProvider>,
  );
}

describe('ScanTargetPanel', () => {
  beforeEach(() => {
    scanStore.status = 'idle';
    scanStore.selectedPaths = [];
    scanStore.pickerError = null;
    scanStore.scanError = null;
  });

  it('shows empty state when no targets are selected', () => {
    renderPanel();
    expect(screen.getByText('No targets selected yet.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start scan/i })).toBeDisabled();
  });

  it('lists selected folders and enables start scan', () => {
    renderPanel();
    act(() => {
      setSelectedPath({ path: 'C:\\Users\\Demo\\Projects' });
    });

    expect(screen.getByLabelText('Selected scan targets')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start scan/i })).toBeEnabled();
  });

  it('calls selectDirectory when add is clicked', async () => {
    const user = userEvent.setup();
    const selectDirectory = vi.fn().mockResolvedValue({ path: 'D:\\Data' });
    window.diskScope = {
      selectDirectory,
      startScan: vi.fn(),
      cancelScan: vi.fn(),
      revealPath: vi.fn(),
      copyPath: vi.fn(),
      exportReport: vi.fn(),
      onScanProgress: vi.fn(() => () => undefined),
      onScanComplete: vi.fn(() => () => undefined),
      onScanError: vi.fn(() => () => undefined),
    };

    renderPanel();
    await user.click(screen.getByRole('button', { name: /Add folder or drive/i }));

    expect(selectDirectory).toHaveBeenCalledOnce();
    expect(screen.getByText('Data')).toBeInTheDocument();
  });
});
