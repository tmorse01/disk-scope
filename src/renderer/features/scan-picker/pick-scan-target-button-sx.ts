import type { SxProps, Theme } from '@mui/material/styles';
import { radii } from '../../theme/tokens';

const PRESS_RELEASE_EASING = 'cubic-bezier(0.34, 1.12, 0.64, 1)';
const STANDARD_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export const PICK_SCAN_TARGET_SUCCESS_MS = 400;

export type PickScanTargetButtonVariant = 'sidebar' | 'panel';

type PickScanTargetButtonVisualState = {
  variant: PickScanTargetButtonVariant;
  /** Sidebar only — collapsed rail uses a stronger press scale. */
  expanded?: boolean;
  isLoading: boolean;
  showSuccess: boolean;
};

/** Press, hover, loading, and success styles for pick-scan-target CTAs. */
export function getPickScanTargetButtonSx({
  variant,
  expanded = true,
  isLoading,
  showSuccess,
}: PickScanTargetButtonVisualState): SxProps<Theme> {
  const pressScale = variant === 'sidebar' && !expanded ? 0.94 : 0.97;

  return {
    borderRadius: `${radii.lg}px`,
    textTransform: 'none',
    fontWeight: 600,
    ...(variant === 'sidebar'
      ? {
          py: 1.25,
          justifyContent: 'center',
          minWidth: expanded ? undefined : 48,
        }
      : {
          flexShrink: 0,
        }),
    transition: [
      `transform 180ms ${PRESS_RELEASE_EASING}`,
      `background-color 200ms ${STANDARD_EASING}`,
      `color 200ms ${STANDARD_EASING}`,
      `box-shadow 200ms ${STANDARD_EASING}`,
      `opacity 200ms ${STANDARD_EASING}`,
    ].join(', '),
    '&:hover:not(:disabled)': {
      boxShadow: (theme) => `0 2px 8px ${theme.palette.primary.main}33`,
    },
    '&:active:not(:disabled)': {
      transform: `scale(${pressScale})`,
      boxShadow: 'none',
    },
    '& .MuiButton-startIcon': {
      transition: `transform 150ms ${STANDARD_EASING}`,
      ...(variant === 'sidebar' && !expanded ? { mx: 0 } : {}),
    },
    '&:active:not(:disabled) .MuiButton-startIcon': {
      transform: 'scale(1.1)',
    },
    '& .ds-pick-scan-target-icon-loading': {
      display: 'inline-flex',
      animation: 'dsPickScanTargetSpin 1.2s linear infinite',
    },
    '@keyframes dsPickScanTargetSpin': {
      to: { transform: 'rotate(360deg)' },
    },
    ...(isLoading
      ? {
          opacity: 0.88,
        }
      : {}),
    ...(showSuccess
      ? {
          bgcolor: 'primaryContainer.main',
          color: 'primaryContainer.contrastText',
          animation: 'dsPickScanTargetSuccess 400ms ease-out',
          '@keyframes dsPickScanTargetSuccess': {
            '0%': { transform: 'scale(1)' },
            '45%': { transform: 'scale(1.02)' },
            '100%': { transform: 'scale(1)' },
          },
          '&:hover:not(:disabled)': {
            boxShadow: 'none',
            bgcolor: 'primaryContainer.main',
          },
        }
      : {}),
    '@media (prefers-reduced-motion: reduce)': {
      transition: `background-color 200ms ${STANDARD_EASING}, color 200ms ${STANDARD_EASING}, opacity 200ms ${STANDARD_EASING}`,
      animation: 'none',
      '&:active:not(:disabled)': {
        transform: 'none',
      },
      '&:active:not(:disabled) .MuiButton-startIcon': {
        transform: 'none',
      },
      '& .ds-pick-scan-target-icon-loading': {
        animation: 'none',
      },
    },
  };
}

/** @deprecated Use getPickScanTargetButtonSx with variant sidebar. */
export const SCAN_FOLDER_SUCCESS_MS = PICK_SCAN_TARGET_SUCCESS_MS;

/** @deprecated Use getPickScanTargetButtonSx with variant sidebar. */
export function getScanFolderButtonSx(
  state: Omit<PickScanTargetButtonVisualState, 'variant'> & { expanded: boolean },
): SxProps<Theme> {
  return getPickScanTargetButtonSx({ ...state, variant: 'sidebar' });
}
