import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

export async function createTempFixture(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

export async function writeFileWithSize(
  filePath: string,
  sizeBytes: number,
  fillByte = 0,
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, Buffer.alloc(sizeBytes, fillByte));
}

export async function removeFixture(fixturePath: string): Promise<void> {
  await fs.rm(fixturePath, { recursive: true, force: true });
}
