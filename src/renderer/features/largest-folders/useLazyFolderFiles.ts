import { useCallback, useState } from 'react';
import type { DirectoryListingEntry, NodeId } from '../../../shared/types';
import { isErr } from '../../../shared/result';

export function useLazyFolderFiles() {
  const [fileCache, setFileCache] = useState<Map<NodeId, DirectoryListingEntry[]>>(() => new Map());
  const [loadingParentIds, setLoadingParentIds] = useState<Set<NodeId>>(() => new Set());

  const loadFilesForDirectory = useCallback(async (parentId: NodeId, dirPath: string) => {
    if (typeof window.diskScope === 'undefined') {
      return;
    }

    setLoadingParentIds((current) => {
      if (current.has(parentId)) {
        return current;
      }

      const next = new Set(current);
      next.add(parentId);
      return next;
    });

    try {
      const result = await window.diskScope.listDirectoryContents(dirPath);
      if (isErr(result)) {
        setFileCache((current) => {
          const next = new Map(current);
          next.set(parentId, []);
          return next;
        });
        return;
      }

      const files = result.value.filter((entry) => entry.kind === 'file');
      setFileCache((current) => {
        const next = new Map(current);
        next.set(parentId, files);
        return next;
      });
    } finally {
      setLoadingParentIds((current) => {
        const next = new Set(current);
        next.delete(parentId);
        return next;
      });
    }
  }, []);

  const invalidateFilesForDirectory = useCallback((parentId: NodeId) => {
    setFileCache((current) => {
      const next = new Map(current);
      next.delete(parentId);
      return next;
    });
  }, []);

  const refreshFilesForDirectory = useCallback(
    async (parentId: NodeId, dirPath: string) => {
      invalidateFilesForDirectory(parentId);
      await loadFilesForDirectory(parentId, dirPath);
    },
    [invalidateFilesForDirectory, loadFilesForDirectory],
  );

  return {
    fileCache,
    loadingParentIds,
    loadFilesForDirectory,
    invalidateFilesForDirectory,
    refreshFilesForDirectory,
  };
}
