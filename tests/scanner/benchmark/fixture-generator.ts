import fs from 'node:fs/promises';
import path from 'node:path';
import { writeFileWithSize } from '../fixture-utils';

export type BenchmarkFixtureKind = 'shallow-wide' | 'deep-narrow' | 'balanced-tree';

export type BenchmarkFixtureSpec = {
  kind: BenchmarkFixtureKind;
  fileCount: number;
};

export async function createBenchmarkFixture(
  root: string,
  spec: BenchmarkFixtureSpec,
): Promise<void> {
  switch (spec.kind) {
    case 'shallow-wide':
      await createShallowWide(root, spec.fileCount);
      break;
    case 'deep-narrow':
      await createDeepNarrow(root, spec.fileCount);
      break;
    case 'balanced-tree':
      await createBalancedTree(root, spec.fileCount);
      break;
  }
}

async function createShallowWide(root: string, fileCount: number): Promise<void> {
  const batchSize = 50;
  for (let index = 0; index < fileCount; index += 1) {
    await writeFileWithSize(path.join(root, `file-${index}.dat`), 64);
    if (index > 0 && index % batchSize === 0) {
      await fs.mkdir(path.join(root, `subdir-${index}`), { recursive: true });
    }
  }
}

async function createDeepNarrow(root: string, depth: number): Promise<void> {
  let current = root;
  for (let level = 0; level < depth; level += 1) {
    current = path.join(current, `level-${level}`);
    await fs.mkdir(current, { recursive: true });
    await writeFileWithSize(path.join(current, `leaf-${level}.dat`), 32);
  }
}

async function createBalancedTree(root: string, fileCount: number): Promise<void> {
  const branchFactor = 5;
  let created = 0;
  const queue: string[] = [root];

  while (created < fileCount && queue.length > 0) {
    const dir = queue.shift();
    if (!dir) {
      break;
    }

    for (let branch = 0; branch < branchFactor && created < fileCount; branch += 1) {
      const childDir = path.join(dir, `d${created}-${branch}`);
      await fs.mkdir(childDir, { recursive: true });
      await writeFileWithSize(path.join(childDir, `f${created}.dat`), 48);
      created += 1;
      if (created < fileCount) {
        queue.push(childDir);
      }
    }
  }
}
