import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { MouseEvent, ReactNode } from 'react';
import { DsCard } from './DsCard';
import { useOptionalResizableColumns } from './DsResizableColumns';

type DsDataTableProps = {
  'aria-label': string;
  header: ReactNode;
  children: ReactNode;
  noOuterCard?: boolean;
};

export function DsDataTable({ 'aria-label': ariaLabel, header, children, noOuterCard = false }: DsDataTableProps) {
  const resizableColumns = useOptionalResizableColumns();

  const table = (
    <TableContainer className="ds-custom-scrollbar">
      <Table
        size="small"
        aria-label={ariaLabel}
        sx={{
          tableLayout: 'fixed',
          width: '100%',
          minWidth: resizableColumns?.totalWidth,
        }}
      >
        {header}
        {children}
      </Table>
    </TableContainer>
  );

  if (noOuterCard) {
    return table;
  }

  return (
    <DsCard noPadding sx={{ overflow: 'hidden' }}>
      {table}
    </DsCard>
  );
}

export function DsTableHeadRow({ children }: { children: ReactNode }) {
  return (
    <TableHead>
      <TableRow
        sx={{
          bgcolor: 'surfaceContainerLow.main',
          '& .MuiTableCell-head': {
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            borderBottom: 1,
            borderColor: 'outlineVariant.main',
            py: 2,
          },
        }}
      >
        {children}
      </TableRow>
    </TableHead>
  );
}

export function DsTableBodyRow({
  children,
  selected,
  onClick,
  onDoubleClick,
  onContextMenu,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLTableRowElement>) => void;
}) {
  return (
    <TableRow
      hover
      selected={selected}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={onContextMenu}
      sx={{
        cursor: onClick || onDoubleClick || onContextMenu ? 'pointer' : 'default',
        '&:hover': { bgcolor: 'surfaceContainerHigh.main' },
        '&.Mui-selected': { bgcolor: 'secondary.light' },
        '& .MuiTableCell-root': {
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.75,
        },
      }}
    >
      {children}
    </TableRow>
  );
}

export { TableCell };
