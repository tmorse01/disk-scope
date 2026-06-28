import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DiskMapTreemap } from '../../src/renderer/features/disk-map/DiskMapTreemap';
import type { TreemapItem } from '../../src/renderer/features/disk-map/disk-map-utils';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

const mockItems: TreemapItem[] = [
  {
    id: 'movies',
    kind: 'directory',
    name: 'Movies',
    path: 'C:\\Users\\you\\Movies',
    sizeBytes: 128_000_000_000,
  },
  {
    id: 'music',
    kind: 'directory',
    name: 'Music',
    path: 'C:\\Users\\you\\Music',
    sizeBytes: 54_000_000_000,
  },
];

function renderTreemap(items: TreemapItem[] = mockItems) {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <div style={{ width: 640, height: 480 }}>
        <DiskMapTreemap items={items} focusTotalBytes={200_000_000_000} onDirectoryClick={() => {}} />
      </div>
    </ThemeProvider>,
  );
}

describe('DiskMapTreemap', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      private readonly callback: ResizeObserverCallback;

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback;
      }

      observe(target: Element) {
        const rect = target.getBoundingClientRect();
        this.callback(
          [
            {
              contentRect: {
                width: rect.width || 640,
                height: rect.height || 420,
                top: 0,
                left: 0,
                bottom: rect.height || 420,
                right: rect.width || 640,
                x: 0,
                y: 0,
                toJSON: () => ({}),
              },
              target,
            } as ResizeObserverEntry,
          ],
          this,
        );
      }

      disconnect() {}

      unobserve() {}
    }

    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders folder name and size labels for large tiles', () => {
    renderTreemap();

    expect(screen.getByText('Movies')).toBeInTheDocument();
    expect(screen.getByText('119.2 GB')).toBeInTheDocument();
    expect(screen.getByText('Hover a folder for details')).toBeInTheDocument();
  });

  it('shows empty state when there are no items', () => {
    renderTreemap([]);

    expect(screen.getByText('No sized items to display in this folder.')).toBeInTheDocument();
  });
});
