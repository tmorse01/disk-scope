import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { MaterialIcon } from '../../components/MaterialIcon';
import type { DeleteTarget } from './delete-target';

export type FileActionsContextMenuProps = {
  open: boolean;
  anchorPosition: { mouseX: number; mouseY: number } | null;
  target: DeleteTarget | null;
  isDeleting?: boolean;
  onClose: () => void;
  onReveal: (target: DeleteTarget) => void;
  onCopy: (target: DeleteTarget) => void;
  onDelete: (target: DeleteTarget) => void;
};

export function FileActionsContextMenu({
  open,
  anchorPosition,
  target,
  isDeleting = false,
  onClose,
  onReveal,
  onCopy,
  onDelete,
}: FileActionsContextMenuProps) {
  const disabled = !target || isDeleting;

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition ? { top: anchorPosition.mouseY, left: anchorPosition.mouseX } : undefined
      }
    >
      <MenuItem
        disabled={disabled}
        onClick={() => {
          if (target) {
            onReveal(target);
          }
        }}
      >
        <ListItemIcon>
          <MaterialIcon name="folder_open" style={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>Reveal in Explorer</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={disabled}
        onClick={() => {
          if (target) {
            onCopy(target);
          }
        }}
      >
        <ListItemIcon>
          <MaterialIcon name="content_copy" style={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>Copy path</ListItemText>
      </MenuItem>
      <MenuItem
        disabled={disabled}
        onClick={() => {
          if (target) {
            onDelete(target);
          }
        }}
      >
        <ListItemIcon>
          <MaterialIcon name="delete" style={{ fontSize: 20 }} />
        </ListItemIcon>
        <ListItemText>Delete</ListItemText>
      </MenuItem>
    </Menu>
  );
}
