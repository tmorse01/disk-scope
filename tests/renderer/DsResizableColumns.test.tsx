import CssBaseline from '@mui/material/CssBaseline';
import TableBody from '@mui/material/TableBody';
import { ThemeProvider } from '@mui/material/styles';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DsDataTable, DsTableBodyRow, DsTableHeadRow } from '../../src/renderer/components/DsDataTable';
import {
  DsResizableBodyCell,
  DsResizableColumnsProvider,
  DsResizableHeaderCell,
  type ResizableColumnDef,
} from '../../src/renderer/components/DsResizableColumns';
import { muiTheme } from '../../src/renderer/theme/mui-theme';

const TEST_COLUMNS: ResizableColumnDef[] = [
  { id: 'name', defaultWidth: 200, minWidth: 120 },
  { id: 'sizeBytes', defaultWidth: 100, minWidth: 72 },
];

function renderTable() {
  return render(
    <ThemeProvider theme={muiTheme} defaultMode="light">
      <CssBaseline />
      <DsResizableColumnsProvider columns={TEST_COLUMNS}>
        <DsDataTable
          aria-label="Resizable test table"
          header={
            <DsTableHeadRow>
              <DsResizableHeaderCell columnId="name">Name</DsResizableHeaderCell>
              <DsResizableHeaderCell columnId="sizeBytes" align="right">
                Size
              </DsResizableHeaderCell>
            </DsTableHeadRow>
          }
        >
          <TableBody>
            <DsTableBodyRow>
              <DsResizableBodyCell columnId="name">example.txt</DsResizableBodyCell>
              <DsResizableBodyCell columnId="sizeBytes" align="right">
                1.0 KB
              </DsResizableBodyCell>
            </DsTableBodyRow>
          </TableBody>
        </DsDataTable>
      </DsResizableColumnsProvider>
    </ThemeProvider>,
  );
}

describe('DsResizableColumns', () => {
  it('renders column resize handles and applies default widths', () => {
    renderTable();

    expect(screen.getByRole('separator', { name: 'Resize name column' })).toBeInTheDocument();
    expect(screen.getByRole('separator', { name: 'Resize sizeBytes column' })).toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Resizable test table' });
    expect(table).toHaveStyle({ minWidth: `${TEST_COLUMNS[0].defaultWidth + TEST_COLUMNS[1].defaultWidth}px` });
  });
});
