import Box from '@mui/material/Box';
import { useMemo, useState } from 'react';
import { DsContextBar } from './components/DsContextBar';
import { DsErrorBoundary } from './components/DsErrorBoundary';
import { DsSidebar } from './components/DsSidebar';
import { DsTitleBar } from './components/DsTitleBar';
import { ShellProvider, useShellContext } from './components/ShellContext';
import { ScanProgressRegion } from './features/scan-progress/ScanProgressRegion';
import { useScanStore } from './hooks/useScanStore';
import { getPrimarySelectedPath } from './stores/scan-store';
import {
  DEFAULT_ROUTE,
  getRouteById,
  type AppRoute,
} from './routes';
import {
  CONTENT_GUTTER,
  CONTENT_MAX_WIDTH,
} from './theme/mui-theme';

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

type AppLayoutProps = {
  activeRoute: AppRoute;
  onRouteChange: (route: AppRoute) => void;
};

function AppLayout({ activeRoute, onRouteChange }: AppLayoutProps) {
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

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
        color: 'text.primary',
      }}
    >
      <DsTitleBar />

      <Box sx={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <DsSidebar activeRoute={activeRoute} onRouteChange={onRouteChange} />

        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <DsContextBar segments={segments} actions={contextActions} />

          <Box
            component="main"
            aria-label={route.label}
            className="ds-custom-scrollbar"
            sx={{
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
              p: `${CONTENT_GUTTER}px`,
            }}
          >
            <Box
              sx={{
                maxWidth: CONTENT_MAX_WIDTH,
                mx: 'auto',
                height: '100%',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <DsErrorBoundary
                resetKeys={[activeRoute]}
                onBackToSafety={() => onRouteChange(DEFAULT_ROUTE)}
                title={`${route.label} ran into a problem`}
              >
                <ActiveView />
              </DsErrorBoundary>
            </Box>
          </Box>

          {status !== 'scanning' ? <ScanProgressRegion /> : null}
        </Box>
      </Box>
    </Box>
  );
}

export function App() {
  const [activeRoute, setActiveRoute] = useState<AppRoute>(DEFAULT_ROUTE);

  return (
    <ShellProvider navigateTo={setActiveRoute}>
      <AppLayout activeRoute={activeRoute} onRouteChange={setActiveRoute} />
    </ShellProvider>
  );
}
