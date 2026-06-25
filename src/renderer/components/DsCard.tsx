import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { radii } from '../theme/tokens';

type DsCardProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  sx?: SxProps<Theme>;
};

export function DsCard({ children, className, noPadding = false, sx }: DsCardProps) {
  return (
    <Box
      className={className}
      sx={{
        bgcolor: 'background.paper',
        border: 1,
        borderColor: 'outlineVariant.main',
        borderRadius: `${radii.xl}px`,
        overflow: 'hidden',
        ...(noPadding ? {} : { p: 3 }),
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
