import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { useMemo, useState } from 'react';
import { DsContextBar } from './components/DsContextBar';
import { DsNavItem } from './components/DsNavItem';
import { MaterialIcon } from './components/MaterialIcon';
import { ShellProvider, useShellContext } from './components/ShellContext';
import { ScanProgressRegion } from './features/scan-progress/ScanProgressRegion';
import { useScanStore } from './hooks/useScanStore';
import { getPrimarySelectedPath, pickScanTarget } from './stores/scan-store';
import {
  APP_ROUTES,
  DEFAULT_ROUTE,
  getRouteById,
  isAppRoute,
  type AppRoute,
} from './routes';
import {
  CONTENT_GUTTER,
  CONTENT_MAX_WIDTH,
  NAV_RAIL_WIDTH,
  SIDEBAR_WIDTH,
} from './theme/mui-theme';
import { radii } from './theme/tokens';

function pathToSegments(path: string): { id: string; label: string }[] {
  const normalized = path.replace(/\\/g, '/').replace(/\/+$/, '');
  const parts = normalized.split('/').filter(Boolean);

  if (parts.length === 0) {
    return [{ id: path, label: path }];
  }

  let accumulated = '';
  return parts.map((part, index) => {
    if (/^[A-Za-z]:$/.test(part)) {
      accumulated = `${part}/`;
    } else if (index === 0 && /^[A-Za-z]:/.test(part)) {
      accumulated = part.endsWith('/') ? part : `${part}/`;
    } else {
      accumulated = accumulated.endsWith('/')
        ? `${accumulated}${part}`
        : `${accumulated}/${part}`;
    }

    return { id: accumulated || part, label: part.replace(/\/$/, '') };
  });
}

function AppLayout() {
  const theme = useTheme();
  const expanded = useMediaQuery(theme.breakpoints.up('lg'));
  const [activeRoute, setActiveRoute] = useState<AppRoute>(DEFAULT_ROUTE);
  const { result, status } = useScanStore();
  const { breadcrumbSegments, contextActions } = useShellContext();
  const route = getRouteById(activeRoute);
  const ActiveView = route.component;

  const defaultSegments = useMemo(() => {
    const path = result?.rootPath ?? getPrimarySelectedPath();
    if (!path) {
      return [];
    }
    const pathSegments = pathToSegments(path);
    if (status === 'scanning') {
      return [...pathSegments, { id: 'scanning', label: 'Scanning…' }];
    }
    return pathSegments;
  }, [result?.rootPath, status]);

  const segments = breadcrumbSegments.length > 0 ? breadcrumbSegments : defaultSegments;
  const sidebarWidth = expanded ? SIDEBAR_WIDTH : NAV_RAIL_WIDTH;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <Box
        component="nav"
        aria-label="Primary"
        sx={{
          width: sidebarWidth,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          bgcolor: 'surfaceContainerLow.main',
          borderRight: 1,
          borderColor: 'outlineVariant.main',
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        <Box sx={{ p: expanded ? 3 : 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: `${radii.lg}px`,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <MaterialIcon name="hard_drive" filled style={{ fontSize: 22 }} />
          </Box>
          <Box
            sx={{
              overflow: 'hidden',
              ...(!expanded
                ? {
                    position: 'absolute',
                    width: 1,
                    height: 1,
                    padding: 0,
                    margin: -1,
                    overflow: 'hidden',
                    clip: 'rect(0, 0, 0, 0)',
                    whiteSpace: 'nowrap',
                    border: 0,
                  }
                : {}),
            }}
          >
            <Typography
              component="h1"
              variant="h6"
              sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2, whiteSpace: 'nowrap' }}
            >
              DiskScope
            </Typography>
            {expanded ? (
              <Typography variant="body2" color="text.secondary" sx={{ opacity: 0.8 }}>
                System Utility
              </Typography>
            ) : null}
          </Box>
        </Box>

        <Box sx={{ flex: 1, px: expanded ? 1.5 : 0.5, py: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {APP_ROUTES.map((navRoute) => (
            <DsNavItem
              key={navRoute.id}
              icon={navRoute.icon}
              label={navRoute.label}
              active={activeRoute === navRoute.id}
              expanded={expanded}
              onClick={() => {
                if (isAppRoute(navRoute.id)) {
                  setActiveRoute(navRoute.id);
                }
              }}
            />
          ))}
        </Box>

        <Box sx={{ p: expanded ? 2 : 1, borderTop: 1, borderColor: 'outlineVariant.main' }}>
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

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <DsContextBar segments={segments} actions={contextActions} />

        <Box
          component="main"
          aria-label={route.label}
          className="ds-custom-scrollbar"
          sx={{
            flex: 1,
            overflow: 'auto',
            p: `${CONTENT_GUTTER}px`,
          }}
        >
          <Box sx={{ maxWidth: CONTENT_MAX_WIDTH, mx: 'auto' }}>
            <ActiveView />
          </Box>
        </Box>

        {status !== 'scanning' ? <ScanProgressRegion /> : null}
      </Box>
    </Box>
  );
}

export function App() {
  return (
    <ShellProvider>
      <AppLayout />
    </ShellProvider>
  );
}
