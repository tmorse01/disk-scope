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

export function useScanActivity(
  progress: ScanProgressSnapshot | null,
  scanPath: string | null,
): ScanActivityState {
  const wallStartRef = useRef<number | null>(null);
  const latestProgressRef = useRef<ScanProgressSnapshot | null>(null);
  const [state, setState] = useState<ScanActivityState>(DEFAULT_STATE);

  useEffect(() => {
    if (!progress) {
      wallStartRef.current = null;
      latestProgressRef.current = null;
      setState(DEFAULT_STATE);
      return;
    }

    wallStartRef.current = Date.now() - progress.elapsedMs;
    latestProgressRef.current = progress;

    const tick = () => {
      const snapshot = latestProgressRef.current;
      const wallStart = wallStartRef.current;
      if (!snapshot || wallStart === null) {
        return;
      }

      const elapsedMs = Math.max(0, Date.now() - wallStart);
      const estimatedMs = estimateScanDurationMs({
        scanPath: scanPath ?? '',
        filesScanned: snapshot.filesScanned,
        elapsedMs,
      });
      const percentAnalyzed = computeAnalyzedPercent(elapsedMs, estimatedMs);

      setState({
        percentAnalyzed,
        caption: analyzedCaption(percentAnalyzed, elapsedMs, estimatedMs),
      });
    };

    tick();
    const intervalId = window.setInterval(tick, TICK_MS);
    return () => window.clearInterval(intervalId);
  }, [progress, scanPath]);

  return state;
}
