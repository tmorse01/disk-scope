import type { CleanupCandidate, DirectoryNode, RiskLevel } from '../shared/types';
import { normalizePath } from './path-utils';

export type CleanupRuleMatch = {
  ruleId: string;
  label: string;
  risk: RiskLevel;
  recommendation: string;
};

type CleanupRule = {
  id: string;
  folderName: string;
  parentFolderName?: string;
  label: string;
  risk: RiskLevel;
  recommendation: string;
  requiresDotNetContext?: boolean;
};

const CLEANUP_RULES: CleanupRule[] = [
  {
    id: 'node_modules',
    folderName: 'node_modules',
    label: 'Node dependencies',
    risk: 'low',
    recommendation: 'Safe to remove; reinstall with your package manager.',
  },
  {
    id: 'next',
    folderName: '.next',
    label: 'Next.js build output',
    risk: 'low',
    recommendation: 'Rebuild with next build.',
  },
  {
    id: 'dist',
    folderName: 'dist',
    label: 'Build output',
    risk: 'medium',
    recommendation: 'Safe when generated; verify you are not deleting published artifacts.',
  },
  {
    id: 'build',
    folderName: 'build',
    label: 'Build output',
    risk: 'medium',
    recommendation: 'Safe when generated; verify you are not deleting published artifacts.',
  },
  {
    id: 'turbo',
    folderName: '.turbo',
    label: 'Turborepo cache',
    risk: 'low',
    recommendation: 'Safe to remove; Turborepo will rebuild cache entries.',
  },
  {
    id: 'vite',
    folderName: '.vite',
    label: 'Vite cache',
    risk: 'low',
    recommendation: 'Safe to remove; Vite will recreate cache on next dev/build.',
  },
  {
    id: 'pnpm-store',
    folderName: '.pnpm-store',
    label: 'pnpm content store',
    risk: 'medium',
    recommendation: 'Removing may force re-downloads; use pnpm store prune when unsure.',
  },
  {
    id: 'nuget-packages',
    folderName: 'packages',
    parentFolderName: '.nuget',
    label: 'NuGet package cache',
    risk: 'medium',
    recommendation: 'Can reclaim space but may slow future package restores.',
  },
  {
    id: 'bin',
    folderName: 'bin',
    label: '.NET build output',
    risk: 'low',
    recommendation: 'Rebuild the .NET project to regenerate.',
    requiresDotNetContext: true,
  },
  {
    id: 'obj',
    folderName: 'obj',
    label: '.NET intermediate output',
    risk: 'low',
    recommendation: 'Rebuild the .NET project to regenerate.',
    requiresDotNetContext: true,
  },
  {
    id: 'pytest-cache',
    folderName: '.pytest_cache',
    label: 'pytest cache',
    risk: 'low',
    recommendation: 'Safe to remove; pytest recreates cache on next run.',
  },
  {
    id: 'venv',
    folderName: '.venv',
    label: 'Python virtual environment',
    risk: 'medium',
    recommendation: 'Recreate with your environment manager before deleting.',
  },
  {
    id: 'coverage',
    folderName: 'coverage',
    label: 'Test coverage report',
    risk: 'low',
    recommendation: 'Safe to remove; rerun tests to regenerate reports.',
  },
];

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

export function matchCleanupRule(
  folderName: string,
  folderPath: string,
  parentFolderName: string | null,
  parentHasDotNet: boolean,
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

    if (rule.requiresDotNetContext && !parentHasDotNet) {
      continue;
    }

    void folderPath;
    return {
      ruleId: rule.id,
      label: rule.label,
      risk: rule.risk,
      recommendation: rule.recommendation,
    };
  }

  return null;
}

export class CleanupCandidateCollector {
  private readonly matches = new Map<string, CleanupRuleMatch>();

  tryRegister(
    folderName: string,
    folderPath: string,
    parentFolderName: string | null,
    parentHasDotNet: boolean,
  ): void {
    const match = matchCleanupRule(folderName, folderPath, parentFolderName, parentHasDotNet);
    if (match) {
      this.matches.set(normalizePath(folderPath), match);
    }
  }

  finalize(directoriesById: Record<string, DirectoryNode>): CleanupCandidate[] {
    const byPath = new Map<string, DirectoryNode>();
    for (const node of Object.values(directoriesById)) {
      byPath.set(normalizePath(node.path), node);
    }

    const candidates: CleanupCandidate[] = [];
    for (const [folderPath, match] of this.matches) {
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
      });
    }

    return candidates.sort((left, right) => right.sizeBytes - left.sizeBytes);
  }
}

export function formatExtensionLabel(extension: string | null): string {
  if (!extension) {
    return '[no extension]';
  }
  return extension;
}
