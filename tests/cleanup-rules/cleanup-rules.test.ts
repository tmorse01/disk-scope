import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CleanupCandidateCollector,
  matchCleanupRule,
  parentHasDotNetProject,
} from '../../src/scanner/cleanup-rules';
import type { DirectoryNode } from '../../src/shared/types';

function createDirectoryNode(
  dirPath: string,
  overrides: Partial<DirectoryNode> = {},
): DirectoryNode {
  return {
    id: dirPath,
    parentId: null,
    name: path.basename(dirPath),
    path: dirPath,
    sizeBytes: 0,
    fileCount: 0,
    directoryCount: 0,
    childDirectoryIds: [],
    unreadable: false,
    ...overrides,
  };
}

describe('cleanup-rules', () => {
  describe('parentHasDotNetProject', () => {
    it('recognizes .NET project marker files among siblings', () => {
      expect(parentHasDotNetProject(['App.csproj', 'Program.cs'])).toBe(true);
      expect(parentHasDotNetProject(['Solution.sln'])).toBe(true);
      expect(parentHasDotNetProject(['App.fsproj'])).toBe(true);
      expect(parentHasDotNetProject(['App.vbproj'])).toBe(true);
    });

    it('ignores unrelated sibling files', () => {
      expect(parentHasDotNetProject(['package.json', 'readme.md'])).toBe(false);
      expect(parentHasDotNetProject(['dotnet'])).toBe(false);
    });
  });

  describe('matchCleanupRule', () => {
    it.each([
      ['node_modules', 'node_modules'],
      ['.next', 'next'],
      ['dist', 'dist'],
      ['build', 'build'],
      ['.turbo', 'turbo'],
      ['.vite', 'vite'],
      ['.pnpm-store', 'pnpm-store'],
      ['.pytest_cache', 'pytest-cache'],
      ['.venv', 'venv'],
      ['coverage', 'coverage'],
    ])('matches %s to rule %s', (folderName, ruleId) => {
      const match = matchCleanupRule(folderName, folderName, null, false);
      expect(match?.ruleId).toBe(ruleId);
    });

    it('matches .nuget/packages only under a .nuget parent', () => {
      const match = matchCleanupRule(
        'packages',
        path.join('C:', 'Users', 'dev', '.nuget', 'packages'),
        '.nuget',
        false,
      );

      expect(match?.ruleId).toBe('nuget-packages');
      expect(match?.risk).toBe('medium');
    });

    it('does not match packages without .nuget parent', () => {
      expect(matchCleanupRule('packages', '/tmp/packages', 'tmp', false)).toBeNull();
    });

    it('does not match bin without .NET project context', () => {
      expect(matchCleanupRule('bin', '/usr/bin', 'usr', false)).toBeNull();
    });

    it('matches bin and obj when parent has .NET project context', () => {
      const binMatch = matchCleanupRule(
        'bin',
        path.join('/repo/MyApp', 'bin'),
        'MyApp',
        true,
      );
      const objMatch = matchCleanupRule(
        'obj',
        path.join('/repo/MyApp', 'obj'),
        'MyApp',
        true,
      );

      expect(binMatch?.ruleId).toBe('bin');
      expect(objMatch?.ruleId).toBe('obj');
      expect(binMatch?.risk).toBe('low');
      expect(objMatch?.risk).toBe('low');
    });
  });

  describe('risk labels', () => {
    it('assigns expected risk levels for common dev folders', () => {
      expect(matchCleanupRule('node_modules', 'node_modules', null, false)?.risk).toBe('low');
      expect(matchCleanupRule('.next', '.next', null, false)?.risk).toBe('low');
      expect(matchCleanupRule('dist', 'dist', null, false)?.risk).toBe('medium');
      expect(matchCleanupRule('.pnpm-store', '.pnpm-store', null, false)?.risk).toBe('medium');
      expect(matchCleanupRule('.venv', '.venv', null, false)?.risk).toBe('medium');
    });

    it('includes recommendations for every built-in rule', () => {
      const folders = [
        'node_modules',
        '.next',
        'dist',
        'build',
        '.turbo',
        '.vite',
        '.pnpm-store',
        '.pytest_cache',
        '.venv',
        'coverage',
      ];

      for (const folder of folders) {
        const match = matchCleanupRule(folder, folder, null, false);
        expect(match?.recommendation.length).toBeGreaterThan(10);
      }
    });
  });

  describe('CleanupCandidateCollector', () => {
    it('finalizes candidates with directory sizes sorted largest first', () => {
      const root = '/workspace';
      const nodeModules = path.join(root, 'app', 'node_modules');
      const dist = path.join(root, 'app', 'dist');
      const app = path.join(root, 'app');

      const directoriesById = {
        [root]: createDirectoryNode(root, { sizeBytes: 900, directoryCount: 1 }),
        [app]: createDirectoryNode(app, {
          parentId: root,
          sizeBytes: 900,
          directoryCount: 2,
        }),
        [nodeModules]: createDirectoryNode(nodeModules, {
          parentId: app,
          sizeBytes: 500,
          fileCount: 40,
        }),
        [dist]: createDirectoryNode(dist, {
          parentId: app,
          sizeBytes: 400,
          fileCount: 8,
        }),
      };

      const collector = new CleanupCandidateCollector();
      collector.tryRegister('node_modules', nodeModules, 'app', false);
      collector.tryRegister('dist', dist, 'app', false);

      const candidates = collector.finalize(directoriesById);

      expect(candidates).toHaveLength(2);
      expect(candidates[0]?.ruleId).toBe('node_modules');
      expect(candidates[0]?.sizeBytes).toBe(500);
      expect(candidates[1]?.ruleId).toBe('dist');
      expect(candidates[1]?.recommendation).toContain('generated');
    });

    it('includes .NET bin only when parent has project context', () => {
      const projectRoot = '/repo/MyApp';
      const binDir = path.join(projectRoot, 'bin');
      const systemBin = '/usr/bin';

      const directoriesById = {
        [projectRoot]: createDirectoryNode(projectRoot, { sizeBytes: 300 }),
        [binDir]: createDirectoryNode(binDir, {
          parentId: projectRoot,
          sizeBytes: 200,
          fileCount: 5,
        }),
        [systemBin]: createDirectoryNode(systemBin, {
          parentId: '/usr',
          sizeBytes: 999,
          fileCount: 100,
        }),
      };

      const collector = new CleanupCandidateCollector();
      collector.tryRegister('bin', binDir, 'MyApp', true);
      collector.tryRegister('bin', systemBin, 'usr', false);

      const candidates = collector.finalize(directoriesById);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]?.path).toBe(binDir);
      expect(candidates[0]?.label).toBe('.NET build output');
    });
  });
});
