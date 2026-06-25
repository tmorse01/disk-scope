import type { LargestFileEntry } from '../shared/types';

export type TopFileCandidate = {
  path: string;
  name: string;
  extension: string | null;
  sizeBytes: number;
  mtimeMs?: number;
};

/**
 * Tracks the top-N largest files using a binary min-heap (O(log N) per insert).
 */
export class TopFilesTracker {
  private readonly heap: TopFileCandidate[] = [];

  constructor(private readonly limit: number) {}

  add(entry: TopFileCandidate): void {
    if (this.limit <= 0) {
      return;
    }

    if (this.heap.length < this.limit) {
      this.push(entry);
      return;
    }

    if (entry.sizeBytes <= this.heap[0].sizeBytes) {
      return;
    }

    this.heap[0] = entry;
    this.siftDown(0);
  }

  toArray(): LargestFileEntry[] {
    return this.heap
      .slice()
      .sort((left, right) => right.sizeBytes - left.sizeBytes)
      .map((entry) => ({
        path: entry.path,
        name: entry.name,
        extension: entry.extension,
        sizeBytes: entry.sizeBytes,
        modifiedAt:
          entry.mtimeMs === undefined ? undefined : new Date(entry.mtimeMs).toISOString(),
      }));
  }

  private push(entry: TopFileCandidate): void {
    this.heap.push(entry);
    this.siftUp(this.heap.length - 1);
  }

  private siftUp(index: number): void {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.heap[current].sizeBytes >= this.heap[parent].sizeBytes) {
        break;
      }
      this.swap(current, parent);
      current = parent;
    }
  }

  private siftDown(index: number): void {
    let current = index;
    const length = this.heap.length;

    while (true) {
      const left = current * 2 + 1;
      const right = left + 1;
      let smallest = current;

      if (left < length && this.heap[left].sizeBytes < this.heap[smallest].sizeBytes) {
        smallest = left;
      }
      if (right < length && this.heap[right].sizeBytes < this.heap[smallest].sizeBytes) {
        smallest = right;
      }
      if (smallest === current) {
        break;
      }
      this.swap(current, smallest);
      current = smallest;
    }
  }

  private swap(left: number, right: number): void {
    const temp = this.heap[left];
    this.heap[left] = this.heap[right];
    this.heap[right] = temp;
  }
}
