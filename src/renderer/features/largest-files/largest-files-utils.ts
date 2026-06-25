import type { LargestFileEntry } from '../../../shared/types';
import { formatExtensionLabel } from '../file-types/extension-label';

export type LargestFileSortKey = 'name' | 'path' | 'sizeBytes' | 'extension' | 'modifiedAt';
export type SortDirection = 'asc' | 'desc';

function compareStrings(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

export function defaultSortDirectionForLargestFileKey(key: LargestFileSortKey): SortDirection {
  return key === 'sizeBytes' || key === 'modifiedAt' ? 'desc' : 'asc';
}

export function sortLargestFiles(
  files: LargestFileEntry[],
  sortKey: LargestFileSortKey,
  direction: SortDirection,
): LargestFileEntry[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...files].sort((left, right) => {
    let comparison = 0;

    switch (sortKey) {
      case 'name':
        comparison = compareStrings(left.name, right.name);
        break;
      case 'path':
        comparison = compareStrings(left.path, right.path);
        break;
      case 'sizeBytes':
        comparison = left.sizeBytes - right.sizeBytes;
        break;
      case 'extension':
        comparison = compareStrings(
          formatExtensionLabel(left.extension),
          formatExtensionLabel(right.extension),
        );
        break;
      case 'modifiedAt':
        comparison = compareStrings(left.modifiedAt ?? '', right.modifiedAt ?? '');
        break;
    }

    return comparison * multiplier;
  });
}

export function formatModifiedAt(iso?: string): string {
  if (!iso) {
    return '—';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleString();
}
