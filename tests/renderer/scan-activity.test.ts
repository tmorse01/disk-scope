import { describe, expect, it } from 'vitest';
import {
  ANALYZED_CAP,
  analyzedCaption,
  computeAnalyzedPercent,
  estimateScanDurationMs,
  formatAnalyzedPercent,
} from '../../src/renderer/features/scan-progress/scan-activity';

describe('scan-activity', () => {
  it('returns zero analyzed percent at start', () => {
    expect(computeAnalyzedPercent(0, 60_000)).toBe(0);
  });

  it('increases monotonically with elapsed time', () => {
    const early = computeAnalyzedPercent(15_000, 60_000);
    const mid = computeAnalyzedPercent(30_000, 60_000);
    const late = computeAnalyzedPercent(50_000, 60_000);
    expect(mid).toBeGreaterThan(early);
    expect(late).toBeGreaterThan(mid);
  });

  it('slows down as it approaches the cap while scanning', () => {
    const atEstimate = computeAnalyzedPercent(60_000, 60_000);
    const pastEstimate = computeAnalyzedPercent(120_000, 60_000);
    const farPast = computeAnalyzedPercent(240_000, 60_000);

    expect(atEstimate).toBeGreaterThan(80);
    expect(pastEstimate).toBeGreaterThan(atEstimate);
    expect(farPast).toBeGreaterThan(pastEstimate);
    expect(farPast - pastEstimate).toBeLessThan(pastEstimate - atEstimate);
  });

  it('caps analyzed percent below 100 while scanning', () => {
    expect(computeAnalyzedPercent(600_000, 60_000)).toBeLessThanOrEqual(ANALYZED_CAP);
    expect(computeAnalyzedPercent(600_000, 60_000)).toBeGreaterThan(90);
  });

  it('estimates longer duration for drive roots', () => {
    const drive = estimateScanDurationMs({
      scanPath: 'C:\\',
      filesScanned: 0,
      elapsedMs: 0,
    });
    const folder = estimateScanDurationMs({
      scanPath: 'C:\\Users\\Demo\\Projects',
      filesScanned: 0,
      elapsedMs: 0,
    });
    expect(drive).toBeGreaterThan(folder);
  });

  it('extends estimate when scan outpaces initial guess', () => {
    const extended = estimateScanDurationMs({
      scanPath: 'C:\\Users\\Demo\\Projects',
      filesScanned: 50_000,
      elapsedMs: 15_000,
    });
    const baseline = estimateScanDurationMs({
      scanPath: 'C:\\Users\\Demo\\Projects',
      filesScanned: 0,
      elapsedMs: 0,
    });
    expect(extended).toBeGreaterThan(baseline);
  });

  it('returns descriptive captions by phase', () => {
    expect(analyzedCaption(2, 500, 60_000)).toBe('Starting');
    expect(analyzedCaption(40, 20_000, 60_000)).toBe('Analyzing');
    expect(analyzedCaption(80, 50_000, 60_000)).toBe('Almost done');
    expect(analyzedCaption(92, 90_000, 60_000)).toBe('Finishing up');
  });

  it('formats analyzed percent for display', () => {
    expect(formatAnalyzedPercent(47.6)).toBe('48%');
  });
});
