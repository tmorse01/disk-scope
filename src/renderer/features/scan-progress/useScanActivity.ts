import { useEffect, useRef, useState } from 'react';
import type { ScanProgressSnapshot } from '../../stores/scan-store';
import {
  analyzedCaption,
  computeAnalyzedPercent,
  estimateScanDurationMs,
} from './scan-activity';

export type ScanActivityState = {
  percentAnalyzed: number;
  caption: string;
};

const DEFAULT_STATE: ScanActivityState = {
  percentAnalyzed: 0,
  caption: 'Starting',
};

const TICK_MS = 250;

function computeActivityState(
  progress: ScanProgressSnapshot,
  scanPath: string | null,
  elapsedMs: number,
): ScanActivityState {
  const estimatedMs = estimateScanDurationMs({
    scanPath: scanPath ?? '',
    filesScanned: progress.filesScanned,
    elapsedMs,
  });
  const percentAnalyzed = computeAnalyzedPercent(elapsedMs, estimatedMs);

  return {
    percentAnalyzed,
    caption: analyzedCaption(percentAnalyzed, elapsedMs, estimatedMs),
  };
}

function applyPercentFloor(state: ScanActivityState, percentFloor: number): ScanActivityState {
  if (percentFloor <= 0 || state.percentAnalyzed >= percentFloor) {
    return state;
  }

  return {
    ...state,
    percentAnalyzed: percentFloor,
  };
}

export function useScanActivity(
  progress: ScanProgressSnapshot | null,
  scanPath: string | null,
  isActive = true,
  percentFloor = 0,
): ScanActivityState {
  const wallStartRef = useRef<number | null>(null);
  const latestProgressRef = useRef<ScanProgressSnapshot | null>(null);
  const [state, setState] = useState<ScanActivityState>(() => {
    if (!progress) {
      return DEFAULT_STATE;
    }

    return applyPercentFloor(
      computeActivityState(progress, scanPath, progress.elapsedMs),
      percentFloor,
    );
  });

  useEffect(() => {
    if (!progress) {
      wallStartRef.current = null;
      latestProgressRef.current = null;
      setState(DEFAULT_STATE);
      return;
    }

    wallStartRef.current = Date.now() - progress.elapsedMs;
    latestProgressRef.current = progress;

    const publish = (next: ScanActivityState) => {
      setState(applyPercentFloor(next, percentFloor));
    };

    if (!isActive) {
      publish(computeActivityState(progress, scanPath, progress.elapsedMs));
      return;
    }

    const tick = () => {
      const snapshot = latestProgressRef.current;
      const wallStart = wallStartRef.current;
      if (!snapshot || wallStart === null) {
        return;
      }

      const elapsedMs = Math.max(0, Date.now() - wallStart);
      publish(computeActivityState(snapshot, scanPath, elapsedMs));
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [progress, scanPath, isActive, percentFloor]);

  return state;
}
