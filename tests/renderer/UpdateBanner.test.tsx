import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UpdateBanner } from '../../src/renderer/components/UpdateBanner';
import { muiTheme } from '../../src/renderer/theme/mui-theme';
import type { UpdateStatusSnapshot } from '../../src/shared/types';

const installUpdate = vi.fn(async () => undefined);

function renderUpdateBanner(status: UpdateStatusSnapshot) {
  window.diskScope = {
    ...window.diskScope,
    updates: {
      checkForUpdates: async () => undefined,
      installUpdate,
      getUpdateStatus: async () => status,
      onUpdateStatus: () => () => undefined,
    },
  };

  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <UpdateBanner onOpenSettings={() => undefined} />
    </ThemeProvider>,
  );
}

describe('UpdateBanner', () => {
  it('renders nothing when update is idle', () => {
    renderUpdateBanner({
      phase: 'idle',
      currentVersion: '1.0.0',
    });

    expect(screen.queryByLabelText('Update available')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Update in progress')).not.toBeInTheDocument();
  });

  it('shows restart action when an update is ready', async () => {
    installUpdate.mockClear();
    const user = userEvent.setup();

    renderUpdateBanner({
      phase: 'ready',
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      message: 'Update 1.1.0 is ready. Restart to install.',
    });

    expect(await screen.findByLabelText('Update available')).toHaveTextContent(
      'Update 1.1.0 is ready. Restart to install.',
    );

    await user.click(screen.getByRole('button', { name: /Restart to update/i }));
    await waitFor(() => {
      expect(installUpdate).toHaveBeenCalledTimes(1);
    });
  });

  it('shows download progress while downloading', async () => {
    renderUpdateBanner({
      phase: 'downloading',
      currentVersion: '1.0.0',
      availableVersion: '1.1.0',
      downloadPercent: 42,
      message: 'Downloading update… 42%',
    });

    expect(await screen.findByLabelText('Update in progress')).toHaveTextContent(
      'Downloading update… 42%',
    );
    expect(screen.getByLabelText('Download progress')).toBeInTheDocument();
  });
});
