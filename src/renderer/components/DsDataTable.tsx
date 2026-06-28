import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import type { MouseEvent, ReactNode } from 'react';
import { DsCard } from './DsCard';
import { getDeleteDustRowSx } from './delete-dust-sx';
import { useOptionalResizableColumns } from './DsResizableColumns';

type DsDataTableProps = {
  'aria-label': string;
  header: ReactNode;
  children: ReactNode;
  noOuterCard?: boolean;
  scroll?: boolean;
};

const scrollContainerSx = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
} as const;

const scrollCardSx = {
  overflow: 'hidden',
  flex: 1,
  minHeight: 0,
  display: 'flex',
  flexDirection: 'column',
} as const;

export function DsDataTable({
  'aria-label': ariaLabel,
  header,
  children,
  noOuterCard = false,
  scroll = false,
}: DsDataTableProps) {
  const resizableColumns = useOptionalResizableColumns();

  const table = (
    <TableContainer className="ds-custom-scrollbar" sx={scroll ? scrollContainerSx : undefined}>
      <Table
        size="small"
        stickyHeader={scroll}
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
    if (scroll) {
      return (
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {table}
        </Box>
      );
    }

    return table;
  }

  return (
    <DsCard noPadding sx={scroll ? scrollCardSx : { overflow: 'hidden' }}>
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
            bgcolor: 'surfaceContainerLow.main',
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
  dissolving = false,
  onClick,
  onDoubleClick,
  onContextMenu,
}: {
  children: ReactNode;
  selected?: boolean;
  dissolving?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onContextMenu?: (event: MouseEvent<HTMLTableRowElement>) => void;
}) {
  return (
    <TableRow
      hover={!dissolving}
      selected={selected && !dissolving}
      onClick={dissolving ? undefined : onClick}
      onDoubleClick={dissolving ? undefined : onDoubleClick}
      onContextMenu={dissolving ? undefined : onContextMenu}
      sx={{
        cursor: dissolving ? 'default' : onClick || onDoubleClick || onContextMenu ? 'pointer' : 'default',
        '&:hover': { bgcolor: dissolving ? undefined : 'surfaceContainerHigh.main' },
        '&.Mui-selected': { bgcolor: 'secondary.light' },
        '& .MuiTableCell-root': {
          borderBottom: 1,
          borderColor: 'divider',
          py: 1.75,
        },
        ...getDeleteDustRowSx(dissolving),
      }}
    >
      {children}
    </TableRow>
  );
}

export { TableCell };
