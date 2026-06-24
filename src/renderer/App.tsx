import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { MaterialIcon } from './components/MaterialIcon';
import { useScanStore } from './hooks/useScanStore';
import {
  APP_ROUTES,
  DEFAULT_ROUTE,
  getRouteById,
  isAppRoute,
  type AppRoute,
} from './routes';
import { ScanProgressRegion } from './features/scan-progress/ScanProgressRegion';
import { NAV_RAIL_WIDTH, TOP_APP_BAR_HEIGHT } from './theme/mui-theme';

export function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(DEFAULT_ROUTE);
  const { selectedPath } = useScanStore();
  const route = getRouteById(activeRoute);
  const ActiveView = route.component;

  const apiReady = typeof window.diskScope !== 'undefined';
  const subtitle = !apiReady
    ? 'Waiting for preload API...'
    : selectedPath
      ? selectedPath
      : 'No scan target selected';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <AppBar
        position="static"
        color="default"
        elevation={0}
        sx={{
          minHeight: TOP_APP_BAR_HEIGHT,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ minHeight: TOP_APP_BAR_HEIGHT }}>
          <Box>
            <Typography variant="h6" component="h1" sx={{ fontWeight: 500 }}>
              DiskScope
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {subtitle}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Box
          component="nav"
          aria-label="Primary"
          sx={{
            width: NAV_RAIL_WIDTH,
            flexShrink: 0,
            bgcolor: 'background.paper',
            borderRight: 1,
            borderColor: 'divider',
            py: 1.5,
          }}
        >
          {APP_ROUTES.map((navRoute) => {
            const isActive = activeRoute === navRoute.id;
            return (
              <Box
                key={navRoute.id}
                component="button"
                type="button"
                aria-current={isActive ? 'page' : undefined}
                onClick={() => {
                  if (isAppRoute(navRoute.id)) {
                    setActiveRoute(navRoute.id);
                  }
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 0.5,
                  width: '100%',
                  minHeight: 64,
                  px: 0.5,
                  py: 1,
                  border: 'none',
                  bgcolor: isActive ? 'action.selected' : 'transparent',
                  color: isActive ? 'primary.main' : 'text.secondary',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  transition: 'background-color 150ms ease',
                  '&:hover': {
                    bgcolor: isActive
                      ? 'secondary.main'
                      : (theme) =>
                          theme.palette.mode === 'light'
                            ? 'rgba(0, 0, 0, 0.04)'
                            : 'rgba(255, 255, 255, 0.08)',
                  },
                  '&:focus-visible': {
                    outline: 2,
                    outlineColor: 'primary.main',
                    outlineOffset: -2,
                  },
                }}
              >
                <MaterialIcon name={navRoute.icon} />
                <Box
                  component="span"
                  sx={{
                    maxWidth: 72,
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {navRoute.label}
                </Box>
              </Box>
            );
          })}
        </Box>

        <Box
          component="main"
          aria-label={route.label}
          sx={{ flex: 1, minWidth: 0, p: 3, overflow: 'auto' }}
        >
          <ActiveView />
        </Box>
      </Box>

      <ScanProgressRegion />
    </Box>
  );
}
