import { describe, expect, it } from 'vitest';
import {
  getPickScanTargetButtonSx,
  PICK_SCAN_TARGET_SUCCESS_MS,
} from '../../src/renderer/features/scan-picker/pick-scan-target-button-sx';

describe('getPickScanTargetButtonSx', () => {
  it('uses a stronger press scale when the sidebar is collapsed', () => {
    const expandedSx = getPickScanTargetButtonSx({
      variant: 'sidebar',
      expanded: true,
      isLoading: false,
      showSuccess: false,
    }) as Record<string, unknown>;
    const collapsedSx = getPickScanTargetButtonSx({
      variant: 'sidebar',
      expanded: false,
      isLoading: false,
      showSuccess: false,
    }) as Record<string, unknown>;

    expect(expandedSx['&:active:not(:disabled)']).toEqual({
      transform: 'scale(0.97)',
      boxShadow: 'none',
    });
    expect(collapsedSx['&:active:not(:disabled)']).toEqual({
      transform: 'scale(0.94)',
      boxShadow: 'none',
    });
  });

  it('uses standard press scale for the overview panel button', () => {
    const sx = getPickScanTargetButtonSx({
      variant: 'panel',
      isLoading: false,
      showSuccess: false,
    }) as Record<string, unknown>;

    expect(sx['&:active:not(:disabled)']).toEqual({
      transform: 'scale(0.97)',
      boxShadow: 'none',
    });
    expect(sx.flexShrink).toBe(0);
  });

  it('dims the button while the folder picker is open', () => {
    const sx = getPickScanTargetButtonSx({
      variant: 'panel',
      isLoading: true,
      showSuccess: false,
    }) as Record<string, unknown>;

    expect(sx.opacity).toBe(0.88);
  });

  it('applies success styling after a folder is picked', () => {
    const sx = getPickScanTargetButtonSx({
      variant: 'panel',
      isLoading: false,
      showSuccess: true,
    }) as Record<string, unknown>;

    expect(sx.bgcolor).toBe('primaryContainer.main');
    expect(sx.animation).toBe('dsPickScanTargetSuccess 400ms ease-out');
  });

  it('exports a stable success duration', () => {
    expect(PICK_SCAN_TARGET_SUCCESS_MS).toBe(400);
  });
});
