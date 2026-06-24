import { test } from '@playwright/test';

/**
 * Placeholder — full Electron E2E via Playwright `_electron.launch()` is a follow-up
 * after the React migration. Example:
 *
 *   const app = await electron.launch({ args: ['.vite/build/main.js'] });
 *   const window = await app.firstWindow();
 *   await expect(window.getByText('DiskScope')).toBeVisible();
 *
 * For layout-only checks without Electron, use `pnpm dev:renderer-preview`.
 */
test.skip('app launches', () => {
  // TODO: wire launch args to Forge dev/build output
});
