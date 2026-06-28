import { expect, test } from '@playwright/test';
import { closeDiskScope, launchDiskScope } from './helpers/electron-app';

test.describe('app launches', () => {
  test('shows DiskScope branding and primary navigation', async () => {
    const { app, window, userDataDir } = await launchDiskScope();

    try {
      await expect(window.getByRole('heading', { name: 'DiskScope', level: 1 })).toBeVisible();
      await expect(window.getByRole('navigation', { name: 'Primary' })).toBeVisible();
      await expect(window.getByRole('button', { name: 'Overview' })).toBeVisible();
      await expect(window.getByRole('button', { name: 'Largest Folders' })).toBeVisible();
      await expect(window.getByRole('heading', { name: 'Overview', level: 2 })).toBeVisible();
    } finally {
      await closeDiskScope(app, userDataDir);
    }
  });
});
