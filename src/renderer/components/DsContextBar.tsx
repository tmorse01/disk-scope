import Box from '@mui/material/Box';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import type { ReactNode } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { TOP_APP_BAR_HEIGHT } from '../theme/mui-theme';
import { shellHeaderBackgroundSx } from '../theme/shell-chrome';

export type BreadcrumbSegment = {
  id: string;
  label: string;
  onClick?: () => void;
};

type DsContextBarProps = {
  segments?: BreadcrumbSegment[];
  actions?: ReactNode;
  fallbackTitle?: string;
};

export function DsContextBar({ segments = [], actions, fallbackTitle = 'DiskScope' }: DsContextBarProps) {
  return (
    <Box
      component="header"
      className="ds-glass"
      sx={(theme) => ({
        position: 'sticky',
        top: 0,
        zIndex: 30,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        minHeight: TOP_APP_BAR_HEIGHT,
        px: 2,
        ...shellHeaderBackgroundSx(theme),
        borderBottom: 1,
        borderColor: 'outlineVariant.main',
      })}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0, flex: 1, overflow: 'auto' }}>
        {segments.length > 0 ? (
          <Breadcrumbs
            aria-label="Location"
            separator={<MaterialIcon name="chevron_right" style={{ fontSize: 16, opacity: 0.5 }} />}
            sx={{ '& .MuiBreadcrumbs-li': { display: 'flex', alignItems: 'center' } }}
          >
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;

              if (isLast || !segment.onClick) {
                return (
                  <Typography
                    key={segment.id}
                    variant="body2"
                    sx={{
                      fontWeight: isLast ? 700 : 400,
                      lineHeight: 1.2,
                      color: isLast ? 'primary.main' : 'text.secondary',
                      borderBottom: isLast ? 1.5 : 0,
                      borderColor: 'primary.main',
                      pb: isLast ? 0.125 : 0,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {segment.label}
                  </Typography>
                );
              }

              return (
                <Link
                  key={segment.id}
                  component="button"
                  type="button"
                  underline="hover"
                  color="text.secondary"
                  onClick={segment.onClick}
                  sx={{
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'inherit',
                    lineHeight: 1.2,
                    border: 'none',
                    bgcolor: 'transparent',
                    p: 0,
                    whiteSpace: 'nowrap',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {segment.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        ) : (
          <Typography variant="body1" component="span" sx={{ fontWeight: 700, color: 'primary.main', lineHeight: 1.2 }}>
            {fallbackTitle}
          </Typography>
        )}
      </Box>

      {actions ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>{actions}</Box>
      ) : null}
    </Box>
  );
}
