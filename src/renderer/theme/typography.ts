import type { TypographyVariantsOptions } from '@mui/material/styles';
import { fonts } from './tokens';

export const stitchTypography: TypographyVariantsOptions = {
  fontFamily: fonts.ui,
  h1: {
    fontFamily: fonts.ui,
    fontSize: '57px',
    fontWeight: 400,
    lineHeight: '64px',
    letterSpacing: '-0.25px',
  },
  h2: {
    fontFamily: fonts.ui,
    fontSize: '28px',
    fontWeight: 600,
    lineHeight: '36px',
  },
  h3: {
    fontFamily: fonts.ui,
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '28px',
  },
  h4: {
    fontFamily: fonts.ui,
    fontSize: '22px',
    fontWeight: 500,
    lineHeight: '28px',
  },
  h5: {
    fontFamily: fonts.ui,
    fontSize: '18px',
    fontWeight: 600,
    lineHeight: '24px',
  },
  h6: {
    fontFamily: fonts.ui,
    fontSize: '16px',
    fontWeight: 600,
    lineHeight: '22px',
  },
  body1: {
    fontFamily: fonts.ui,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
  },
  body2: {
    fontFamily: fonts.ui,
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: '20px',
    color: 'var(--mui-palette-text-secondary)',
  },
  subtitle1: {
    fontFamily: fonts.ui,
    fontSize: '14px',
    fontWeight: 500,
    lineHeight: '20px',
  },
  subtitle2: {
    fontFamily: fonts.ui,
    fontSize: '12px',
    fontWeight: 500,
    lineHeight: '18px',
  },
  caption: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
  },
  overline: {
    fontFamily: fonts.mono,
    fontSize: '11px',
    fontWeight: 500,
    lineHeight: '16px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },
  button: {
    fontFamily: fonts.ui,
    fontSize: '14px',
    fontWeight: 600,
    lineHeight: '20px',
    textTransform: 'none',
  },
};

export const tabularTypography = {
  fontFamily: fonts.mono,
  fontSize: '13px',
  fontWeight: 400,
  lineHeight: '20px',
  fontVariantNumeric: 'tabular-nums',
} as const;
