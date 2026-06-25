import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './index.css';
import { initScanStoreListeners } from './stores/scan-store';
import { initPreferencesStore } from './stores/preferences-store';
import { muiTheme } from './theme/mui-theme';

initScanStoreListeners();
void initPreferencesStore();

const appRoot = document.getElementById('app');

if (appRoot) {
  createRoot(appRoot).render(
    <StrictMode>
      <ThemeProvider theme={muiTheme} defaultMode="system">
        <CssBaseline />
        <App />
      </ThemeProvider>
    </StrictMode>,
  );
}
