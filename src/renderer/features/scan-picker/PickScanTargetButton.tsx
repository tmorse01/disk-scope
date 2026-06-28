import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import type { ButtonProps } from '@mui/material/Button';
import type { ReactNode } from 'react';
import { MaterialIcon } from '../../components/MaterialIcon';
import {
  getPickScanTargetButtonSx,
  type PickScanTargetButtonVariant,
} from './pick-scan-target-button-sx';
import { usePickScanTargetButton } from './usePickScanTargetButton';

export type PickScanTargetButtonProps = {
  variant: PickScanTargetButtonVariant;
  idleIcon: string;
  idleIconFilled?: boolean;
  children: ReactNode;
  /** Sidebar only — collapsed rail layout. */
  expanded?: boolean;
  disabled?: boolean;
  'aria-label'?: string;
} & Pick<ButtonProps, 'fullWidth' | 'size'>;

export function PickScanTargetButton({
  variant,
  idleIcon,
  idleIconFilled = false,
  children,
  expanded = true,
  disabled = false,
  fullWidth,
  size,
  'aria-label': ariaLabel,
}: PickScanTargetButtonProps) {
  const { isLoading, showSuccess, handleClick } = usePickScanTargetButton();

  const iconName = showSuccess ? 'folder_open' : isLoading ? 'progress_activity' : idleIcon;

  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth={fullWidth}
      size={size}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={ariaLabel}
      onClick={() => void handleClick()}
      startIcon={
        <Box
          component="span"
          className={isLoading ? 'ds-pick-scan-target-icon-loading' : undefined}
          sx={{ display: 'inline-flex', alignItems: 'center' }}
        >
          <MaterialIcon
            name={iconName}
            filled={showSuccess || (!isLoading && idleIconFilled)}
            style={{ fontSize: 20 }}
          />
        </Box>
      }
      sx={getPickScanTargetButtonSx({
        variant,
        expanded,
        isLoading,
        showSuccess,
      })}
    >
      {children}
    </Button>
  );
}
