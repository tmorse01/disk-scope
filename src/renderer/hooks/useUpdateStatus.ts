import { useCallback, useEffect, useState } from 'react';
import type { UpdateStatusSnapshot } from '../../shared/types';

export function useUpdateStatus() {
  const [status, setStatus] = useState<UpdateStatusSnapshot | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    const updates = window.diskScope?.updates;
    if (!updates) {
      return;
    }

    void updates.getUpdateStatus().then(setStatus);
    return updates.onUpdateStatus(setStatus);
  }, []);

  const checkForUpdates = useCallback(async () => {
    const updates = window.diskScope?.updates;
    if (!updates) {
      return;
    }

    setChecking(true);
    try {
      await updates.checkForUpdates();
    } finally {
      setChecking(false);
    }
  }, []);

  const installUpdate = useCallback(async () => {
    await window.diskScope?.updates?.installUpdate();
  }, []);

  const phase = status?.phase;
  const isBusy = checking || phase === 'checking' || phase === 'downloading';
  const hasUpdateReady = phase === 'ready';
  const showGlobalBanner =
    phase === 'ready' || phase === 'downloading' || phase === 'available';

  return {
    status,
    checking,
    isBusy,
    hasUpdateReady,
    showGlobalBanner,
    checkForUpdates,
    installUpdate,
  };
}
