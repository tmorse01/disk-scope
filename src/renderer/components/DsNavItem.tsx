import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import { MaterialIcon } from './MaterialIcon';
import { radii } from '../theme/tokens';

type DsNavItemProps = {
  icon: string;
  label: string;
  active?: boolean;
  expanded?: boolean;
  showBadge?: boolean;
  onClick: () => void;
};

export function DsNavItem({
  icon,
  label,
  active = false,
  expanded = true,
  showBadge = false,
  onClick,
}: DsNavItemProps) {
  return (
    <Box
      component="button"
      type="button"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        width: '100%',
        px: expanded ? 2 : 1,
        py: 1.25,
        border: 'none',
        borderRadius: `${radii.full}px`,
        bgcolor: active ? 'secondary.light' : 'transparent',
        color: active ? 'secondary.dark' : 'text.secondary',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '14px',
        fontWeight: active ? 600 : 400,
        textAlign: 'left',
        transition: 'background-color 150ms ease, transform 150ms ease',
        justifyContent: expanded ? 'flex-start' : 'center',
        '&:hover': {
          bgcolor: active ? 'secondary.light' : 'surfaceContainerHigh.main',
        },
        '&:active': {
          transform: 'scale(0.98)',
        },
        '&:focus-visible': {
          outline: 2,
          outlineColor: 'primary.main',
          outlineOffset: 2,
        },
      }}
    >
      {showBadge ? (
        <Badge
          variant="dot"
          color="primary"
          overlap="circular"
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MaterialIcon name={icon} filled={active} style={{ fontSize: 22, flexShrink: 0 }} />
        </Badge>
      ) : (
        <MaterialIcon name={icon} filled={active} style={{ fontSize: 22, flexShrink: 0 }} />
      )}
      {expanded ? (
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </Box>
      ) : null}
    </Box>
  );
}
