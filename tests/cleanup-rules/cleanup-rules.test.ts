import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  CleanupCandidateCollector,
  matchCleanupRule,
  parentHasDevProjectContext,
  parentHasDotNetProject,
  pathContainsConsecutiveSegments,
  pathContainsOrderedSegments,
} from '../../src/scanner/cleanup-rules';
import type { DirectoryNode } from '../../src/shared/types';

const DEV_OPTS = { developerCleanupEnabled: true };
const DEFAULT_OPTS = { developerCleanupEnabled: false };

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
  describe('path segment matching', () => {
    it('matches consecutive AppData\\Local\\Temp segments only', () => {
      const valid = path.join('C:', 'Users', 'alice', 'AppData', 'Local', 'Temp');
      const invalid = path.join('C:', 'Users', 'alice', 'AppData', 'Other', 'Local', 'Temp');

      expect(pathContainsConsecutiveSegments(valid, ['AppData', 'Local', 'Temp'])).toBe(true);
      expect(pathContainsConsecutiveSegments(invalid, ['AppData', 'Local', 'Temp'])).toBe(false);
    });

    it('matches ordered browser profile segments with a profile folder in between', () => {
      const chromeCache = path.join(
        'C:',
        'Users',
        'alice',
        'AppData',
        'Local',
        'Google',
        'Chrome',
        'User Data',
        'Default',
        'Cache',
      );

      expect(
        pathContainsOrderedSegments(chromeCache, ['Google', 'Chrome', 'User Data']),
      ).toBe(true);
      expect(pathContainsConsecutiveSegments(chromeCache, ['Google', 'Chrome', 'User Data'])).toBe(
        true,
      );
    });
  });

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

  describe('parentHasDevProjectContext', () => {
    it('recognizes common project marker files', () => {
      expect(parentHasDevProjectContext(['package.json'], [])).toBe(true);
      expect(parentHasDevProjectContext(['Cargo.toml'], [])).toBe(true);
      expect(parentHasDevProjectContext(['go.mod'], [])).toBe(true);
    });

    it('recognizes .git among sibling directories', () => {
      expect(parentHasDevProjectContext([], ['src', '.git'])).toBe(true);
    });

    it('ignores unrelated siblings', () => {
      expect(parentHasDevProjectContext(['readme.md'], ['assets'])).toBe(false);
    });
  });

  describe('matchCleanupRule', () => {
    it.each([
      ['node_modules', 'node_modules'],
      ['.next', 'next'],
      ['.turbo', 'turbo'],
      ['.vite', 'vite'],
      ['.pnpm-store', 'pnpm-store'],
      ['.pytest_cache', 'pytest-cache'],
      ['.venv', 'venv'],
    ])('matches developer rule %s when developer mode is on and project context exists', (folderName, ruleId) => {
      const match = matchCleanupRule(folderName, folderName, null, true, false, DEV_OPTS);
      expect(match?.ruleId).toBe(ruleId);
      expect(match?.category).toBe('developer');
    });

    it.each([
      ['node_modules', 'node_modules'],
      ['.next', '.next'],
      ['.turbo', '.turbo'],
      ['.vite', '.vite'],
      ['.pytest_cache', '.pytest_cache'],
      ['.venv', '.venv'],
    ])('does not match developer rule %s without project context', (folderName) => {
      expect(matchCleanupRule(folderName, folderName, null, false, false, DEV_OPTS)).toBeNull();
    });

    it('does not match developer rules when developer mode is off', () => {
      expect(
        matchCleanupRule('node_modules', 'node_modules', null, true, false, DEFAULT_OPTS),
      ).toBeNull();
      expect(matchCleanupRule('.next', '.next', null, true, false, DEFAULT_OPTS)).toBeNull();
    });

    it('does not match dist or build without dev project context', () => {
      const installedAppDist = path.join('C:', 'Program Files', 'SomeApp', 'dist');
      expect(
        matchCleanupRule('dist', installedAppDist, 'SomeApp', false, false, DEV_OPTS),
      ).toBeNull();
      expect(
        matchCleanupRule('build', path.join('C:', 'Apps', 'build'), 'Apps', false, false, DEV_OPTS),
      ).toBeNull();
      expect(
        matchCleanupRule('coverage', path.join('/tmp', 'coverage'), 'tmp', false, false, DEV_OPTS),
      ).toBeNull();
    });

    it('matches dist and build with dev project context when developer mode is on', () => {
      const distPath = path.join('/repo', 'app', 'dist');
      const match = matchCleanupRule('dist', distPath, 'app', true, false, DEV_OPTS);
      expect(match?.ruleId).toBe('dist');
      expect(match?.category).toBe('developer');
    });

    it('does not match dist even with dev context when developer mode is off', () => {
      const distPath = path.join('/repo', 'app', 'dist');
      expect(matchCleanupRule('dist', distPath, 'app', true, false, DEFAULT_OPTS)).toBeNull();
    });

    it('matches .nuget/packages only under a .nuget parent', () => {
      const match = matchCleanupRule(
        'packages',
        path.join('C:', 'Users', 'dev', '.nuget', 'packages'),
        '.nuget',
        false,
        false,
        DEV_OPTS,
      );

      expect(match?.ruleId).toBe('nuget-packages');
      expect(match?.risk).toBe('medium');
    });

    it('does not match packages without .nuget parent', () => {
      expect(
        matchCleanupRule('packages', '/tmp/packages', 'tmp', false, false, DEV_OPTS),
      ).toBeNull();
    });

    it('does not match bin without .NET project context', () => {
      expect(matchCleanupRule('bin', '/usr/bin', 'usr', false, false, DEV_OPTS)).toBeNull();
    });

    it('matches bin and obj when parent has .NET project context', () => {
      const binMatch = matchCleanupRule(
        'bin',
        path.join('/repo/MyApp', 'bin'),
        'MyApp',
        false,
        true,
        DEV_OPTS,
      );
      const objMatch = matchCleanupRule(
        'obj',
        path.join('/repo/MyApp', 'obj'),
        'MyApp',
        false,
        true,
        DEV_OPTS,
      );

      expect(binMatch?.ruleId).toBe('bin');
      expect(objMatch?.ruleId).toBe('obj');
      expect(binMatch?.risk).toBe('low');
      expect(objMatch?.risk).toBe('low');
    });

    it('matches user temp under AppData\\Local\\Temp regardless of developer mode', () => {
      const tempPath = path.join('C:', 'Users', 'alice', 'AppData', 'Local', 'Temp');
      const match = matchCleanupRule('Temp', tempPath, 'Local', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('user-temp');
      expect(match?.category).toBe('general');
    });

    it('does not match Temp folders outside AppData\\Local\\Temp', () => {
      expect(
        matchCleanupRule('Temp', path.join('C:', 'Windows', 'Temp'), 'Windows', false, false, DEFAULT_OPTS),
      ).toBeNull();
      expect(
        matchCleanupRule(
          'Temp',
          path.join('C:', 'Users', 'alice', 'AppData', 'Other', 'Local', 'Temp'),
          'Local',
          false,
          false,
          DEFAULT_OPTS,
        ),
      ).toBeNull();
    });

    it('matches Steam steamapps\\downloading regardless of developer mode', () => {
      const steamPath = path.join('D:', 'Steam', 'steamapps', 'downloading');
      const match = matchCleanupRule('downloading', steamPath, 'steamapps', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('steam-downloading');
      expect(match?.category).toBe('general');
    });

    it('matches npm user cache under AppData\\Local\\npm-cache', () => {
      const npmCachePath = path.join('C:', 'Users', 'alice', 'AppData', 'Local', 'npm-cache');
      const match = matchCleanupRule('npm-cache', npmCachePath, 'Local', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('npm-user-cache');
      expect(match?.category).toBe('general');
    });

    it('matches pip cache under AppData\\Local\\pip\\Cache', () => {
      const pipCachePath = path.join('C:', 'Users', 'alice', 'AppData', 'Local', 'pip', 'Cache');
      const match = matchCleanupRule('Cache', pipCachePath, 'pip', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('pip-cache');
      expect(match?.category).toBe('general');
    });

    it('matches Chrome browser cache under User Data profiles', () => {
      const chromeCachePath = path.join(
        'C:',
        'Users',
        'alice',
        'AppData',
        'Local',
        'Google',
        'Chrome',
        'User Data',
        'Default',
        'Cache',
      );
      const match = matchCleanupRule('Cache', chromeCachePath, 'Default', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('chrome-cache');
      expect(match?.risk).toBe('medium');
    });

    it('matches Edge browser cache under User Data profiles', () => {
      const edgeCachePath = path.join(
        'C:',
        'Users',
        'alice',
        'AppData',
        'Local',
        'Microsoft',
        'Edge',
        'User Data',
        'Default',
        'Cache',
      );
      const match = matchCleanupRule('Cache', edgeCachePath, 'Default', false, false, DEFAULT_OPTS);
      expect(match?.ruleId).toBe('edge-cache');
    });

    it('matches Firefox cache2 under Profiles', () => {
      const firefoxCachePath = path.join(
        'C:',
        'Users',
        'alice',
        'AppData',
        'Local',
        'Mozilla',
        'Firefox',
        'Profiles',
        'abc123.default-release',
        'cache2',
      );
      const match = matchCleanupRule(
        'cache2',
        firefoxCachePath,
        'abc123.default-release',
        false,
        false,
        DEFAULT_OPTS,
      );
      expect(match?.ruleId).toBe('firefox-cache');
    });
  });

  describe('risk labels', () => {
    it('assigns expected risk levels for common dev folders', () => {
      expect(
        matchCleanupRule('node_modules', 'node_modules', null, true, false, DEV_OPTS)?.risk,
      ).toBe('low');
      expect(matchCleanupRule('.next', '.next', null, true, false, DEV_OPTS)?.risk).toBe('low');
      expect(
        matchCleanupRule('dist', path.join('/repo', 'dist'), 'repo', true, false, DEV_OPTS)?.risk,
      ).toBe('medium');
      expect(
        matchCleanupRule('.pnpm-store', '.pnpm-store', null, true, false, DEV_OPTS)?.risk,
      ).toBe('medium');
      expect(matchCleanupRule('.venv', '.venv', null, true, false, DEV_OPTS)?.risk).toBe('medium');
    });

    it('includes recommendations for every built-in rule', () => {
      const folders: Array<[string, boolean, boolean]> = [
        ['node_modules', true, false],
        ['.next', true, false],
        ['dist', true, false],
        ['build', true, false],
        ['.turbo', true, false],
        ['.vite', true, false],
        ['.pnpm-store', true, false],
        ['.pytest_cache', true, false],
        ['.venv', true, false],
        ['coverage', true, false],
      ];

      for (const [folder, devContext, dotNetContext] of folders) {
        const match = matchCleanupRule(folder, folder, null, devContext, dotNetContext, DEV_OPTS);
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

      const collector = new CleanupCandidateCollector(DEV_OPTS);
      collector.tryRegister('node_modules', nodeModules, 'app', true, false);
      collector.tryRegister('dist', dist, 'app', true, false);

      const candidates = collector.finalize(directoriesById);

      expect(candidates).toHaveLength(2);
      expect(candidates[0]?.ruleId).toBe('node_modules');
      expect(candidates[0]?.sizeBytes).toBe(500);
      expect(candidates[0]?.category).toBe('developer');
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

      const collector = new CleanupCandidateCollector(DEV_OPTS);
      collector.tryRegister('bin', binDir, 'MyApp', false, true);
      collector.tryRegister('bin', systemBin, 'usr', false, false);

      const candidates = collector.finalize(directoriesById);

      expect(candidates).toHaveLength(1);
      expect(candidates[0]?.path).toBe(binDir);
      expect(candidates[0]?.label).toBe('.NET build output');
    });

    it('skips developer folders when developer mode is off', () => {
      const root = '/workspace';
      const nodeModules = path.join(root, 'node_modules');

      const directoriesById = {
        [root]: createDirectoryNode(root, { sizeBytes: 500 }),
        [nodeModules]: createDirectoryNode(nodeModules, {
          parentId: root,
          sizeBytes: 500,
          fileCount: 10,
        }),
      };

      const collector = new CleanupCandidateCollector(DEFAULT_OPTS);
      collector.tryRegister('node_modules', nodeModules, 'workspace', true, false);

      expect(collector.finalize(directoriesById)).toHaveLength(0);
    });
  });
});
