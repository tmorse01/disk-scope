import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/renderer/App';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderApp() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <App />
    </ThemeProvider>,
  );
}

describe('App', () => {
  it('renders the app title and seven nav labels', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'DiskScope' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Largest Folders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Largest Files/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /File Types/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cleanup/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Exclusions/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('shows overview by default and switches route on nav click', async () => {
    const user = userEvent.setup();
    renderApp();

    expect(screen.getByRole('heading', { name: 'Overview' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Settings/i }));

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Overview' })).not.toBeInTheDocument();
  });

  it('shows scan status footer', () => {
    renderApp();

    expect(screen.getByLabelText('Scan status')).toHaveTextContent('No scan in progress');
  });
});
