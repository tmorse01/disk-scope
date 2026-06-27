/** Shared brand constants — see docs/DESIGN.md */

export const brandColors = {
  primary: '#005bbf',
  primaryContainer: '#1a73e8',
  onPrimary: '#ffffff',
  backgroundLight: '#f8f9fa',
} as const;

export const brandMarkSizes = [16, 24, 32, 48] as const;
export type BrandMarkSize = (typeof brandMarkSizes)[number];

export const WINDOW_TITLE_BAR_HEIGHT = 40;
