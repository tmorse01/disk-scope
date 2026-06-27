import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type { DeleteMethod } from '../../shared/types';
import { formatBytes } from '../../shared/format-bytes';
import type { DeleteTarget } from '../features/file-actions/delete-target';
import { DsTabular } from './DsTabular';
import { MaterialIcon } from './MaterialIcon';
import { radii } from '../theme/tokens';

export type DsDeleteConfirmDialogProps = {
  open: boolean;
  target: DeleteTarget | null;
  method: DeleteMethod;
  isDeleting?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

const METHOD_TITLES: Record<DeleteMethod, string> = {
  'recycle-bin': 'Move to Recycle Bin?',
  permanent: 'Delete permanently?',
};

const RISK_WARNINGS: Record<NonNullable<DeleteTarget['risk']>, string> = {
  low: 'This folder was flagged as low risk, but review it before deleting.',
  medium: 'This folder was flagged as moderate risk. Double-check before deleting.',
  high: 'This folder was flagged as high risk. Deleting it may break your project.',
  'do-not-touch': 'This folder was flagged as do-not-touch. Deleting it is strongly discouraged.',
};

export function DsDeleteConfirmDialog({
  open,
  target,
  method,
  isDeleting = false,
  onClose,
  onConfirm,
}: DsDeleteConfirmDialogProps) {
  const isPermanent = method === 'permanent';
  const isFolder = target?.kind === 'directory';
  const showFolderPermanentWarning =
    isPermanent &&
    isFolder &&
    ((target.childFileCount ?? 0) > 0 || (target.childDirectoryCount ?? 0) > 0);

  return (
    <Dialog open={open} onClose={isDeleting ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <MaterialIcon
          name={isPermanent ? 'delete_forever' : 'delete'}
          style={{ color: isPermanent ? 'var(--mui-palette-error-main)' : undefined }}
        />
        {target ? METHOD_TITLES[method] : 'Delete item?'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          {target ? (
            <>
              <Typography variant="body1">
                {isPermanent
                  ? 'This item will be removed from disk and cannot be recovered from the Recycle Bin.'
                  : 'This item will be moved to the Recycle Bin.'}
              </Typography>
              <Stack spacing={0.5}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {target.name}
                </Typography>
                <DsTabular sx={{ color: 'text.secondary', wordBreak: 'break-all' }}>{target.path}</DsTabular>
                <Typography variant="body2" color="text.secondary">
                  {isFolder ? 'Folder' : 'File'} · {formatBytes(target.sizeBytes)}
                </Typography>
              </Stack>
              {showFolderPermanentWarning ? (
                <Alert severity="error" variant="outlined">
                  This folder contains files or subfolders. Permanent delete will remove the entire folder tree.
                </Alert>
              ) : null}
              {target.risk ? (
                <Alert severity={target.risk === 'do-not-touch' ? 'error' : 'warning'} variant="outlined">
                  {RISK_WARNINGS[target.risk]}
                </Alert>
              ) : null}
            </>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={isDeleting} sx={{ borderRadius: `${radii.md}px` }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          color={isPermanent ? 'error' : 'primary'}
          onClick={onConfirm}
          disabled={isDeleting || !target}
          sx={{ borderRadius: `${radii.md}px` }}
        >
          {isDeleting ? 'Deleting…' : isPermanent ? 'Delete permanently' : 'Move to Recycle Bin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
