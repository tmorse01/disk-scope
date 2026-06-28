import Box from '@mui/material/Box';
import type { ReactNode } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';

export const DELETE_DUST_MS = 650;

export function getDeleteDustRowSx(dissolving: boolean): SxProps<Theme> {
  if (!dissolving) {
    return {};
  }

  return {
    position: 'relative',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 1,
    animation: 'dsDeleteDustRow 650ms ease-in forwards',
    '@keyframes dsDeleteDustRow': {
      '0%': {
        opacity: 1,
        filter: 'blur(0px)',
        transform: 'scale(1)',
      },
      '12%': {
        transform: 'scale(1.015) rotate(-0.8deg)',
      },
      '45%': {
        opacity: 0.75,
        filter: 'blur(1px)',
        transform: 'scale(0.985) translateY(-3px)',
      },
      '100%': {
        opacity: 0,
        filter: 'blur(10px)',
        transform: 'scale(0.84) translateY(-14px)',
      },
    },
    '& .MuiTableCell-root': {
      position: 'relative',
    },
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 2,
      opacity: 0,
      background: [
        'radial-gradient(circle at 16% 62%, rgba(184, 149, 106, 0.9) 0 2px, transparent 3px)',
        'radial-gradient(circle at 28% 48%, rgba(168, 132, 90, 0.85) 0 2px, transparent 3px)',
        'radial-gradient(circle at 41% 70%, rgba(201, 165, 116, 0.9) 0 2.5px, transparent 3.5px)',
        'radial-gradient(circle at 54% 52%, rgba(156, 118, 84, 0.8) 0 2px, transparent 3px)',
        'radial-gradient(circle at 67% 64%, rgba(184, 149, 106, 0.85) 0 2px, transparent 3px)',
        'radial-gradient(circle at 78% 46%, rgba(143, 111, 76, 0.75) 0 1.5px, transparent 2.5px)',
        'radial-gradient(circle at 36% 36%, rgba(212, 176, 122, 0.8) 0 2px, transparent 3px)',
        'radial-gradient(circle at 61% 30%, rgba(168, 132, 90, 0.7) 0 1.5px, transparent 2.5px)',
      ].join(', '),
      animation: 'dsDeleteDustParticles 650ms ease-out forwards',
      '@keyframes dsDeleteDustParticles': {
        '0%': {
          opacity: 0,
          transform: 'translateY(0) scale(1)',
        },
        '18%': {
          opacity: 1,
        },
        '100%': {
          opacity: 0,
          transform: 'translateY(-20px) scale(1.15)',
        },
      },
    },
    '& .ds-delete-dust-icon': {
      animation: 'dsDeleteDustIcon 650ms ease-in forwards',
      '@keyframes dsDeleteDustIcon': {
        '0%': { transform: 'rotate(0deg) scale(1)', opacity: 1 },
        '35%': { transform: 'rotate(-12deg) scale(1.08)', opacity: 1 },
        '100%': { transform: 'rotate(18deg) scale(0.2)', opacity: 0 },
      },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'dsDeleteDustRowReduced 650ms ease-out forwards',
      '@keyframes dsDeleteDustRowReduced': {
        '0%': { opacity: 1 },
        '100%': { opacity: 0 },
      },
      '&::after': {
        animation: 'none',
        opacity: 0,
      },
      '& .ds-delete-dust-icon': {
        animation: 'none',
        opacity: 0.5,
      },
    },
  };
}

/** Wrap file/folder icons while a row dissolves. */
export function DeleteDustIcon({ dissolving, children }: { dissolving: boolean; children: ReactNode }) {
  if (!dissolving) {
    return children;
  }

  return (
    <Box component="span" className="ds-delete-dust-icon" sx={{ display: 'inline-flex' }}>
      {children}
    </Box>
  );
}
