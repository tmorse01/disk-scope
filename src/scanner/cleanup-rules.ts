import type { CleanupCandidate, CleanupCandidateCategory, DirectoryNode, RiskLevel } from '../shared/types';
import { normalizePath } from './path-utils';

export type CleanupRuleMatch = {
  ruleId: string;
  label: string;
  risk: RiskLevel;
  recommendation: string;
  category: CleanupCandidateCategory;
};

export type CleanupRuleOptions = {
  developerCleanupEnabled: boolean;
};

type CleanupRule = {
  id: string;
  folderName: string;
  parentFolderName?: string;
  label: string;
  risk: RiskLevel;
  recommendation: string;
  category: CleanupCandidateCategory;
  requiresDevProjectContext?: boolean;
  requiresDotNetContext?: boolean;
  requiresPathSegments?: string[];
};

const CLEANUP_RULES: CleanupRule[] = [
  {
    id: 'user-temp',
    folderName: 'Temp',
    parentFolderName: 'Local',
    label: 'User temp files',
    risk: 'medium',
    recommendation: 'Often safe to clear; close apps first and review contents.',
    category: 'general',
    requiresPathSegments: ['AppData', 'Local', 'Temp'],
  },
  {
    id: 'steam-downloading',
    folderName: 'downloading',
    parentFolderName: 'steamapps',
    label: 'Steam incomplete downloads',
    risk: 'low',
    recommendation: 'Incomplete Steam downloads; safe to remove if no active downloads.',
    category: 'general',
  },
  {
    id: 'node_modules',
    folderName: 'node_modules',
    label: 'Node dependencies',
    risk: 'low',
    recommendation: 'Safe to remove; reinstall with your package manager.',
    category: 'developer',
  },
  {
    id: 'next',
    folderName: '.next',
    label: 'Next.js build output',
    risk: 'low',
    recommendation: 'Rebuild with next build.',
    category: 'developer',
  },
  {
    id: 'dist',
    folderName: 'dist',
    label: 'Build output',
    risk: 'medium',
    recommendation: 'Safe when generated; verify you are not deleting published artifacts.',
    category: 'developer',
    requiresDevProjectContext: true,
  },
  {
    id: 'build',
    folderName: 'build',
    label: 'Build output',
    risk: 'medium',
    recommendation: 'Safe when generated; verify you are not deleting published artifacts.',
    category: 'developer',
    requiresDevProjectContext: true,
  },
  {
    id: 'turbo',
    folderName: '.turbo',
    label: 'Turborepo cache',
    risk: 'low',
    recommendation: 'Safe to remove; Turborepo will rebuild cache entries.',
    category: 'developer',
  },
  {
    id: 'vite',
    folderName: '.vite',
    label: 'Vite cache',
    risk: 'low',
    recommendation: 'Safe to remove; Vite will recreate cache on next dev/build.',
    category: 'developer',
  },
  {
    id: 'pnpm-store',
    folderName: '.pnpm-store',
    label: 'pnpm content store',
    risk: 'medium',
    recommendation: 'Removing may force re-downloads; use pnpm store prune when unsure.',
    category: 'developer',
  },
  {
    id: 'nuget-packages',
    folderName: 'packages',
    parentFolderName: '.nuget',
    label: 'NuGet package cache',
    risk: 'medium',
    recommendation: 'Can reclaim space but may slow future package restores.',
    category: 'developer',
  },
  {
    id: 'bin',
    folderName: 'bin',
    label: '.NET build output',
    risk: 'low',
    recommendation: 'Rebuild the .NET project to regenerate.',
    category: 'developer',
    requiresDotNetContext: true,
  },
  {
    id: 'obj',
    folderName: 'obj',
    label: '.NET intermediate output',
    risk: 'low',
    recommendation: 'Rebuild the .NET project to regenerate.',
    category: 'developer',
    requiresDotNetContext: true,
  },
  {
    id: 'pytest-cache',
    folderName: '.pytest_cache',
    label: 'pytest cache',
    risk: 'low',
    recommendation: 'Safe to remove; pytest recreates cache on next run.',
    category: 'developer',
  },
  {
    id: 'venv',
    folderName: '.venv',
    label: 'Python virtual environment',
    risk: 'medium',
    recommendation: 'Recreate with your environment manager before deleting.',
    category: 'developer',
  },
  {
    id: 'coverage',
    folderName: 'coverage',
    label: 'Test coverage report',
    risk: 'low',
    recommendation: 'Safe to remove; rerun tests to regenerate reports.',
    category: 'developer',
    requiresDevProjectContext: true,
  },
];

