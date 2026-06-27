import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import { alpha, type Theme } from '@mui/material/styles';
import { MaterialIcon } from './MaterialIcon';

type DsWindowControlsProps = {
  isMaximized: boolean;
  onMinimize: () => void;
  onToggleMaximize: () => void;
  onClose: () => void;
};

const noDragSx = { WebkitAppRegion: 'no-drag' } as const;

const TITLE_BAR_CONTROL_HEIGHT = 40;

export function DsWindowControls({
  isMaximized,
  onMinimize,
  onToggleMaximize,
  onClose,
}: DsWindowControlsProps) {
  const buttonSx = {
    ...noDragSx,
    width: 46,
    height: TITLE_BAR_CONTROL_HEIGHT,
    borderRadius: 0,
    color: 'text.secondary',
    '&:hover': {
      bgcolor: (theme: Theme) => alpha(theme.palette.text.primary, 0.08),
      color: 'text.primary',
    },
  };

  return (
    <Stack direction="row" sx={{ flexShrink: 0, height: '100%', ...noDragSx }}>
      <IconButton
        aria-label="Minimize window"
        onClick={onMinimize}
        sx={buttonSx}
      >
        <MaterialIcon name="remove" style={{ fontSize: 16 }} />
      </IconButton>
      <IconButton
        aria-label={isMaximized ? 'Restore window' : 'Maximize window'}
        onClick={onToggleMaximize}
        sx={buttonSx}
      >
        <MaterialIcon
          name={isMaximized ? 'filter_none' : 'crop_square'}
          style={{ fontSize: isMaximized ? 14 : 16 }}
        />
      </IconButton>
      <IconButton
        aria-label="Close window"
        onClick={onClose}
        sx={{
          ...buttonSx,
          '&:hover': {
            bgcolor: 'error.main',
            color: 'error.contrastText',
          },
        }}
      >
        <MaterialIcon name="close" style={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}
