import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from '../../src/renderer/App';
import '../../src/renderer/preview/mock-disk-scope';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderApp() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <App />
    </ThemeProvider>,
  );
}

describe('Scan folder button', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows loading while the picker is open, then re-enables after selection', async () => {
    let resolveDirectory: (value: { path: string }) => void = () => undefined;
    const directoryPromise = new Promise<{ path: string }>((resolve) => {
      resolveDirectory = resolve;
    });

    vi.spyOn(window.diskScope!, 'selectDirectory').mockReturnValue(directoryPromise);

    const user = userEvent.setup();
    renderApp();

    const scanFolderButton = screen.getByRole('button', { name: 'Scan folder' });
    await user.click(scanFolderButton);

    await waitFor(() => {
      expect(scanFolderButton).toBeDisabled();
      expect(scanFolderButton).toHaveAttribute('aria-busy', 'true');
    });

    resolveDirectory({ path: 'D:\\FreshScanTarget' });

    await waitFor(() => {
      expect(scanFolderButton).not.toBeDisabled();
      expect(scanFolderButton).not.toHaveAttribute('aria-busy');
    });
  });
});
