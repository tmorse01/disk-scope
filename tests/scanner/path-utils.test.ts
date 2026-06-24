import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  baseName,
  fileExtension,
  normalizePath,
  parentPath,
  pathToNodeId,
} from '../../src/scanner/path-utils';

describe('path-utils', () => {
  it('normalizes paths', () => {
    expect(normalizePath('foo\\bar\\baz')).toBe(path.normalize('foo\\bar\\baz'));
  });

  it('returns parent paths', () => {
    expect(parentPath('C:\\Users\\alice')).toBe('C:\\Users');
    expect(parentPath('C:\\')).toBeNull();
  });

  it('derives stable node ids from normalized paths', () => {
    const normalized = normalizePath('C:\\scan\\root');
    expect(pathToNodeId(normalized)).toBe(normalized);
  });

  it('extracts file extensions', () => {
    expect(fileExtension('C:\\scan\\file.TXT')).toBe('.txt');
    expect(fileExtension('C:\\scan\\README')).toBeNull();
  });

  it('returns base names', () => {
    expect(baseName('C:\\scan\\nested\\file.txt')).toBe('file.txt');
  });
});
