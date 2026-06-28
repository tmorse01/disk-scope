import { describe, expect, it } from 'vitest';
import { DELETE_DUST_MS, getDeleteDustRowSx } from '../../src/renderer/components/delete-dust-sx';

describe('getDeleteDustRowSx', () => {
  it('returns no styles when the row is not dissolving', () => {
    expect(getDeleteDustRowSx(false)).toEqual({});
  });

  it('applies dissolve animation when deleting', () => {
    const sx = getDeleteDustRowSx(true) as Record<string, unknown>;

    expect(sx.animation).toBe('dsDeleteDustRow 650ms ease-in forwards');
    expect(sx.pointerEvents).toBe('none');
    expect(sx['&::after']).toBeDefined();
  });

  it('exports a stable dust duration', () => {
    expect(DELETE_DUST_MS).toBe(650);
  });
});
