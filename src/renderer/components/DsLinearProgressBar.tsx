import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { radii } from '../theme/tokens';

type DsLinearProgressBarProps = {
  value: number;
  label?: string;
  caption?: string;
  height?: number;
  ariaLabel?: string;
};

export function DsLinearProgressBar({
  value,
  label,
  caption,
  height = 8,
  ariaLabel = 'Scan activity',
}: DsLinearProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <Box sx={{ width: '100%' }}>
      {label || caption ? (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          {label ? (
            <Typography variant="overline" sx={{ color: 'text.secondary', letterSpacing: '0.08em' }}>
              {label}
            </Typography>
          ) : (
            <span />
          )}
          {caption ? (
            <Typography variant="overline" sx={{ color: 'primary.main', letterSpacing: '0.08em' }}>
              {caption}
            </Typography>
          ) : null}
        </Box>
      ) : null}
      <Box
        role="progressbar"
        aria-label={ariaLabel}
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        sx={{
          width: '100%',
          height,
          bgcolor: 'surfaceContainerHighest.main',
          borderRadius: `${radii.full}px`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${clamped}%`,
            bgcolor: 'primary.main',
            borderRadius: `${radii.full}px`,
            transition: 'width 0.35s ease',
          }}
        />
      </Box>
    </Box>
  );
}
