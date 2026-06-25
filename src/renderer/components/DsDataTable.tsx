import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { ReactNode } from 'react';
import { DsCard } from './DsCard';

type DsDataTableProps = {
  'aria-label': string;
  header: ReactNode;
  children: ReactNode;
  noOuterCard?: boolean;
};

export function DsDataTable({ 'aria-label': ariaLabel, header, children, noOuterCard = false }: DsDataTableProps) {
  const table = (
    <TableContainer className="ds-custom-scrollbar">
      <Table size="small" aria-label={ariaLabel}>
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
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}) {
  return (
    <TableRow
      hover
      selected={selected}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      sx={{
        cursor: onClick || onDoubleClick ? 'pointer' : 'default',
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
