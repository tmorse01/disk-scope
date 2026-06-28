import { useCallback, useState, type MouseEvent } from 'react';
import type { DeleteTarget } from './delete-target';
import { copyTargetPath, revealTargetPath } from './file-action-handlers';
import { FileActionsContextMenu } from './FileActionsContextMenu';
import { FileActionsToolbar } from './FileActionsToolbar';
import { useDeleteWithConfirmation } from './useDeleteWithConfirmation';

export type UseSelectableFileActionsOptions = {
  onDeleteSuccess?: (target: DeleteTarget) => void;
};

export type SelectableRowProps = {
  selected: boolean;
  dissolving?: boolean;
  onClick: () => void;
  onContextMenu: (event: MouseEvent) => void;
};

export function useSelectableFileActions(options: UseSelectableFileActionsOptions = {}) {
  const [selectedTarget, setSelectedTarget] = useState<DeleteTarget | null>(null);
  const [contextMenuAnchor, setContextMenuAnchor] = useState<{ mouseX: number; mouseY: number } | null>(
    null,
  );
  const { requestDelete, deleteConfirmationUi, isDeleting, dissolvingPaths } = useDeleteWithConfirmation({
    onDeleteSuccess: (target) => {
      setSelectedTarget((current) => (current?.path === target.path ? null : current));
      options.onDeleteSuccess?.(target);
    },
  });

  const clearSelection = useCallback(() => {
    setSelectedTarget(null);
  }, []);

  const selectTarget = useCallback((target: DeleteTarget) => {
    setSelectedTarget(target);
  }, []);

  const handleReveal = useCallback((target: DeleteTarget) => {
    void revealTargetPath(target.path);
  }, []);

  const handleCopy = useCallback((target: DeleteTarget) => {
    void copyTargetPath(target.path);
  }, []);

  const handleDelete = useCallback(
    (target: DeleteTarget) => {
      requestDelete(target);
    },
    [requestDelete],
  );

  const openContextMenu = useCallback((event: MouseEvent, target: DeleteTarget) => {
    event.preventDefault();
    event.stopPropagation();
    setSelectedTarget(target);
    setContextMenuAnchor({ mouseX: event.clientX, mouseY: event.clientY });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenuAnchor(null);
  }, []);

  const getRowProps = useCallback(
    (target: DeleteTarget): SelectableRowProps => ({
      selected: selectedTarget?.path === target.path,
      dissolving: dissolvingPaths.has(target.path),
      onClick: () => selectTarget(target),
      onContextMenu: (event) => openContextMenu(event, target),
    }),
    [dissolvingPaths, openContextMenu, selectTarget, selectedTarget?.path],
  );

  const toolbar = (
    <FileActionsToolbar
      target={selectedTarget}
      isDeleting={isDeleting}
      onReveal={() => {
        if (selectedTarget) {
          handleReveal(selectedTarget);
        }
      }}
      onCopy={() => {
        if (selectedTarget) {
          handleCopy(selectedTarget);
        }
      }}
      onDelete={() => {
        if (selectedTarget) {
          handleDelete(selectedTarget);
        }
      }}
    />
  );

  const contextMenu = (
    <FileActionsContextMenu
      open={contextMenuAnchor !== null}
      anchorPosition={contextMenuAnchor}
      target={selectedTarget}
      isDeleting={isDeleting}
      onClose={closeContextMenu}
      onReveal={(target) => {
        handleReveal(target);
        closeContextMenu();
      }}
      onCopy={(target) => {
        handleCopy(target);
        closeContextMenu();
      }}
      onDelete={(target) => {
        handleDelete(target);
        closeContextMenu();
      }}
    />
  );

  return {
    selectedTarget,
    setSelectedTarget,
    clearSelection,
    selectTarget,
    openContextMenu,
    getRowProps,
    toolbar,
    contextMenu,
    deleteConfirmationUi,
    isDeleting,
    dissolvingPaths,
  };
}
