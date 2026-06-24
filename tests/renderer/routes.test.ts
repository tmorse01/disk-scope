import { describe, expect, it } from 'vitest';
import {
  APP_ROUTES,
  DEFAULT_ROUTE,
  getRouteById,
  isAppRoute,
} from '../../src/renderer/routes.js';

describe('routes', () => {
  it('defines seven MVP navigation sections', () => {
    expect(APP_ROUTES).toHaveLength(7);
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

  it('maps each route to a view tag name', () => {
    for (const route of APP_ROUTES) {
      expect(route.tagName).toMatch(/-view$/);
      expect(getRouteById(route.id).tagName).toBe(route.tagName);
    }
  });
});
