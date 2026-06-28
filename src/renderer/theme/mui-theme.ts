import { createTheme } from '@mui/material/styles';
import { layout, radii, stitchColors, stitchDarkColors } from './tokens';
import { stitchTypography } from './typography';

declare module '@mui/material/styles' {
  interface Palette {
    surface: Palette['primary'];
    surfaceContainer: Palette['primary'];
    surfaceContainerLow: Palette['primary'];
    surfaceContainerHigh: Palette['primary'];
    surfaceContainerHighest: Palette['primary'];
    outline: Palette['primary'];
    outlineVariant: Palette['primary'];
    tertiary: Palette['primary'];
    tertiaryContainer: Palette['primary'];
  }

  interface PaletteOptions {
    surface?: PaletteOptions['primary'];
    surfaceContainer?: PaletteOptions['primary'];
    surfaceContainerLow?: PaletteOptions['primary'];
    surfaceContainerHigh?: PaletteOptions['primary'];
    surfaceContainerHighest?: PaletteOptions['primary'];
    outline?: PaletteOptions['primary'];
    outlineVariant?: PaletteOptions['primary'];
    tertiary?: PaletteOptions['primary'];
    tertiaryContainer?: PaletteOptions['primary'];
  }
}

function buildPalette(colors: typeof stitchColors | typeof stitchDarkColors) {
  return {
    primary: {
      main: colors.primary,
      light: colors.primaryContainer,
      dark: colors.surfaceTint,
      contrastText: colors.onPrimary,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryContainer,
      dark: colors.onSecondaryContainer,
      contrastText: colors.onSecondary,
    },
    error: {
      main: colors.error,
      light: colors.errorContainer,
      dark: colors.onErrorContainer,
      contrastText: colors.onError,
    },
    warning: {
      main: '#e6a700',
      contrastText: '#1a1a1a',
    },
    success: {
      main: '#1e8e3e',
      contrastText: '#ffffff',
    },
    info: {
      main: colors.tertiary,
      contrastText: colors.onTertiary,
    },
    background: {
      default: colors.background,
      paper: colors.surfaceContainerLowest,
    },
    text: {
      primary: colors.onSurface,
      secondary: colors.onSurfaceVariant,
    },
    divider: colors.outlineVariant,
    surface: {
      main: colors.surface,
      contrastText: colors.onSurface,
    },
    surfaceContainer: {
      main: colors.surfaceContainer,
      contrastText: colors.onSurface,
    },
    surfaceContainerLow: {
      main: colors.surfaceContainerLow,
      contrastText: colors.onSurface,
    },
    surfaceContainerHigh: {
      main: colors.surfaceContainerHigh,
      contrastText: colors.onSurface,
    },
    surfaceContainerHighest: {
      main: colors.surfaceContainerHighest,
      contrastText: colors.onSurface,
    },
    outline: {
      main: colors.outline,
      contrastText: colors.onSurface,
    },
    outlineVariant: {
      main: colors.outlineVariant,
      contrastText: colors.onSurfaceVariant,
    },
    tertiary: {
      main: colors.tertiary,
      contrastText: colors.onTertiary,
    },
    tertiaryContainer: {
      main: colors.tertiaryContainer,
      contrastText: colors.onTertiaryContainer,
    },
    action: {
      hover: `${colors.onSurface}14`,
      selected: colors.secondaryContainer,
    },
  };
}

export const muiTheme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'data-mui-color-scheme',
  },
  colorSchemes: {
    light: {
      palette: buildPalette(stitchColors),
    },
    dark: {
      palette: buildPalette(stitchDarkColors),
    },
  },
  typography: stitchTypography,
  shape: {
    borderRadius: radii.md,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarWidth: 'thin',
          scrollbarColor: `${stitchColors.outlineVariant} transparent`,
        },
        '*::-webkit-scrollbar': {
          width: 6,
          height: 6,
        },
        '*::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: stitchColors.outlineVariant,
          borderRadius: 10,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: radii.full,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: stitchColors.surfaceContainerHigh,
          },
        },
      },
    },
  },
});

export const NAV_RAIL_WIDTH = layout.sidebarRail;
export const SIDEBAR_WIDTH = layout.sidebarWidth;
export const TOP_APP_BAR_HEIGHT = layout.topAppBarHeight;
/** Inline controls in the context bar (breadcrumbs, active scan pill). */
export const CONTEXT_BAR_INLINE_HEIGHT = 24;
export const TITLE_BAR_HEIGHT = layout.titleBarHeight;
export const SCAN_STATUS_HEIGHT = layout.scanStatusHeight;
export const CONTENT_GUTTER = layout.gutter;
export const CONTENT_MAX_WIDTH = layout.contentMaxWidth;
