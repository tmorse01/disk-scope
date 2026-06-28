import { existsSync } from 'node:fs';
import path from 'node:path';

export type E2eAutostartConfig = {
  rootPath: string;
};

export function isE2eMode(): boolean {
  return process.env.DISKSCOPE_E2E === '1';
}

export function getE2eScanRoot(): string | null {
  if (!isE2eMode()) {
    return null;
  }

  const raw = process.env.DISKSCOPE_E2E_SCAN_ROOT?.trim();
  if (!raw) {
    console.error('[e2e] DISKSCOPE_E2E=1 but DISKSCOPE_E2E_SCAN_ROOT is not set');
    return null;
  }

  const resolved = path.resolve(raw);
  if (!existsSync(resolved)) {
    console.error(`[e2e] scan root does not exist: ${resolved}`);
    return null;
  }

  return resolved;
}

export function getE2eAutostartConfig(): E2eAutostartConfig | null {
  const rootPath = getE2eScanRoot();
  return rootPath ? { rootPath } : null;
}
