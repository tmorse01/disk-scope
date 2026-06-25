import type { Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { stitchColors, stitchDarkColors } from './tokens';

/** Stitch dashboard header: surface/80 light, inverse-surface/80 dark. */
export function shellHeaderBackground(theme: Theme): string {
  if (theme.vars?.palette.background.defaultChannel) {
    return `rgba(${theme.vars.palette.background.defaultChannel} / 0.85)`;
  }

  return alpha(stitchColors.background, 0.85);
}

/** Stitch scan status footer: paper light, elevated surface dark. */
export function shellFooterBackground(theme: Theme): string {
  if (theme.vars?.palette.background.paperChannel) {
    return `rgba(${theme.vars.palette.background.paperChannel} / 0.92)`;
  }

  return alpha(stitchColors.surfaceContainerLowest, 0.92);
}

export function shellHeaderBackgroundSx(theme: Theme) {
  return {
    bgcolor: shellHeaderBackground(theme),
    ...theme.applyStyles('dark', {
      bgcolor: alpha(stitchColors.inverseSurface, 0.85),
    }),
  };
}

export function shellFooterBackgroundSx(theme: Theme) {
  return {
    bgcolor: shellFooterBackground(theme),
    ...theme.applyStyles('dark', {
      bgcolor: alpha(stitchDarkColors.surfaceContainerLow, 0.95),
    }),
  };
}
