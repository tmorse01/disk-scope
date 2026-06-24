import { defineConfig } from '@playwright/test';

/**
 * E2E tests for DiskScope Electron flows.
 * First real tests belong to a post-foundation task.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  retries: 0,
  use: {
    trace: 'on-first-retry',
  },
});
