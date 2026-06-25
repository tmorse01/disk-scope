import { useColorScheme } from '@mui/material/styles';
import { useLayoutEffect } from 'react';
import { usePreferencesStore } from '../hooks/usePreferencesStore';

/** Syncs persisted theme preference with MUI color scheme. */
export function ThemeModeSync() {
  const { theme } = usePreferencesStore();
  const { setMode } = useColorScheme();

  useLayoutEffect(() => {
    setMode(theme);
    document.documentElement.setAttribute('data-mui-color-scheme', theme);
  }, [setMode, theme]);

  return null;
}
