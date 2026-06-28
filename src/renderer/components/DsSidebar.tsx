import Badge from '@mui/material/Badge';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { DsNavItem } from './DsNavItem';
import { MaterialIcon } from './MaterialIcon';
import { PickScanTargetButton } from '../features/scan-picker/PickScanTargetButton';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { APP_ROUTES, isAppRoute, type AppRoute } from '../routes';
import { NAV_RAIL_WIDTH, SIDEBAR_WIDTH } from '../theme/mui-theme';

const SIDEBAR_HEADER_HEIGHT = 48;

type DsSidebarProps = {
  activeRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
};

export function DsSidebar({ activeRoute, onRouteChange }: DsSidebarProps) {
  const [expanded, setExpanded] = useState(true);
  const { status: updateStatus, hasUpdateReady } = useUpdateStatus();
  const sidebarWidth = expanded ? SIDEBAR_WIDTH : NAV_RAIL_WIDTH;
  const versionLabel = updateStatus?.currentVersion ? `v${updateStatus.currentVersion}` : null;

  const openUpdatesSettings = () => {
    onRouteChange('settings');
  };

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
            showBadge={hasUpdateReady && navRoute.id === 'settings'}
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
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          p: expanded ? 2 : 1,
          bgcolor: 'surfaceContainerLow.main',
        }}
      >
        {versionLabel ? (
          expanded ? (
            <Button
              variant="text"
              size="small"
              onClick={openUpdatesSettings}
              startIcon={
                hasUpdateReady ? (
                  <Badge variant="dot" color="primary">
                    <MaterialIcon name="system_update" style={{ fontSize: 18 }} />
                  </Badge>
                ) : (
                  <MaterialIcon name="info" style={{ fontSize: 18 }} />
                )
              }
              sx={{
                justifyContent: 'flex-start',
                color: 'text.secondary',
                textTransform: 'none',
                px: 1,
                minHeight: 32,
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.3 }}>
                <Typography variant="caption" component="span" sx={{ fontWeight: 600 }}>
                  DiskScope {versionLabel}
                </Typography>
                <Typography variant="caption" component="span" color={hasUpdateReady ? 'primary.main' : 'text.secondary'}>
                  {hasUpdateReady ? 'Update ready — open Settings' : 'Check for updates'}
                </Typography>
              </Box>
            </Button>
          ) : (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <IconButton
                size="small"
                aria-label={
                  hasUpdateReady
                    ? `DiskScope ${versionLabel}, update ready`
                    : `DiskScope ${versionLabel}, check for updates`
                }
                onClick={openUpdatesSettings}
                sx={{ color: 'text.secondary' }}
              >
                <Badge variant="dot" color="primary" invisible={!hasUpdateReady}>
                  <MaterialIcon name="system_update" style={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Box>
          )
        ) : null}

        <PickScanTargetButton
          variant="sidebar"
          expanded={expanded}
          fullWidth
          idleIcon="add"
          aria-label="Scan folder"
        >
          {expanded ? 'Scan folder' : null}
        </PickScanTargetButton>
      </Box>
    </Box>
  );
}
