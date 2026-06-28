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
import * as scanStoreModule from '../../src/renderer/stores/scan-store';

const deletePath = vi.fn<DiskScopeAPI['deletePath']>();

const fileTarget: DeleteTarget = {
  path: 'C:\\Temp\\a.txt',
  name: 'a.txt',
  kind: 'file',
  sizeBytes: 128,
};

function DeleteHarness() {
  const { requestDelete, deleteConfirmationUi, dissolvingPaths } = useDeleteWithConfirmation();

  return (
    <div>
      <button type="button" onClick={() => requestDelete(fileTarget)}>
        Delete test item
      </button>
      <span data-testid="dissolving-count">{dissolvingPaths.size}</span>
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
    expect(screen.getByRole('button', { name: 'Move to Recycle Bin' })).toHaveClass('MuiButton-colorError');
    expect(deletePath).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Move to Recycle Bin' }));

    await waitFor(() => {
      expect(deletePath).toHaveBeenCalledWith({
        path: fileTarget.path,
        method: 'recycle-bin',
      });
    });
  });

  it('closes the dialog immediately so the row dust animation is visible', async () => {
    setPreferencesForTest({
      theme: 'light',
      exclusions: [],
      confirmBeforeDelete: true,
      defaultDeleteMethod: 'recycle-bin',
    });

    const user = userEvent.setup();
    render(<DeleteHarness />);

    await user.click(screen.getByRole('button', { name: 'Delete test item' }));
    await user.click(screen.getByRole('button', { name: 'Move to Recycle Bin' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByTestId('dissolving-count')).toHaveTextContent('1');
    });
  });

  it('delays scan result removal until the dust animation finishes', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const removeSpy = vi.spyOn(scanStoreModule, 'removeDeletedPathFromScanResult');

    try {
      setPreferencesForTest({
        theme: 'light',
        exclusions: [],
        confirmBeforeDelete: false,
        defaultDeleteMethod: 'recycle-bin',
      });

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<DeleteHarness />);

      await user.click(screen.getByRole('button', { name: 'Delete test item' }));

      await waitFor(() => {
        expect(deletePath).toHaveBeenCalledOnce();
      });
      expect(removeSpy).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(650);

      await waitFor(() => {
        expect(removeSpy).toHaveBeenCalledWith(fileTarget);
      });
    } finally {
      removeSpy.mockRestore();
      vi.useRealTimers();
    }
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
