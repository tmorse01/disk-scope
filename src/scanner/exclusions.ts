import path from 'node:path';
import type { ScanExclusion } from '../shared/types';
import { baseName, normalizePath, parentPath } from './path-utils';

export type ExclusionConfig = {
  paths: string[];
  folderNamePatterns: string[];
};

function pathsEqual(left: string, right: string): boolean {
  if (process.platform === 'win32') {
    return left.toLowerCase() === right.toLowerCase();
  }
  return left === right;
}

function isUnderExcludedPath(targetPath: string, excludedPath: string): boolean {
  const normalizedTarget = normalizePath(targetPath);
  const normalizedExcluded = normalizePath(excludedPath);

  if (pathsEqual(normalizedTarget, normalizedExcluded)) {
    return true;
  }

  const prefix = normalizedExcluded.endsWith(path.sep)
    ? normalizedExcluded
    : `${normalizedExcluded}${path.sep}`;

  if (process.platform === 'win32') {
    return normalizedTarget.toLowerCase().startsWith(prefix.toLowerCase());
  }

  return normalizedTarget.startsWith(prefix);
}

function globPatternToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.');
  const flags = process.platform === 'win32' ? 'i' : '';
  return new RegExp(`^${escaped}$`, flags);
}

export function matchesFolderNamePattern(folderName: string, pattern: string): boolean {
  const trimmedPattern = pattern.trim();
  if (!trimmedPattern) {
    return false;
  }

  return globPatternToRegExp(trimmedPattern).test(folderName);
}

function folderNamesInPath(targetPath: string): string[] {
  const names: string[] = [];
  let current = normalizePath(targetPath);

  while (current) {
    names.unshift(baseName(current));
    const parent = parentPath(current);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return names;
}

export function buildExclusionConfig(exclusions: ScanExclusion[]): ExclusionConfig {
  const paths: string[] = [];
  const folderNamePatterns: string[] = [];

  for (const exclusion of exclusions) {
    const value = exclusion.value.trim();
    if (!value) {
      continue;
    }

    if (exclusion.kind === 'path') {
      paths.push(normalizePath(value));
      continue;
    }

    folderNamePatterns.push(value);
  }

  return { paths, folderNamePatterns };
}

export function shouldExcludePath(targetPath: string, config: ExclusionConfig): boolean {
  if (config.paths.length === 0 && config.folderNamePatterns.length === 0) {
    return false;
  }

  for (const excludedPath of config.paths) {
    if (isUnderExcludedPath(targetPath, excludedPath)) {
      return true;
    }
  }

  if (config.folderNamePatterns.length === 0) {
    return false;
  }

  for (const folderName of folderNamesInPath(targetPath)) {
    if (matchesAnyFolderNamePattern(folderName, config.folderNamePatterns)) {
      return true;
    }
  }

  return false;
}

function matchesAnyFolderNamePattern(folderName: string, patterns: string[]): boolean {
  for (const pattern of patterns) {
    if (matchesFolderNamePattern(folderName, pattern)) {
      return true;
    }
  }
  return false;
}

/**
 * Fast check for folder-name exclusions on a single directory entry name.
 * Used to skip readdir for excluded subtrees without walking ancestor paths.
 */
export function isExcludedFolderEntryName(folderName: string, config: ExclusionConfig): boolean {
  if (config.folderNamePatterns.length === 0) {
    return false;
  }
  return matchesAnyFolderNamePattern(folderName, config.folderNamePatterns);
}
