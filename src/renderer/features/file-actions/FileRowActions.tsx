import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { DeleteTarget } from './delete-target';
import { useDeleteWithConfirmation } from './useDeleteWithConfirmation';

export type FileRowActionsProps = {
  target: DeleteTarget;
  onDeleteSuccess?: (target: DeleteTarget) => void;
};

async function revealTargetPath(targetPath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.revealPath(targetPath);
}

async function copyTargetPath(targetPath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.copyPath(targetPath);
}

export function FileRowActions({ target, onDeleteSuccess }: FileRowActionsProps) {
  const { requestDelete, deleteConfirmationUi, isDeleting } = useDeleteWithConfirmation({ onDeleteSuccess });

  return (
    <>
      <Stack direction="row" spacing={0.5} sx={{ justifyContent: 'flex-end' }}>
        <Tooltip title="Reveal in file explorer">
          <IconButton
            size="small"
            aria-label="Reveal in file explorer"
            disabled={isDeleting}
            onClick={() => {
              void revealTargetPath(target.path);
            }}
          >
            <MaterialIcon name="folder_open" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Copy path">
          <IconButton
            size="small"
            aria-label="Copy path"
            disabled={isDeleting}
            onClick={() => {
              void copyTargetPath(target.path);
            }}
          >
            <MaterialIcon name="content_copy" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            aria-label="Delete"
            disabled={isDeleting}
            onClick={() => {
              requestDelete(target);
            }}
          >
            <MaterialIcon name="delete" />
          </IconButton>
        </Tooltip>
      </Stack>
      {deleteConfirmationUi}
    </>
  );
}
