import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';
import { radii } from '../theme/tokens';

type DsCircularProgressRingProps = {
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  showPulse?: boolean;
  ariaLabel?: string;
};

export function DsCircularProgressRing({
  value,
  label,
  sublabel,
  size = 280,
  strokeWidth = 12,
  showPulse = true,
  ariaLabel = 'Scan activity',
}: DsCircularProgressRingProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const svgProps = useMemo(
    () => ({
      width: size,
      height: size,
      viewBox: `0 0 ${size} ${size}`,
    }),
    [size],
  );

  return (
    <Box
      role="progressbar"
      aria-label={ariaLabel}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      sx={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        component="svg"
        {...svgProps}
        sx={{ transform: 'rotate(-90deg)', display: 'block' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          style={{ color: 'var(--mui-palette-surfaceContainerHigh-main, #e7e8e9)' }}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{
            color: 'var(--mui-palette-primary-main)',
            transition: 'stroke-dashoffset 0.35s ease',
          }}
        />
      </Box>

      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          px: 2,
        }}
      >
        <Typography
          variant="h1"
          component="span"
          sx={{
            fontSize: { xs: '2.5rem', md: '3.5rem' },
            fontWeight: 400,
            color: 'primary.main',
            lineHeight: 1,
          }}
        >
          {label}
        </Typography>
        {sublabel ? (
          <Typography
            variant="overline"
            sx={{
              mt: 1,
              color: 'text.secondary',
              letterSpacing: '0.12em',
              fontSize: '11px',
            }}
          >
            {sublabel}
          </Typography>
        ) : null}
      </Box>

      {showPulse ? (
        <Box
          aria-hidden
          sx={{
            position: 'absolute',
            inset: strokeWidth,
            borderRadius: radii.full,
            border: 2,
            borderColor: 'primary.main',
            opacity: 0.2,
            pointerEvents: 'none',
            overflow: 'hidden',
            '@keyframes dsScanLine': {
              '0%': { transform: 'translateY(-100%)', opacity: 0 },
              '50%': { opacity: 1 },
              '100%': { transform: 'translateY(100%)', opacity: 0 },
            },
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              background: (theme) =>
                `linear-gradient(180deg, transparent, ${theme.palette.primary.main}33, transparent)`,
              animation: 'dsScanLine 2s ease-in-out infinite',
            },
          }}
        />
      ) : null}
    </Box>
  );
}
