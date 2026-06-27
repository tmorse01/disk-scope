/** Stable hue for folder tiles from folder name. */
export function colorForFolderName(name: string): string {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash * 31 + name.charCodeAt(index)) >>> 0;
  }

  const hue = hash % 360;
  return `hsl(${hue}, 42%, 52%)`;
}

export const OTHER_TILE_COLOR = 'hsl(220, 8%, 62%)';
