const { existsSync } = require('node:fs');
const { join } = require('node:path');

const triple = `${process.platform}-${process.arch}`;
const candidates = [
  join(__dirname, `scanner-win.${triple}.node`),
  join(__dirname, 'scanner-win.win32-x64-msvc.node'),
  join(__dirname, 'scanner-win.win32-arm64-msvc.node'),
];

const bindingPath = candidates.find((candidate) => existsSync(candidate));
if (!bindingPath) {
  throw new Error(
    `Native scanner-win addon not found. Run "pnpm build:native" on Windows with Rust installed.`,
  );
}

module.exports = require(bindingPath);
