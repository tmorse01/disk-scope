import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DsDeleteConfirmDialog } from '../../src/renderer/components/DsDeleteConfirmDialog';
import type { DeleteTarget } from '../../src/renderer/features/file-actions/delete-target';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

const fileTarget: DeleteTarget = {
  path: 'C:\\Temp\\a.txt',
  name: 'a.txt',
  kind: 'file',
  sizeBytes: 128,
};

function renderDialog(overrides: Partial<ComponentProps<typeof DsDeleteConfirmDialog>> = {}) {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <DsDeleteConfirmDialog
        open
        target={fileTarget}
        method="recycle-bin"
        onClose={onClose}
        onConfirm={onConfirm}
        {...overrides}
      />
    </ThemeProvider>,
  );

  return { onClose, onConfirm };
}

describe('DsDeleteConfirmDialog', () => {
  it('renders the confirm action as a danger-red button for recycle-bin deletes', () => {
    renderDialog();

    const confirmButton = screen.getByRole('button', { name: 'Move to Recycle Bin' });
    expect(confirmButton).toHaveClass('MuiButton-colorError');
    expect(confirmButton).toHaveClass('MuiButton-contained');
  });

  it('shows deleted success state on the confirm button', () => {
    renderDialog({ showSuccess: true });

    expect(screen.getByRole('button', { name: 'Deleted' })).toBeInTheDocument();
    expect(screen.getByText('check_circle')).toBeInTheDocument();
  });

  it('calls onConfirm when the delete button is clicked', async () => {
    const user = userEvent.setup();
    const { onConfirm } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Move to Recycle Bin' }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});
