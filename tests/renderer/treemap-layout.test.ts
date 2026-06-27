import { describe, expect, it } from 'vitest';
import { layoutSquarifiedTreemap } from '../../src/renderer/features/disk-map/treemap-layout';

function rectsOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe('layoutSquarifiedTreemap', () => {
  it('returns no rects for empty input', () => {
    expect(layoutSquarifiedTreemap([], 400, 300)).toEqual([]);
  });

  it('skips zero-value items', () => {
    expect(
      layoutSquarifiedTreemap(
        [
          { id: 'a', value: 0 },
          { id: 'b', value: 50 },
        ],
        200,
        100,
      ),
    ).toHaveLength(1);
  });

  it('fills the container without overlapping rects', () => {
    const rects = layoutSquarifiedTreemap(
      [
        { id: 'a', value: 500 },
        { id: 'b', value: 300 },
        { id: 'c', value: 150 },
        { id: 'd', value: 50 },
      ],
      400,
      300,
    );

    expect(rects).toHaveLength(4);

    for (let index = 0; index < rects.length; index += 1) {
      for (let other = index + 1; other < rects.length; other += 1) {
        expect(rectsOverlap(rects[index], rects[other])).toBe(false);
      }
    }

    const coveredArea = rects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
    expect(coveredArea).toBeCloseTo(400 * 300, 0);
  });

  it('assigns one rect per positive item', () => {
    const rects = layoutSquarifiedTreemap(
      [
        { id: 'large', value: 900 },
        { id: 'small', value: 100 },
      ],
      100,
      100,
    );

    expect(rects.map((rect) => rect.id).sort()).toEqual(['large', 'small']);

    const largeArea =
      (rects.find((rect) => rect.id === 'large')?.width ?? 0) *
      (rects.find((rect) => rect.id === 'large')?.height ?? 0);
    const smallArea =
      (rects.find((rect) => rect.id === 'small')?.width ?? 0) *
      (rects.find((rect) => rect.id === 'small')?.height ?? 0);

    expect(largeArea).toBeGreaterThan(smallArea);
  });
});
