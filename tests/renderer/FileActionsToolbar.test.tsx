import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FileActionsToolbar } from '../../src/renderer/features/file-actions/FileActionsToolbar';
import { muiTheme } from '../../src/renderer/theme/mui-theme';
import type { DeleteTarget } from '../../src/renderer/features/file-actions/delete-target';

const fileTarget: DeleteTarget = {
  path: 'C:\\Demo\\large.bin',
  name: 'large.bin',
  kind: 'file',
  sizeBytes: 500,
};

function renderToolbar(
  props: Partial<ComponentProps<typeof FileActionsToolbar>> = {},
) {
  const onReveal = props.onReveal ?? (() => undefined);
  const onCopy = props.onCopy ?? (() => undefined);
  const onDelete = props.onDelete ?? (() => undefined);

  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <FileActionsToolbar
        target={props.target ?? null}
        isDeleting={props.isDeleting}
        onReveal={onReveal}
        onCopy={onCopy}
        onDelete={onDelete}
      />
    </ThemeProvider>,
  );
}

describe('FileActionsToolbar', () => {
  it('disables actions when nothing is selected', () => {
    renderToolbar();

    expect(screen.getByRole('button', { name: 'Reveal in Explorer' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Copy path' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeDisabled();
    expect(screen.getByText(/Select a row/i)).toBeInTheDocument();
  });

  it('enables actions when a target is selected', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    renderToolbar({ target: fileTarget, onDelete });

    const deleteButton = screen.getByRole('button', { name: 'Delete' });
    expect(deleteButton).toBeEnabled();
    expect(screen.getByText('large.bin')).toBeInTheDocument();

    await user.click(deleteButton);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
