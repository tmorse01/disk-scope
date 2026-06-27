import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { createElement, Fragment, useCallback, useState } from 'react';
import type { DeleteMethod } from '../../../shared/types';
import { isErr } from '../../../shared/result';
import { DsDeleteConfirmDialog } from '../../components/DsDeleteConfirmDialog';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { removeDeletedPathFromScanResult } from '../../stores/scan-store';
import type { DeleteTarget } from './delete-target';

export type UseDeleteWithConfirmationOptions = {
  onDeleteSuccess?: (target: DeleteTarget) => void;
};

export function useDeleteWithConfirmation(options: UseDeleteWithConfirmationOptions = {}) {
  const { confirmBeforeDelete, defaultDeleteMethod } = usePreferencesStore();
  const [pendingTarget, setPendingTarget] = useState<DeleteTarget | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const performDelete = useCallback(
    async (target: DeleteTarget, method: DeleteMethod) => {
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

        removeDeletedPathFromScanResult(target);
        options.onDeleteSuccess?.(target);
        setDialogOpen(false);
        setPendingTarget(null);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Delete failed.');
      } finally {
        setIsDeleting(false);
      }
    },
    [options],
  );

  const requestDelete = useCallback(
    (target: DeleteTarget) => {
      if (confirmBeforeDelete) {
        setPendingTarget(target);
        setDialogOpen(true);
        return;
      }

      void performDelete(target, defaultDeleteMethod);
    },
    [confirmBeforeDelete, defaultDeleteMethod, performDelete],
  );

  const handleCloseDialog = useCallback(() => {
    if (isDeleting) {
      return;
    }

    setDialogOpen(false);
    setPendingTarget(null);
  }, [isDeleting]);

  const handleConfirmDialog = useCallback(() => {
    if (!pendingTarget) {
      return;
    }

    void performDelete(pendingTarget, defaultDeleteMethod);
  }, [defaultDeleteMethod, pendingTarget, performDelete]);

  const deleteConfirmationUi = createElement(
    Fragment,
    null,
    createElement(DsDeleteConfirmDialog, {
      open: dialogOpen,
      target: pendingTarget,
      method: defaultDeleteMethod,
      isDeleting,
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
  };
}
