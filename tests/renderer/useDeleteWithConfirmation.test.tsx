import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DiskScopeAPI } from '../../src/shared/types';
import type { DeleteTarget } from '../../src/renderer/features/file-actions/delete-target';
import { useDeleteWithConfirmation } from '../../src/renderer/features/file-actions/useDeleteWithConfirmation';
import {
  resetPreferencesStoreForTest,
  setPreferencesForTest,
} from '../../src/renderer/stores/preferences-store';

const deletePath = vi.fn<DiskScopeAPI['deletePath']>();

const fileTarget: DeleteTarget = {
  path: 'C:\\Temp\\a.txt',
  name: 'a.txt',
  kind: 'file',
  sizeBytes: 128,
};

function DeleteHarness() {
  const { requestDelete, deleteConfirmationUi } = useDeleteWithConfirmation();

  return (
    <div>
      <button type="button" onClick={() => requestDelete(fileTarget)}>
        Delete test item
      </button>
      {deleteConfirmationUi}
    </div>
  );
}

beforeEach(() => {
  deletePath.mockReset();
  deletePath.mockResolvedValue({ ok: true, value: undefined });
  resetPreferencesStoreForTest();
  window.diskScope = {
    ...(window.diskScope as DiskScopeAPI),
    deletePath,
  } as DiskScopeAPI;
});

describe('useDeleteWithConfirmation', () => {
  it('skips confirmation when confirmBeforeDelete is false', async () => {
    setPreferencesForTest({
      theme: 'light',
      exclusions: [],
      confirmBeforeDelete: false,
      defaultDeleteMethod: 'recycle-bin',
    });

    const user = userEvent.setup();
    render(<DeleteHarness />);

    await user.click(screen.getByRole('button', { name: 'Delete test item' }));

    await waitFor(() => {
      expect(deletePath).toHaveBeenCalledWith({
        path: fileTarget.path,
        method: 'recycle-bin',
      });
    });
  });

  it('shows confirmation dialog when confirmBeforeDelete is true', async () => {
    setPreferencesForTest({
      theme: 'light',
      exclusions: [],
      confirmBeforeDelete: true,
      defaultDeleteMethod: 'recycle-bin',
    });

    const user = userEvent.setup();
    render(<DeleteHarness />);

    await user.click(screen.getByRole('button', { name: 'Delete test item' }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(deletePath).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Move to Recycle Bin' }));

    await waitFor(() => {
      expect(deletePath).toHaveBeenCalledWith({
        path: fileTarget.path,
        method: 'recycle-bin',
      });
    });
  });

  it('surfaces delete errors in a snackbar', async () => {
    deletePath.mockResolvedValue({
      ok: false,
      error: { code: 'ACCESS_DENIED', message: 'Permission denied' },
    });

    setPreferencesForTest({
      theme: 'light',
      exclusions: [],
      confirmBeforeDelete: false,
      defaultDeleteMethod: 'recycle-bin',
    });

    const user = userEvent.setup();
    render(<DeleteHarness />);

    await user.click(screen.getByRole('button', { name: 'Delete test item' }));

    expect(await screen.findByText('Permission denied')).toBeInTheDocument();
  });
});
