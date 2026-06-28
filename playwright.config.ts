import { defineConfig } from '@playwright/test';

/**
 * Electron E2E tests for DiskScope.
 *
 * Prerequisite: build packaged artifacts first.
 *   pnpm package
 *   pnpm test:e2e
 *
 * Or use the combined CI script:
 *   pnpm test:e2e:ci
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: {
    timeout: 15_000,
  },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  fullyParallel: false,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  use: {
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
  },
  outputDir: './tests/e2e/test-results',
});
