export type AppRoute =
  | 'overview'
  | 'largest-folders'
  | 'largest-files'
  | 'file-types'
  | 'cleanup-candidates'
  | 'exclusions'
  | 'settings';

export interface NavRoute {
  id: AppRoute;
  label: string;
  icon: string;
  tagName: string;
}

export const APP_ROUTES: NavRoute[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'dashboard',
    tagName: 'overview-view',
  },
  {
    id: 'largest-folders',
    label: 'Largest Folders',
    icon: 'folder',
    tagName: 'largest-folders-view',
  },
  {
    id: 'largest-files',
    label: 'Largest Files',
    icon: 'description',
    tagName: 'largest-files-view',
  },
  {
    id: 'file-types',
    label: 'File Types',
    icon: 'category',
    tagName: 'file-types-view',
  },
  {
    id: 'cleanup-candidates',
    label: 'Cleanup',
    icon: 'cleaning_services',
    tagName: 'cleanup-candidates-view',
  },
  {
    id: 'exclusions',
    label: 'Exclusions',
    icon: 'block',
    tagName: 'exclusions-view',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    tagName: 'settings-view',
  },
];

export const DEFAULT_ROUTE: AppRoute = 'overview';

export function isAppRoute(value: string): value is AppRoute {
  return APP_ROUTES.some((route) => route.id === value);
}

export function getRouteById(id: AppRoute): NavRoute {
  const route = APP_ROUTES.find((entry) => entry.id === id);
  if (!route) {
    throw new Error(`Unknown route: ${id}`);
  }
  return route;
}
