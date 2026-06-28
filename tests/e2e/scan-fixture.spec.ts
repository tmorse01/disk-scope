import { expect, test } from '@playwright/test';
import {
  SAMPLE_TREE_FOLDERS,
  SAMPLE_TREE_ROOT,
  assertSampleTreeFixture,
} from './fixtures/sample-tree-manifest';
import { closeDiskScope, launchDiskScope } from './helpers/electron-app';

test.describe('scan fixture', () => {
  test.beforeAll(() => {
    assertSampleTreeFixture();
  });

  test('completes fixture scan and shows folder rankings', async () => {
    const { app, window, userDataDir } = await launchDiskScope({ scanRoot: SAMPLE_TREE_ROOT });

    try {
      await expect
        .poll(async () => {
          const scanning = await window.getByRole('heading', { name: 'Scanning' }).isVisible();
          const complete = await window.getByRole('heading', { name: 'Scan complete' }).isVisible();
          return scanning || complete;
        })
        .toBe(true);

      await expect(window.getByRole('heading', { name: 'Scan complete' })).toBeVisible({
        timeout: 60_000,
      });

      await expect(window.getByText('total scanned')).toBeVisible();
      await expect(
        window.locator('text=Files').locator('..').getByText('3', { exact: true }),
      ).toBeVisible();

      await window
        .getByRole('navigation', { name: 'Primary' })
        .getByRole('button', { name: 'Largest Folders', exact: true })
        .click();
      await expect(window.getByRole('heading', { name: 'Largest Folders', level: 2 })).toBeVisible();

      for (const folderName of SAMPLE_TREE_FOLDERS) {
        await expect(window.getByRole('row').filter({ hasText: folderName }).first()).toBeVisible({
          timeout: 10_000,
        });
      }
    } finally {
      await closeDiskScope(app, userDataDir);
    }
  });
});
