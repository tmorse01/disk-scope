import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  _electron as electron,
  type ElectronApplication,
  type Page,
} from '@playwright/test';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const MAIN_SCRIPT = path.join(REPO_ROOT, '.vite/build/main.js');

export type LaunchDiskScopeOptions = {
  scanRoot?: string;
  userDataDir?: string;
};

export type LaunchedDiskScope = {
  app: ElectronApplication;
  window: Page;
  userDataDir: string;
};

export function getMainScriptPath(): string {
  return MAIN_SCRIPT;
}

export function assertPackagedBuildExists(): void {
  if (!existsSync(MAIN_SCRIPT)) {
    throw new Error(
      `Electron build output missing at ${MAIN_SCRIPT}. Run "pnpm package" before E2E tests.`,
    );
  }
}

export async function launchDiskScope(
  options: LaunchDiskScopeOptions = {},
): Promise<LaunchedDiskScope> {
  assertPackagedBuildExists();

  const userDataDir =
    options.userDataDir ?? (await fs.mkdtemp(path.join(os.tmpdir(), 'diskscope-e2e-')));

  const env: Record<string, string> = {
    ...Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => entry[1] !== undefined),
    ),
    NODE_ENV: 'production',
  };

  if (options.scanRoot) {
    env.DISKSCOPE_E2E = '1';
    env.DISKSCOPE_E2E_SCAN_ROOT = path.resolve(options.scanRoot);
  }

  const app = await electron.launch({
    args: [MAIN_SCRIPT, `--user-data-dir=${userDataDir}`],
    env,
    cwd: REPO_ROOT,
  });

  const window = await app.firstWindow();
  await window.waitForLoadState('domcontentloaded');

  return { app, window, userDataDir };
}

export async function closeDiskScope(
  app: ElectronApplication,
  userDataDir?: string,
): Promise<void> {
  await app.close();

  if (userDataDir) {
    await fs.rm(userDataDir, { recursive: true, force: true });
  }
}
