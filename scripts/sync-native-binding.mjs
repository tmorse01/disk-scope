import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(repoRoot, 'native', 'scanner-win');
const targetDir = path.join(repoRoot, 'node_modules', '@diskscope', 'scanner-win');

if (!fs.existsSync(targetDir)) {
  console.warn('[sync-native-binding] skip — @diskscope/scanner-win not installed in node_modules');
  process.exit(0);
}

const nodeFiles = fs.readdirSync(sourceDir).filter((name) => name.endsWith('.node'));
if (nodeFiles.length === 0) {
  console.warn('[sync-native-binding] no .node artifacts in native/scanner-win — run pnpm build:native first');
  process.exit(1);
}

for (const fileName of nodeFiles) {
  fs.copyFileSync(path.join(sourceDir, fileName), path.join(targetDir, fileName));
  console.log(`[sync-native-binding] copied ${fileName}`);
}

for (const fileName of ['index.js', 'index.d.ts']) {
  const sourcePath = path.join(sourceDir, fileName);
  if (fs.existsSync(sourcePath)) {
    fs.copyFileSync(sourcePath, path.join(targetDir, fileName));
  }
}
