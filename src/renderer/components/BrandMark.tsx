import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';
import brandLogoUrl from '../../../assets/brand/logo-favicon.svg?url';
import type { BrandMarkSize } from '../../shared/branding';
import { radii } from '../theme/tokens';

type BrandMarkProps = {
  size?: BrandMarkSize | number;
  sx?: SxProps<Theme>;
  'aria-hidden'?: boolean;
};

export function BrandMark({ size = 32, sx, 'aria-hidden': ariaHidden = true }: BrandMarkProps) {
  return (
    <Box
      component="img"
      src={brandLogoUrl}
      alt=""
      aria-hidden={ariaHidden}
      sx={{
        width: size,
        height: size,
        borderRadius: `${radii.lg}px`,
        flexShrink: 0,
        display: 'block',
        ...sx,
      }}
    />
  );
}
