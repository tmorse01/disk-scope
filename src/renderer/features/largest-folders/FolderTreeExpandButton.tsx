import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import type { MouseEvent } from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';

const EXPAND_SLOT_SIZE = 28;
const EXPAND_ICON_SIZE = 20;

type FolderTreeExpandButtonProps = {
  expanded: boolean;
  loading?: boolean;
  label: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
};

/** Fixed-size tree expand control — chevron stays mounted while loading overlays a spinner. */
export function FolderTreeExpandButton({
  expanded,
  loading = false,
  label,
  onClick,
}: FolderTreeExpandButtonProps) {
  return (
    <IconButton
      size="small"
      aria-label={label}
      aria-busy={loading || undefined}
      onClick={onClick}
      sx={{
        p: 0.25,
        width: EXPAND_SLOT_SIZE,
        height: EXPAND_SLOT_SIZE,
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: EXPAND_ICON_SIZE,
          height: EXPAND_ICON_SIZE,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcon
          name={expanded ? 'expand_more' : 'chevron_right'}
          style={{ fontSize: EXPAND_ICON_SIZE }}
        />
        {loading ? (
          <CircularProgress
            size={EXPAND_ICON_SIZE}
            thickness={4}
            aria-hidden
            sx={{
              position: 'absolute',
              inset: 0,
              color: 'primary.main',
            }}
          />
        ) : null}
      </Box>
    </IconButton>
  );
}

export function FolderTreeExpandSpacer() {
  return <Box sx={{ width: EXPAND_SLOT_SIZE, height: EXPAND_SLOT_SIZE, flexShrink: 0 }} />;
}
