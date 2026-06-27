import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { DeleteTarget } from './delete-target';

export type FileActionsToolbarProps = {
  target: DeleteTarget | null;
  isDeleting?: boolean;
  onReveal: () => void;
  onCopy: () => void;
  onDelete: () => void;
};

function selectionLabel(target: DeleteTarget | null): string {
  if (!target) {
    return 'Select a row to reveal, copy, or delete';
  }

  return target.name;
}

export function FileActionsToolbar({
  target,
  isDeleting = false,
  onReveal,
  onCopy,
  onDelete,
}: FileActionsToolbarProps) {
  const disabled = !target || isDeleting;

  return (
    <Box
      role="toolbar"
      aria-label="File actions"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        flexWrap: 'wrap',
        px: 2,
        py: 1.25,
        bgcolor: 'surfaceContainerLow.main',
        borderBottom: 1,
        borderColor: 'outlineVariant.main',
      }}
    >
      <Typography variant="body2" color="text.secondary" noWrap sx={{ minWidth: 0, flex: 1 }}>
        {selectionLabel(target)}
      </Typography>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexShrink: 0 }}>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled}
          onClick={onReveal}
          startIcon={<MaterialIcon name="folder_open" style={{ fontSize: 18 }} />}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Reveal in Explorer
        </Button>
        <Button
          size="small"
          variant="outlined"
          disabled={disabled}
          onClick={onCopy}
          startIcon={<MaterialIcon name="content_copy" style={{ fontSize: 18 }} />}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Copy path
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="error"
          disabled={disabled}
          onClick={onDelete}
          startIcon={<MaterialIcon name="delete" style={{ fontSize: 18 }} />}
          sx={{ textTransform: 'none', borderRadius: 999 }}
        >
          Delete
        </Button>
      </Stack>
    </Box>
  );
}
