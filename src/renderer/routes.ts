import type { ComponentType } from 'react';
import { CleanupCandidatesView } from './features/cleanup-candidates/CleanupCandidatesView';
import { ExclusionsView } from './features/exclusions/ExclusionsView';
import { FileTypesView } from './features/file-types/FileTypesView';
import { LargestFilesView } from './features/largest-files/LargestFilesView';
import { LargestFoldersView } from './features/largest-folders/LargestFoldersView';
import { OverviewView } from './features/overview/OverviewView';
import { SettingsView } from './features/settings/SettingsView';

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
  component: ComponentType;
}

export const APP_ROUTES: NavRoute[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: 'dashboard',
    component: OverviewView,
  },
  {
    id: 'largest-folders',
    label: 'Largest Folders',
    icon: 'folder',
    component: LargestFoldersView,
  },
  {
    id: 'largest-files',
    label: 'Largest Files',
    icon: 'description',
    component: LargestFilesView,
  },
  {
    id: 'file-types',
    label: 'File Types',
    icon: 'category',
    component: FileTypesView,
  },
  {
    id: 'cleanup-candidates',
    label: 'Cleanup',
    icon: 'cleaning_services',
    component: CleanupCandidatesView,
  },
  {
    id: 'exclusions',
    label: 'Exclusions',
    icon: 'block',
    component: ExclusionsView,
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'settings',
    component: SettingsView,
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

export function getRouteComponent(id: AppRoute): ComponentType {
  return getRouteById(id).component;
}
