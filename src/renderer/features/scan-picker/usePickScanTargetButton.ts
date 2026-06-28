import { useEffect, useRef, useState } from 'react';
import { pickScanTarget, scanStore } from '../../stores/scan-store';
import { useScanStore } from '../../hooks/useScanStore';
import { PICK_SCAN_TARGET_SUCCESS_MS } from './pick-scan-target-button-sx';

export function usePickScanTargetButton() {
  const { status } = useScanStore();
  const [showSuccess, setShowSuccess] = useState(false);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoading = status === 'selecting-target';

  useEffect(
    () => () => {
      if (successTimerRef.current) {
        clearTimeout(successTimerRef.current);
      }
    },
    [],
  );

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    const pathCountBefore = scanStore.selectedPaths.length;
    await pickScanTarget();

    if (scanStore.selectedPaths.length <= pathCountBefore) {
      return;
    }

    if (successTimerRef.current) {
      clearTimeout(successTimerRef.current);
    }

    setShowSuccess(true);
    successTimerRef.current = setTimeout(() => {
      setShowSuccess(false);
      successTimerRef.current = null;
    }, PICK_SCAN_TARGET_SUCCESS_MS);
  };

  return {
    isLoading,
    showSuccess,
    handleClick,
  };
}
