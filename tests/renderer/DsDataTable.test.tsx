import CssBaseline from '@mui/material/CssBaseline';
import TableBody from '@mui/material/TableBody';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  DsDataTable,
  DsTableBodyRow,
  DsTableHeadRow,
  TableCell,
} from '../../src/renderer/components/DsDataTable';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

describe('DsDataTable', () => {
  it('enables sticky header when scroll prop is set', () => {
    render(
      <ThemeProvider theme={muiTheme} defaultMode="light">
        <CssBaseline />
        <div style={{ height: 200, display: 'flex', flexDirection: 'column' }}>
          <DsDataTable
            scroll
            aria-label="Scroll test table"
            header={
              <DsTableHeadRow>
                <TableCell>Name</TableCell>
              </DsTableHeadRow>
            }
          >
            <TableBody>
              <DsTableBodyRow>
                <TableCell>example.txt</TableCell>
              </DsTableBodyRow>
            </TableBody>
          </DsDataTable>
        </div>
      </ThemeProvider>,
    );

    expect(screen.getByRole('table', { name: 'Scroll test table' })).toHaveClass('MuiTable-stickyHeader');
  });
});
