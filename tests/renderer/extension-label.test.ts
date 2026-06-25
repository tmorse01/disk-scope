import { describe, expect, it } from 'vitest';
import {
  formatExtensionLabel,
  NO_EXTENSION_LABEL,
} from '../../src/renderer/features/file-types/extension-label';

describe('formatExtensionLabel', () => {
  it('returns the extension when present', () => {
    expect(formatExtensionLabel('.txt')).toBe('.txt');
  });

  it('returns the no-extension label for null', () => {
    expect(formatExtensionLabel(null)).toBe(NO_EXTENSION_LABEL);
  });
});
