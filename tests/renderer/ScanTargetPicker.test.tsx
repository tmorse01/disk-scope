import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ScanTargetPicker } from '../../src/renderer/features/scan-picker/ScanTargetPicker';
import { scanStore, setSelectedPath } from '../../src/renderer/stores/scan-store';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderPicker() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <ScanTargetPicker />
    </ThemeProvider>,
  );
}

describe('ScanTargetPicker', () => {
  beforeEach(() => {
    scanStore.status = 'idle';
    scanStore.selectedPath = null;
    scanStore.pickerError = null;
    delete (window as Partial<Window>).diskScope;
  });

  it('shows placeholder when no folder is selected', () => {
    renderPicker();
    expect(screen.getByText('No folder selected yet.')).toBeInTheDocument();
  });

  it('shows selected path when store updates', () => {
    renderPicker();
    act(() => {
      setSelectedPath({ path: 'C:\\Users\\Demo\\Projects' });
    });
    expect(screen.getByTestId('selected-path')).toHaveTextContent('C:\\Users\\Demo\\Projects');
  });

  it('calls selectDirectory when Select folder is clicked', async () => {
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

    renderPicker();
    await user.click(screen.getByRole('button', { name: 'Select folder' }));

    await waitFor(() => {
      expect(selectDirectory).toHaveBeenCalledOnce();
      expect(screen.getByTestId('selected-path')).toHaveTextContent('D:\\Data');
    });
  });
});
