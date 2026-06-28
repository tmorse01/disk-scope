import fs from 'node:fs';
import path from 'node:path';

/** Absolute path to the committed sample scan tree used by E2E tests. */
export const SAMPLE_TREE_ROOT = path.resolve(__dirname, 'sample-tree');

/** Top-level folder names inside {@link SAMPLE_TREE_ROOT}. */
export const SAMPLE_TREE_FOLDERS = ['alpha', 'beta', 'gamma'] as const;

/** Minimum file count after scanning the sample tree (3 files). */
export const SAMPLE_TREE_MIN_FILE_COUNT = 3;

export function assertSampleTreeFixture(): void {
  if (!fs.existsSync(SAMPLE_TREE_ROOT)) {
    throw new Error(`Missing E2E fixture at ${SAMPLE_TREE_ROOT}`);
  }

  for (const folder of SAMPLE_TREE_FOLDERS) {
    const folderPath = path.join(SAMPLE_TREE_ROOT, folder);
    if (!fs.existsSync(folderPath)) {
      throw new Error(`Missing E2E fixture folder: ${folderPath}`);
    }
  }
}
