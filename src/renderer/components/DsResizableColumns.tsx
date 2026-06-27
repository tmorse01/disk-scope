import Box from '@mui/material/Box';
import TableCell, { type TableCellProps } from '@mui/material/TableCell';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type ResizableColumnDef = {
  id: string;
  defaultWidth: number;
  minWidth?: number;
};

type ResizableColumnsContextValue = {
  getColumnWidth: (columnId: string) => number;
  startResize: (columnId: string, clientX: number) => void;
  totalWidth: number;
  activeColumnId: string | null;
};

const ResizableColumnsContext = createContext<ResizableColumnsContextValue | null>(null);

function useResizableColumnsContext(): ResizableColumnsContextValue {
  const context = useContext(ResizableColumnsContext);
  if (!context) {
    throw new Error('Resizable column components must be used within DsResizableColumnsProvider');
  }
  return context;
}

export function useOptionalResizableColumns(): ResizableColumnsContextValue | null {
  return useContext(ResizableColumnsContext);
}

type DsResizableColumnsProviderProps = {
  columns: ResizableColumnDef[];
  children: ReactNode;
};

export function DsResizableColumnsProvider({ columns, children }: DsResizableColumnsProviderProps) {
  const [widths, setWidths] = useState<Record<string, number>>(() =>
    Object.fromEntries(columns.map((column) => [column.id, column.defaultWidth])),
  );
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);
  const columnMeta = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );
  const resizeSession = useRef<{ columnId: string; startX: number; startWidth: number } | null>(null);

  const getColumnWidth = useCallback(
    (columnId: string) => widths[columnId] ?? columnMeta.get(columnId)?.defaultWidth ?? 120,
    [columnMeta, widths],
  );

  const totalWidth = useMemo(
    () => columns.reduce((sum, column) => sum + getColumnWidth(column.id), 0),
    [columns, getColumnWidth],
  );

  const startResize = useCallback(
    (columnId: string, clientX: number) => {
      setActiveColumnId(columnId);
      resizeSession.current = {
        columnId,
        startX: clientX,
        startWidth: getColumnWidth(columnId),
      };
    },
    [getColumnWidth],
  );

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const session = resizeSession.current;
      if (!session) {
        return;
      }

      const column = columnMeta.get(session.columnId);
      const minWidth = column?.minWidth ?? 64;
      const nextWidth = Math.max(minWidth, session.startWidth + (event.clientX - session.startX));

      setWidths((current) => ({
        ...current,
        [session.columnId]: nextWidth,
      }));
    };

    const endResize = () => {
      if (!resizeSession.current) {
        return;
      }

      resizeSession.current = null;
      setActiveColumnId(null);
      document.body.style.removeProperty('cursor');
      document.body.style.removeProperty('user-select');
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endResize);
    window.addEventListener('pointercancel', endResize);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endResize);
      window.removeEventListener('pointercancel', endResize);
      endResize();
    };
  }, [columnMeta]);

  const value = useMemo(
    () => ({
      getColumnWidth,
      startResize,
      totalWidth,
      activeColumnId,
    }),
    [activeColumnId, getColumnWidth, startResize, totalWidth],
  );

  return <ResizableColumnsContext.Provider value={value}>{children}</ResizableColumnsContext.Provider>;
}

const columnDividerSx = {
  borderRight: 1,
  borderColor: 'outlineVariant.main',
} as const;

function ColumnResizeHandle({
  columnId,
  active,
  onResizeStart,
}: {
  columnId: string;
  active: boolean;
  onResizeStart: (clientX: number) => void;
}) {
  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${columnId} column`}
      onPointerDown={(event) => {
        event.preventDefault();
        event.stopPropagation();
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        onResizeStart(event.clientX);
      }}
      className={`ds-column-resize-handle${active ? ' ds-column-resize-handle-active' : ''}`}
      sx={{
        position: 'absolute',
        top: 0,
        right: -3,
        width: 6,
        height: '100%',
        cursor: 'col-resize',
        touchAction: 'none',
        zIndex: 2,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 2,
          height: 10,
          opacity: 0,
          borderRadius: 1,
          background: (theme) =>
            `repeating-linear-gradient(to bottom, ${theme.palette.text.secondary} 0 1px, transparent 1px 3px)`,
          transition: 'opacity 0.12s ease',
        },
      }}
    />
  );
}

type DsResizableHeaderCellProps = TableCellProps & {
  columnId: string;
  children: ReactNode;
};

export function DsResizableHeaderCell({
  columnId,
  children,
  sx,
  ...props
}: DsResizableHeaderCellProps) {
  const { getColumnWidth, startResize, activeColumnId } = useResizableColumnsContext();
  const width = getColumnWidth(columnId);

  return (
    <TableCell
      {...props}
      sx={{
        width,
        maxWidth: width,
        position: 'relative',
        overflow: 'visible',
        ...columnDividerSx,
        '&:hover .ds-column-resize-handle::after': {
          opacity: 0.65,
        },
        '& .ds-column-resize-handle-active::after': {
          opacity: 1,
          background: (theme) =>
            `repeating-linear-gradient(to bottom, ${theme.palette.primary.main} 0 1px, transparent 1px 3px)`,
        },
        ...sx,
      }}
    >
      <Box
        component="span"
        sx={{
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          pr: 1,
        }}
      >
        {children}
      </Box>
      <ColumnResizeHandle
        columnId={columnId}
        active={activeColumnId === columnId}
        onResizeStart={(clientX) => startResize(columnId, clientX)}
      />
    </TableCell>
  );
}

type DsResizableBodyCellProps = TableCellProps & {
  columnId: string;
  children: ReactNode;
  /** Allow stacked content (e.g. folder name + progress bar). */
  multiline?: boolean;
};

export function DsResizableBodyCell({
  columnId,
  children,
  multiline = false,
  sx,
  ...props
}: DsResizableBodyCellProps) {
  const { getColumnWidth } = useResizableColumnsContext();
  const width = getColumnWidth(columnId);

  return (
    <TableCell
      {...props}
      sx={{
        width,
        maxWidth: width,
        overflow: 'hidden',
        ...columnDividerSx,
        ...(multiline
          ? {}
          : {
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }),
        ...sx,
      }}
    >
      {children}
    </TableCell>
  );
}
