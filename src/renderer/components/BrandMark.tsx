import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import type { BrandMarkSize } from '../../shared/branding';
import { brandColors } from '../../shared/branding';

type BrandMarkProps = {
  size?: BrandMarkSize;
  sx?: SxProps<Theme>;
  'aria-hidden'?: boolean;
};

export function BrandMark({ size = 32, sx, 'aria-hidden': ariaHidden = true }: BrandMarkProps) {
  return (
    <Box
      component="svg"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden={ariaHidden}
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'block',
        ...sx,
      }}
    >
      <rect width="32" height="32" rx="8" fill={brandColors.primary} />
      <path d="M8 12h16v2H8v-2zm0 4h16v2H8v-2zm0 4h10v2H8v-2z" fill={brandColors.onPrimary} />
      <circle cx="22" cy="20" r="4" fill={brandColors.primaryContainer} />
    </Box>
  );
}
