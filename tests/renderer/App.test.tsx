import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { App } from '../../src/renderer/App';
import '../../src/renderer/preview/mock-disk-scope';
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
  it('renders the app title and eight nav labels', () => {
    renderApp();

    expect(screen.getByRole('heading', { name: 'DiskScope' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Overview/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Largest Folders/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Disk Map/i })).toBeInTheDocument();
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

  it('toggles sidebar collapse', async () => {
    const user = userEvent.setup();
    renderApp();

    const collapseButton = screen.getByRole('button', { name: 'Collapse sidebar' });
    await user.click(collapseButton);

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Scan folder' })).toBeInTheDocument();
    expect(screen.queryByText('Scan folder')).not.toBeInTheDocument();
  });

  it('shows scan status footer', () => {
    renderApp();

    expect(screen.getByLabelText('Scan status')).toHaveTextContent('No scan in progress');
  });

  it('shows app version in the sidebar footer', async () => {
    renderApp();

    expect(await screen.findByText(/DiskScope v0\.0\.0-preview/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check for updates/i })).toBeInTheDocument();
  });

  it('keeps main content host and context bar in the shell', () => {
    renderApp();

    expect(screen.getByRole('main', { name: 'Overview' })).toBeInTheDocument();
    expect(document.querySelector('header.ds-glass')).toBeInTheDocument();
  });
});
