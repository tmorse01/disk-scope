import { createTheme } from '@mui/material/styles';

export const muiTheme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: '#6750a4',
          contrastText: '#ffffff',
        },
        secondary: {
          main: '#625b71',
          contrastText: '#ffffff',
        },
        error: {
          main: '#b3261e',
          contrastText: '#ffffff',
        },
        background: {
          default: '#fef7ff',
          paper: '#f3edf7',
        },
        text: {
          primary: '#1d1b20',
          secondary: '#49454f',
        },
        divider: '#cac4d0',
      },
    },
    dark: {
      palette: {
        primary: {
          main: '#d0bcff',
          contrastText: '#381e72',
        },
        secondary: {
          main: '#ccc2dc',
          contrastText: '#332d41',
        },
        error: {
          main: '#f2b8b5',
          contrastText: '#601410',
        },
        background: {
          default: '#141218',
          paper: '#211f26',
        },
        text: {
          primary: '#e6e0e9',
          secondary: '#cac4d0',
        },
        divider: '#49454f',
      },
    },
  },
  typography: {
    fontFamily: '"Roboto", system-ui, sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
});

export const NAV_RAIL_WIDTH = 80;
export const TOP_APP_BAR_HEIGHT = 64;
export const SCAN_STATUS_HEIGHT = 48;
