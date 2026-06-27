import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useState } from 'react';
import { DsNavItem } from './DsNavItem';
import { MaterialIcon } from './MaterialIcon';
import { APP_ROUTES, isAppRoute, type AppRoute } from '../routes';
import { NAV_RAIL_WIDTH, SIDEBAR_WIDTH } from '../theme/mui-theme';
import { radii } from '../theme/tokens';
import { pickScanTarget } from '../stores/scan-store';

const SIDEBAR_HEADER_HEIGHT = 48;
const SIDEBAR_FOOTER_MIN_HEIGHT = 72;

type DsSidebarProps = {
  activeRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
};

export function DsSidebar({ activeRoute, onRouteChange }: DsSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const sidebarWidth = expanded ? SIDEBAR_WIDTH : NAV_RAIL_WIDTH;

  return (
    <Box
      component="nav"
      aria-label="Primary"
      sx={{
        width: sidebarWidth,
        flexShrink: 0,
        alignSelf: 'stretch',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'surfaceContainerLow.main',
        borderRight: 1,
        borderColor: 'outlineVariant.main',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 40,
      }}
    >
      <Box
        component="header"
        sx={{
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: expanded ? 'flex-end' : 'center',
          height: SIDEBAR_HEADER_HEIGHT,
          px: expanded ? 1.5 : 0.5,
        }}
      >
        <IconButton
          size="small"
          aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={expanded}
          aria-controls="ds-sidebar-nav"
          onClick={() => setExpanded((value) => !value)}
          sx={{
            color: 'text.secondary',
            '&:hover': { bgcolor: 'surfaceContainerHigh.main' },
          }}
        >
          <MaterialIcon
            name={expanded ? 'chevron_left' : 'chevron_right'}
            style={{ fontSize: 20 }}
          />
        </IconButton>
      </Box>

      <Box
        id="ds-sidebar-nav"
        className="ds-custom-scrollbar"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          px: expanded ? 1.5 : 0.5,
          py: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        {APP_ROUTES.map((navRoute) => (
          <DsNavItem
            key={navRoute.id}
            icon={navRoute.icon}
            label={navRoute.label}
            active={activeRoute === navRoute.id}
            expanded={expanded}
            onClick={() => {
              if (isAppRoute(navRoute.id)) {
                onRouteChange(navRoute.id);
              }
            }}
          />
        ))}
      </Box>

      <Box
        component="footer"
        sx={{
          flexShrink: 0,
          minHeight: SIDEBAR_FOOTER_MIN_HEIGHT,
          display: 'flex',
          alignItems: 'center',
          p: expanded ? 2 : 1,
          bgcolor: 'surfaceContainerLow.main',
        }}
      >
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => void pickScanTarget()}
          startIcon={<MaterialIcon name="add" aria-hidden={false} />}
          sx={{
            borderRadius: `${radii.lg}px`,
            py: 1.25,
            justifyContent: 'center',
            minWidth: expanded ? undefined : 48,
            '& .MuiButton-startIcon': expanded ? undefined : { mx: 0 },
          }}
        >
          {expanded ? 'Scan folder' : null}
        </Button>
      </Box>
    </Box>
  );
}
