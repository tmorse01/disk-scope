/**
 * CSS custom properties derived from the desktop app theme.
 * Source of truth: src/renderer/theme/tokens.ts (Stitch / M3 tokens)
 */
import { fonts, layout, radii, stitchColors } from '@app-theme/tokens';

export const themeCssVars = {
  '--ds-font-ui': fonts.ui,
  '--ds-font-mono': fonts.mono,
  '--ds-primary': stitchColors.primary,
  '--ds-on-primary': stitchColors.onPrimary,
  '--ds-primary-container': stitchColors.primaryContainer,
  '--ds-on-primary-container': stitchColors.onPrimaryContainer,
  '--ds-surface': stitchColors.surface,
  '--ds-surface-container-lowest': stitchColors.surfaceContainerLowest,
  '--ds-surface-container-low': stitchColors.surfaceContainerLow,
  '--ds-surface-container': stitchColors.surfaceContainer,
  '--ds-surface-container-high': stitchColors.surfaceContainerHigh,
  '--ds-on-surface': stitchColors.onSurface,
  '--ds-on-surface-variant': stitchColors.onSurfaceVariant,
  '--ds-outline-variant': stitchColors.outlineVariant,
  '--ds-background': stitchColors.background,
  '--ds-tertiary': stitchColors.tertiary,
  '--ds-radius-sm': `${radii.sm}px`,
  '--ds-radius-md': `${radii.md}px`,
  '--ds-radius-lg': `${radii.lg}px`,
  '--ds-radius-xl': `${radii.xl}px`,
  '--ds-radius-full': `${radii.full}px`,
  '--ds-gutter': `${layout.gutter}px`,
  '--ds-content-max': `${layout.contentMaxWidth}px`,
  '--ds-margin-mobile': `${layout.marginMobile}px`,
  '--ds-margin-desktop': `${layout.marginDesktop}px`,
} as const;

export { stitchColors, radii, layout, fonts };
