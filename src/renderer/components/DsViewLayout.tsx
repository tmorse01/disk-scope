import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

type DsViewLayoutProps = {
  header?: ReactNode;
  mode?: 'page' | 'data';
  children: ReactNode;
};

const scrollPanelSx = {
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
} as const;

export function DsScrollPanel({ children }: { children: ReactNode }) {
  return (
    <Box className="ds-custom-scrollbar" sx={scrollPanelSx}>
      {children}
    </Box>
  );
}

export function DsViewLayout({ header, mode = 'page', children }: DsViewLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 2 }}>
      {header ? <Box sx={{ flexShrink: 0 }}>{header}</Box> : null}
      <Box
        className={mode === 'page' ? 'ds-custom-scrollbar' : undefined}
        sx={
          mode === 'page'
            ? scrollPanelSx
            : {
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflow: 'hidden',
              }
        }
      >
        {children}
      </Box>
    </Box>
  );
}