const DEV_PROJECT_FILE_MARKERS = [
  'package.json',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
  'tsconfig.json',
  'jsconfig.json',
  'cargo.toml',
  'go.mod',
  'pyproject.toml',
  'requirements.txt',
  'setup.py',
  'pipfile',
  'pom.xml',
  'build.gradle',
  'build.gradle.kts',
  'composer.json',
  'gemfile',
  'makefile',
  'cmakelists.txt',
];

const DEV_PROJECT_FILE_SUFFIXES = ['.csproj', '.fsproj', '.vbproj', '.sln'];

export function parentHasDotNetProject(siblingFileNames: string[]): boolean {
  return siblingFileNames.some((name) => {
    const lower = name.toLowerCase();
    return (
      lower.endsWith('.csproj') ||
      lower.endsWith('.sln') ||
      lower.endsWith('.fsproj') ||
      lower.endsWith('.vbproj')
    );
  });
}

export function parentHasDevProjectContext(
  siblingFileNames: string[],
  siblingDirNames: string[],
): boolean {
  if (parentHasDotNetProject(siblingFileNames)) {
    return true;
  }

  if (siblingDirNames.some((name) => name.toLowerCase() === '.git')) {
    return true;
  }

  return siblingFileNames.some((name) => {
    const lower = name.toLowerCase();
    if (DEV_PROJECT_FILE_MARKERS.includes(lower)) {
      return true;
    }
    return DEV_PROJECT_FILE_SUFFIXES.some((suffix) => lower.endsWith(suffix));
  });
}

function pathContainsSegments(folderPath: string, segments: string[]): boolean {
  const normalized = normalizePath(folderPath).toLowerCase();
  return segments.every((segment) => normalized.includes(segment.toLowerCase()));
}

export function matchCleanupRule(
  folderName: string,
  folderPath: string,
  parentFolderName: string | null,
  devProjectContext: boolean,
  dotNetProjectContext: boolean,
  options: CleanupRuleOptions,
): CleanupRuleMatch | null {
  const normalizedName = folderName.toLowerCase();
  const normalizedParent = parentFolderName?.toLowerCase() ?? null;

  for (const rule of CLEANUP_RULES) {
    if (rule.folderName.toLowerCase() !== normalizedName) {
      continue;
    }

    if (rule.parentFolderName && rule.parentFolderName.toLowerCase() !== normalizedParent) {
      continue;
    }

    if (rule.category === 'developer' && !options.developerCleanupEnabled) {
      continue;
    }

    if (rule.requiresDevProjectContext && !devProjectContext) {
      continue;
    }

    if (rule.requiresDotNetContext && !dotNetProjectContext) {
      continue;
    }

    if (rule.requiresPathSegments && !pathContainsSegments(folderPath, rule.requiresPathSegments)) {
      continue;
    }

    return {
      ruleId: rule.id,
      label: rule.label,
      risk: rule.risk,
      recommendation: rule.recommendation,
      category: rule.category,
    };
  }

  return null;
}

export class CleanupCandidateCollector {
  private readonly matches = new Map<string, CleanupRuleMatch>();
  private readonly options: CleanupRuleOptions;

  constructor(options: CleanupRuleOptions) {
    this.options = options;
  }

  tryRegister(
    folderName: string,
    folderPath: string,
    parentFolderName: string | null,
    devProjectContext: boolean,
    dotNetProjectContext: boolean,
  ): void {
    const match = matchCleanupRule(
      folderName,
      folderPath,
      parentFolderName,
      devProjectContext,
      dotNetProjectContext,
      this.options,
    );
    if (match) {
      this.matches.set(normalizePath(folderPath), match);
    }
  }

  finalize(directoriesById: Record<string, DirectoryNode>): CleanupCandidate[] {
    return finalizeCleanupMatches(this.matches, directoriesById);
  }

  exportMatches(): Map<string, CleanupRuleMatch> {
    return new Map(this.matches);
  }
}

export function finalizeCleanupMatches(
  matches: Map<string, CleanupRuleMatch>,
  directoriesById: Record<string, DirectoryNode>,
): CleanupCandidate[] {
  const byPath = new Map<string, DirectoryNode>();
  for (const node of Object.values(directoriesById)) {
    byPath.set(normalizePath(node.path), node);
  }

  const candidates: CleanupCandidate[] = [];
  for (const [folderPath, match] of matches) {
    const node = byPath.get(folderPath);
    if (!node) {
      continue;
    }

    candidates.push({
      path: node.path,
      name: node.name,
      label: match.label,
      ruleId: match.ruleId,
      sizeBytes: node.sizeBytes,
      fileCount: node.fileCount,
      risk: match.risk,
      recommendation: match.recommendation,
      category: match.category,
    });
  }

  return candidates.sort((left, right) => right.sizeBytes - left.sizeBytes);
}

export function formatExtensionLabel(extension: string | null): string {
  if (!extension) {
    return '[no extension]';
  }
  return extension;
}
