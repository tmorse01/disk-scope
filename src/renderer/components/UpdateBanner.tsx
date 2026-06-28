import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import { MaterialIcon } from './MaterialIcon';

type UpdateBannerProps = {
  onOpenSettings?: () => void;
};

export function UpdateBanner({ onOpenSettings }: UpdateBannerProps) {
  const { status, showGlobalBanner, installUpdate } = useUpdateStatus();

  if (!showGlobalBanner || !status) {
    return null;
  }

  const { phase, message, downloadPercent, availableVersion } = status;

  if (phase === 'ready') {
    return (
      <Box
        component="section"
        aria-label="Update available"
        sx={{ flexShrink: 0, px: `${24}px`, pt: 1.5, pb: 0 }}
      >
        <Alert
          severity="info"
          variant="outlined"
          icon={<MaterialIcon name="system_update" />}
          action={
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
              {onOpenSettings ? (
                <Button color="inherit" size="small" onClick={onOpenSettings}>
                  Details
                </Button>
              ) : null}
              <Button
                variant="contained"
                size="small"
                onClick={() => void installUpdate()}
                startIcon={<MaterialIcon name="restart_alt" />}
              >
                Restart to update
              </Button>
            </Box>
          }
          sx={{ alignItems: 'center' }}
        >
          {message ??
            (availableVersion
              ? `Update ${availableVersion} is ready. Restart to install.`
              : 'An update is ready. Restart to install.')}
        </Alert>
      </Box>
    );
  }

  const progressValue =
    phase === 'downloading' && downloadPercent !== undefined ? downloadPercent : undefined;

  return (
    <Box
      component="section"
      aria-label="Update in progress"
      sx={{ flexShrink: 0, px: `${24}px`, pt: 1.5, pb: 0 }}
    >
      <Alert
        severity="info"
        variant="outlined"
        icon={<MaterialIcon name="download" />}
        sx={{ alignItems: 'center' }}
      >
        <Box sx={{ width: '100%' }}>
          {message ??
            (availableVersion
              ? `Downloading update ${availableVersion}…`
              : 'Downloading update…')}
          {progressValue !== undefined ? (
            <LinearProgress
              variant="determinate"
              value={progressValue}
              sx={{ mt: 1, borderRadius: 1 }}
              aria-label="Download progress"
            />
          ) : (
            <LinearProgress sx={{ mt: 1, borderRadius: 1 }} aria-label="Download progress" />
          )}
        </Box>
      </Alert>
    </Box>
  );
}
