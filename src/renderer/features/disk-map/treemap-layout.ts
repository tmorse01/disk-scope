export type TreemapLayoutInput = {
  id: string;
  value: number;
};

export type TreemapLayoutRect = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Squarified treemap layout (Bruls, Huizing, van Wijk). */
export function layoutSquarifiedTreemap(
  items: ReadonlyArray<TreemapLayoutInput>,
  width: number,
  height: number,
): TreemapLayoutRect[] {
  const nodes = items
    .filter((item) => item.value > 0 && Number.isFinite(item.value))
    .slice()
    .sort((a, b) => b.value - a.value);

  if (nodes.length === 0 || width <= 0 || height <= 0) {
    return [];
  }

  const totalValue = nodes.reduce((sum, node) => sum + node.value, 0);
  if (totalValue <= 0) {
    return [];
  }

  const rects: TreemapLayoutRect[] = [];
  let x = 0;
  let y = 0;
  let w = width;
  let h = height;
  let remaining = nodes;
  let remainingTotal = totalValue;

  while (remaining.length > 0) {
    const row: TreemapLayoutInput[] = [];
    let rowValue = 0;
    const side = Math.min(w, h);

    while (remaining.length > 0) {
      const candidate = remaining[0];
      const nextRow = [...row, candidate];
      const nextRowValue = rowValue + candidate.value;

      if (
        row.length === 0 ||
        worstRatio(nextRow, side) <= worstRatio(row, side)
      ) {
        row.push(candidate);
        rowValue = nextRowValue;
        remaining = remaining.slice(1);
      } else {
        break;
      }
    }

    const rowArea = (rowValue / remainingTotal) * w * h;
    const horizontal = w >= h;

    if (horizontal) {
      const rowWidth = rowArea / h;
      let cy = y;
      for (const item of row) {
        const itemHeight = (item.value / rowValue) * h;
        rects.push({
          id: item.id,
          x,
          y: cy,
          width: rowWidth,
          height: itemHeight,
        });
        cy += itemHeight;
      }
      x += rowWidth;
      w -= rowWidth;
    } else {
      const rowHeight = rowArea / w;
      let cx = x;
      for (const item of row) {
        const itemWidth = (item.value / rowValue) * w;
        rects.push({
          id: item.id,
          x: cx,
          y,
          width: itemWidth,
          height: rowHeight,
        });
        cx += itemWidth;
      }
      y += rowHeight;
      h -= rowHeight;
    }

    remainingTotal -= rowValue;
  }

  return rects;
}

function worstRatio(row: ReadonlyArray<{ value: number }>, side: number): number {
  if (row.length === 0 || side <= 0) {
    return Infinity;
  }

  const sum = row.reduce((total, item) => total + item.value, 0);
  const max = Math.max(...row.map((item) => item.value));
  const min = Math.min(...row.map((item) => item.value));
  const r = side * side;
  const s = sum * sum;

  return Math.max((r * max) / s, s / (r * min));
}
