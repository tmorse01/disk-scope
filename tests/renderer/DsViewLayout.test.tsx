import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DsViewLayout } from '../../src/renderer/components/DsViewLayout';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

function renderLayout(mode: 'page' | 'data' = 'page') {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <div style={{ height: 400, display: 'flex', flexDirection: 'column' }}>
        <DsViewLayout
          mode={mode}
          header={<h2>View title</h2>}
        >
          <p>Body content</p>
        </DsViewLayout>
      </div>
    </ThemeProvider>,
  );
}

describe('DsViewLayout', () => {
  it('renders header and body in page mode', () => {
    renderLayout('page');

    expect(screen.getByRole('heading', { name: 'View title' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('renders header and body in data mode', () => {
    renderLayout('data');

    expect(screen.getByRole('heading', { name: 'View title' })).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });
});
