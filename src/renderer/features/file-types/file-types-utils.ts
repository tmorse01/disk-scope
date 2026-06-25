import type { ExtensionSummary } from '../../../shared/types';
import { formatExtensionLabel } from './extension-label';

export type ExtensionSortKey = 'extension' | 'sizeBytes' | 'fileCount';
export type SortDirection = 'asc' | 'desc';

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

export function defaultSortDirectionForExtensionKey(key: ExtensionSortKey): SortDirection {
  return key === 'extension' ? 'asc' : 'desc';
}

export function sortExtensionSummaries(
  summaries: ExtensionSummary[],
  sortKey: ExtensionSortKey,
  direction: SortDirection,
): ExtensionSummary[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...summaries].sort((left, right) => {
    let comparison = 0;

    switch (sortKey) {
      case 'extension':
        comparison = compareStrings(
          formatExtensionLabel(left.extension),
          formatExtensionLabel(right.extension),
        );
        break;
      case 'sizeBytes':
        comparison = left.sizeBytes - right.sizeBytes;
        break;
      case 'fileCount':
        comparison = left.fileCount - right.fileCount;
        break;
    }

    return comparison * multiplier;
  });
}
