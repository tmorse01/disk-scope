import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { muiTheme } from '@app-theme/mui-theme';

type WebsiteThemeProviderProps = {
  children: ReactNode;
};

/**
 * Wraps React islands with the same MUI theme as the Electron app
 * (src/renderer/theme/mui-theme.ts — Stitch M3 tokens).
 */
export function WebsiteThemeProvider({ children }: WebsiteThemeProviderProps) {
  return (
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
