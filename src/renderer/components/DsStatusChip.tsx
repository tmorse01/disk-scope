import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { ReactNode } from 'react';
import { radii } from '../theme/tokens';

type DsStatusChipVariant = 'success' | 'warning' | 'error' | 'neutral' | 'info';

const DOT_COLORS: Record<DsStatusChipVariant, string> = {
  success: '#1e8e3e',
  warning: '#e6a700',
  error: '#ba1a1a',
  neutral: '#727785',
  info: '#0656cf',
};

const BG_COLORS: Record<DsStatusChipVariant, { light: string; text: string }> = {
  success: { light: '#e6f4ea', text: '#137333' },
  warning: { light: '#fef7e0', text: '#b06000' },
  error: { light: '#fce8e6', text: '#c5221f' },
  neutral: { light: '#f3f4f5', text: '#414754' },
  info: { light: '#e8f0fe', text: '#0656cf' },
};

type DsStatusChipProps = {
  label: string;
  variant?: DsStatusChipVariant;
};

export function DsStatusChip({ label, variant = 'neutral' }: DsStatusChipProps) {
  const colors = BG_COLORS[variant];

  return (
    <Chip
      size="small"
      label={
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
          <Box
            component="span"
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: DOT_COLORS[variant],
              flexShrink: 0,
            }}
          />
          {label}
        </Box>
      }
      sx={{
        bgcolor: colors.light,
        color: colors.text,
        fontFamily: '"JetBrains Mono", monospace',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        borderRadius: `${radii.full}px`,
        height: 28,
        '& .MuiChip-label': { px: 1.25 },
      }}
    />
  );
}

export function DsPageHeader({
  title,
  subtitle,
  actions,
  compact = false,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 2,
        mb: compact ? 1 : 3,
      }}
    >
      <Box>
        <Box component="h2" sx={{ m: 0, typography: 'h3', fontWeight: 700 }}>
          {title}
        </Box>
        {subtitle ? (
          <Box component="p" sx={{ m: 0, mt: 0.5, typography: 'body1', color: 'text.secondary' }}>
            {subtitle}
          </Box>
        ) : null}
      </Box>
      {actions ? <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box> : null}
    </Box>
  );
}
