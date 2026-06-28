import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createElement, Fragment, useCallback, useState } from 'react';
import type { DeleteMethod } from '../../../shared/types';
import { isErr } from '../../../shared/result';
import { DELETE_DUST_MS } from '../../components/delete-dust-sx';
import { DsDeleteConfirmDialog } from '../../components/DsDeleteConfirmDialog';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { removeDeletedPathFromScanResult } from '../../stores/scan-store';
import type { DeleteTarget } from './delete-target';

export type UseDeleteWithConfirmationOptions = {
  onDeleteSuccess?: (target: DeleteTarget) => void;
};

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function useDeleteWithConfirmation(options: UseDeleteWithConfirmationOptions = {}) {
  const { confirmBeforeDelete, defaultDeleteMethod } = usePreferencesStore();
  const [pendingTarget, setPendingTarget] = useState<DeleteTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dissolvingPaths, setDissolvingPaths] = useState<ReadonlySet<string>>(() => new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
    setPendingTarget(null);
  }, []);

  const finishSuccessfulDelete = useCallback(
    async (target: DeleteTarget, playDialogSuccess: boolean) => {
      setDissolvingPaths((current) => new Set(current).add(target.path));
      setIsDeleting(false);

      if (playDialogSuccess) {
        closeDialog();
      }

      await wait(DELETE_DUST_MS);

      removeDeletedPathFromScanResult(target);
      options.onDeleteSuccess?.(target);
      setDissolvingPaths((current) => {
        const next = new Set(current);
        next.delete(target.path);
        return next;
      });

      if (!playDialogSuccess) {
        closeDialog();
      }
    },
    [closeDialog, options],
  );

  const performDelete = useCallback(
    async (target: DeleteTarget, method: DeleteMethod, playDialogSuccess: boolean) => {
      if (typeof window.diskScope === 'undefined') {
        setErrorMessage('DiskScope API is not available yet.');
        return;
      }

      setIsDeleting(true);
      try {
        const result = await window.diskScope.deletePath({ path: target.path, method });
        if (isErr(result)) {
          setErrorMessage(result.error.message || 'Delete failed.');
          return;
        }

        await finishSuccessfulDelete(target, playDialogSuccess);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Delete failed.');
      } finally {
        setIsDeleting(false);
      }
    },
    [finishSuccessfulDelete],
  );

  const requestDelete = useCallback(
    (target: DeleteTarget) => {
      if (confirmBeforeDelete) {
        setPendingTarget(target);
        setDialogOpen(true);
        return;
      }

      void performDelete(target, defaultDeleteMethod, false);
    },
    [confirmBeforeDelete, defaultDeleteMethod, performDelete],
  );

  const handleCloseDialog = useCallback(() => {
    if (isDeleting) {
      return;
    }

    closeDialog();
  }, [closeDialog, isDeleting]);

  const handleConfirmDialog = useCallback(() => {
    if (!pendingTarget) {
      return;
    }

    void performDelete(pendingTarget, defaultDeleteMethod, true);
  }, [defaultDeleteMethod, pendingTarget, performDelete]);

  const deleteConfirmationUi = createElement(
    Fragment,
    null,
    createElement(DsDeleteConfirmDialog, {
      open: dialogOpen,
      target: pendingTarget,
      method: defaultDeleteMethod,
      isDeleting,
      showSuccess: false,
      onClose: handleCloseDialog,
      onConfirm: handleConfirmDialog,
    }),
    createElement(
      Snackbar,
      {
        open: errorMessage !== null,
        autoHideDuration: 6000,
        onClose: () => setErrorMessage(null),
        anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      },
      createElement(
        Alert,
        {
          severity: 'error',
          variant: 'filled',
          onClose: () => setErrorMessage(null),
          sx: { width: '100%' },
        },
        errorMessage,
      ),
    ),
  );

  return {
    requestDelete,
    deleteConfirmationUi,
    isDeleting,
    dissolvingPaths,
  };
}
