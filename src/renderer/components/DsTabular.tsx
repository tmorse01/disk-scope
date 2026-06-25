import Typography from '@mui/material/Typography';
import type { TypographyProps } from '@mui/material/Typography';
import { tabularTypography } from '../theme/typography';

type DsTabularProps = TypographyProps;

export function DsTabular({ sx, ...props }: DsTabularProps) {
  return (
    <Typography
      component="span"
      {...props}
      sx={{
        ...tabularTypography,
        ...sx,
      }}
    />
  );
}
