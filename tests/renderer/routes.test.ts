import { describe, expect, it } from 'vitest';
import {
  APP_ROUTES,
  DEFAULT_ROUTE,
  getRouteById,
  getRouteComponent,
  isAppRoute,
} from '../../src/renderer/routes.js';

describe('routes', () => {
  it('defines eight navigation sections including disk map', () => {
    expect(APP_ROUTES).toHaveLength(8);
    expect(getRouteById('disk-map').label).toBe('Disk Map');
  });

  it('uses overview as the default route', () => {
    expect(DEFAULT_ROUTE).toBe('overview');
    expect(getRouteById(DEFAULT_ROUTE).label).toBe('Overview');
  });

  it('validates known route ids', () => {
    expect(isAppRoute('overview')).toBe(true);
    expect(isAppRoute('settings')).toBe(true);
    expect(isAppRoute('unknown')).toBe(false);
  });

  it('maps each route to a React component', () => {
    for (const route of APP_ROUTES) {
      expect(typeof route.component).toBe('function');
      expect(getRouteComponent(route.id)).toBe(route.component);
    }
  });
});
