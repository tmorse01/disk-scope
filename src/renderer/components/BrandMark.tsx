import Box from '@mui/material/Box';
import brandLogoUrl from '../../../assets/brand/logo-favicon.svg?url';
import { radii } from '../theme/tokens';

type BrandMarkProps = {
  size?: number;
};

/** DiskScope brand mark (hard_drive + search on primary blue tile). */
export function BrandMark({ size = 40 }: BrandMarkProps) {
  return (
    <Box
      component="img"
      src={brandLogoUrl}
      alt=""
      aria-hidden
      sx={{
        width: size,
        height: size,
        borderRadius: `${radii.lg}px`,
        flexShrink: 0,
        display: 'block',
      }}
    />
  );
}
