import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BrandMark } from '../../src/renderer/components/BrandMark';

describe('BrandMark', () => {
  it('renders at default 32px size', () => {
    const { container } = render(<BrandMark />);
    const img = container.querySelector('img');

    expect(img).toBeTruthy();
    expect(img).toHaveStyle({ width: '32px', height: '32px' });
  });

  it('renders at requested sizes', () => {
    const { container, rerender } = render(<BrandMark size={16} />);
    expect(container.querySelector('img')).toHaveStyle({ width: '16px', height: '16px' });

    rerender(<BrandMark size={48} />);
    expect(container.querySelector('img')).toHaveStyle({ width: '48px', height: '48px' });
  });

  it('loads the brand logo asset', () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelector('img')).toHaveAttribute('src');
  });
});

describe('DsTitleBar', () => {
  it('renders when windowControls API is present', async () => {
    const { DsTitleBar } = await import('../../src/renderer/components/DsTitleBar');

    window.diskScope = {
      ...(window.diskScope ?? {}),
      windowControls: {
        minimize: async () => undefined,
        toggleMaximize: async () => false,
        close: async () => undefined,
        isMaximized: async () => false,
        onMaximizeChanged: () => () => undefined,
      },
    } as typeof window.diskScope;

    render(<DsTitleBar />);

    expect(screen.getByLabelText('Window title bar')).toBeInTheDocument();
    expect(screen.getByText('DiskScope')).toBeInTheDocument();
    expect(screen.getByLabelText('Minimize window')).toBeInTheDocument();
    expect(screen.getByLabelText('Maximize window')).toBeInTheDocument();
    expect(screen.getByLabelText('Close window')).toBeInTheDocument();
  });

  it('renders nothing without windowControls', async () => {
    const { DsTitleBar } = await import('../../src/renderer/components/DsTitleBar');
    const original = window.diskScope;

    Object.defineProperty(window, 'diskScope', {
      configurable: true,
      value: original ? { ...original, windowControls: undefined } : undefined,
    });

    const { container } = render(<DsTitleBar />);
    expect(container).toBeEmptyDOMElement();

    Object.defineProperty(window, 'diskScope', {
      configurable: true,
      value: original,
    });
  });
});
