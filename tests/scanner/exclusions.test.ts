import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildExclusionConfig,
  matchesFolderNamePattern,
  shouldExcludePath,
} from '../../src/scanner/exclusions';

describe('exclusions', () => {
  describe('matchesFolderNamePattern', () => {
    it('matches exact folder names', () => {
      expect(matchesFolderNamePattern('node_modules', 'node_modules')).toBe(true);
      expect(matchesFolderNamePattern('src', 'node_modules')).toBe(false);
    });

    it('supports wildcard patterns', () => {
      expect(matchesFolderNamePattern('node_modules', 'node_*')).toBe(true);
      expect(matchesFolderNamePattern('node_tools', 'node_*')).toBe(true);
      expect(matchesFolderNamePattern('modules', 'node_*')).toBe(false);
      expect(matchesFolderNamePattern('.git', '.*')).toBe(true);
    });
  });

  describe('shouldExcludePath', () => {
    it('excludes exact paths and descendants', () => {
      const config = buildExclusionConfig([
        { id: '1', kind: 'path', value: path.join('C:', 'Projects', 'skip-me') },
      ]);

      expect(shouldExcludePath(path.join('C:', 'Projects', 'skip-me'), config)).toBe(true);
      expect(shouldExcludePath(path.join('C:', 'Projects', 'skip-me', 'nested', 'file.txt'), config)).toBe(
        true,
      );
      expect(shouldExcludePath(path.join('C:', 'Projects', 'keep-me'), config)).toBe(false);
    });

    it('excludes paths when a folder name pattern matches', () => {
      const config = buildExclusionConfig([
        { id: '1', kind: 'folder-name', value: 'node_modules' },
      ]);

      expect(
        shouldExcludePath(path.join('C:', 'Projects', 'app', 'node_modules', 'pkg', 'index.js'), config),
      ).toBe(true);
      expect(shouldExcludePath(path.join('C:', 'Projects', 'app', 'src', 'index.ts'), config)).toBe(
        false,
      );
    });

    it('ignores blank exclusion values', () => {
      const config = buildExclusionConfig([
        { id: '1', kind: 'path', value: '   ' },
        { id: '2', kind: 'folder-name', value: '' },
      ]);

      expect(shouldExcludePath(path.join('C:', 'Projects', 'app'), config)).toBe(false);
    });
  });
});
