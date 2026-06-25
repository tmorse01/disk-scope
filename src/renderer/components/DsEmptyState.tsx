import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { radii } from '../theme/tokens';

type DsEmptyStateProps = {
  icon: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function DsEmptyState({ icon, title, description, children }: DsEmptyStateProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          width: 96,
          height: 96,
          mb: 3,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: `${radii.xl}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: (theme) => `0 8px 24px ${theme.palette.primary.main}33`,
        }}
      >
        <MaterialIcon name={icon} filled style={{ fontSize: 48 }} />
      </Box>

      <Typography variant="h2" component="h2" sx={{ mb: 1 }}>
        {title}
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 420, mb: 4, lineHeight: 1.6 }}>
        {description}
      </Typography>

      {children}
    </Box>
  );
}
