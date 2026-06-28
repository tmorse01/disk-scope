import type { SxProps, Theme } from '@mui/material/styles';

const PRESS_RELEASE_EASING = 'cubic-bezier(0.34, 1.12, 0.64, 1)';
const STANDARD_EASING = 'cubic-bezier(0.2, 0, 0, 1)';

export const DELETE_CONFIRM_SUCCESS_MS = 450;

type DeleteConfirmButtonVisualState = {
  isDeleting: boolean;
  showSuccess: boolean;
};

/** Press, loading, and success styles for the delete confirm CTA. */
export function getDeleteConfirmButtonSx({
  isDeleting,
  showSuccess,
}: DeleteConfirmButtonVisualState): SxProps<Theme> {
  return {
    fontWeight: 600,
    textTransform: 'none',
    transition: [
      `transform 180ms ${PRESS_RELEASE_EASING}`,
      `background-color 200ms ${STANDARD_EASING}`,
      `box-shadow 200ms ${STANDARD_EASING}`,
      `opacity 200ms ${STANDARD_EASING}`,
    ].join(', '),
    bgcolor: 'error.main',
    color: 'error.contrastText',
    '&:hover:not(:disabled)': {
      bgcolor: 'error.dark',
      boxShadow: (theme) => `0 2px 10px ${theme.palette.error.main}44`,
    },
    '&:active:not(:disabled)': {
      transform: 'scale(0.96)',
      boxShadow: 'none',
    },
    '& .MuiButton-startIcon': {
      transition: `transform 150ms ${STANDARD_EASING}`,
    },
    '&:active:not(:disabled) .MuiButton-startIcon': {
      transform: 'scale(1.12)',
    },
    '& .ds-delete-confirm-icon-loading': {
      display: 'inline-flex',
      animation: 'dsDeleteConfirmSpin 1s linear infinite',
    },
    '@keyframes dsDeleteConfirmSpin': {
      to: { transform: 'rotate(360deg)' },
    },
    ...(isDeleting
      ? {
          opacity: 0.9,
        }
      : {}),
    ...(showSuccess
      ? {
          bgcolor: 'error.dark',
          animation: 'dsDeleteConfirmSuccess 450ms ease-out',
          '@keyframes dsDeleteConfirmSuccess': {
            '0%': { transform: 'scale(1)' },
            '35%': { transform: 'scale(1.04)' },
            '100%': { transform: 'scale(1)' },
          },
          '&:hover:not(:disabled)': {
            bgcolor: 'error.dark',
            boxShadow: 'none',
          },
        }
      : {}),
    '@media (prefers-reduced-motion: reduce)': {
      transition: `background-color 200ms ${STANDARD_EASING}, opacity 200ms ${STANDARD_EASING}`,
      animation: 'none',
      '&:active:not(:disabled)': {
        transform: 'none',
      },
      '&:active:not(:disabled) .MuiButton-startIcon': {
        transform: 'none',
      },
      '& .ds-delete-confirm-icon-loading': {
        animation: 'none',
      },
    },
  };
}

export function getDeleteConfirmDialogPaperSx(showSuccess: boolean): SxProps<Theme> {
  if (!showSuccess) {
    return {};
  }

  return {
    animation: 'dsDeleteDialogDismiss 450ms ease-in forwards',
    '@keyframes dsDeleteDialogDismiss': {
      '0%': { transform: 'scale(1)', opacity: 1 },
      '100%': { transform: 'scale(0.97)', opacity: 0.92 },
    },
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  };
}
