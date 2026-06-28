import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { MaterialIcon } from '../../components/MaterialIcon';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { useUpdateStatus } from '../../hooks/useUpdateStatus';
import {
  setAutoCheckForUpdatesPreference,
  setConfirmBeforeDeletePreference,
  setDefaultDeleteMethodPreference,
  setDeveloperCleanupEnabledPreference,
  setThemePreference,
} from '../../stores/preferences-store';
import type { DeleteMethod } from '../../../shared/types';
import { radii } from '../../theme/tokens';

function formatLastChecked(lastCheckedAt?: string): string | null {
  if (!lastCheckedAt) {
    return null;
  }

  const date = new Date(lastCheckedAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleString();
}

function UpdatesCard() {
  const { autoCheckForUpdates } = usePreferencesStore();
  const { status, isBusy, checkForUpdates, installUpdate } = useUpdateStatus();

  const lastCheckedLabel = formatLastChecked(status?.lastCheckedAt);
  const phase = status?.phase;

  return (
    <DsCard>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <MaterialIcon name="system_update" style={{ color: 'var(--mui-palette-primary-main)' }} />
        <Typography variant="h3" component="h3" sx={{ fontSize: '18px', fontWeight: 600 }}>
          Updates
        </Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Current version: {status?.currentVersion ?? '…'}
      </Typography>

      {status?.message ? (
        <Typography
          variant="body2"
          sx={{ mb: lastCheckedLabel || status?.errorMessage ? 1 : 2 }}
        >
          {status.message}
        </Typography>
      ) : null}

      {phase === 'downloading' && status?.downloadPercent !== undefined ? (
        <LinearProgress
          variant="determinate"
          value={status.downloadPercent}
          sx={{ mb: 2, borderRadius: 1 }}
          aria-label="Download progress"
        />
      ) : null}

      {lastCheckedLabel ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: status?.errorMessage ? 1 : 2 }}
        >
          Last checked: {lastCheckedLabel}
        </Typography>
      ) : null}

      {status?.errorMessage ? (
        <Alert severity="error" variant="outlined" sx={{ mb: 2 }}>
          {status.errorMessage}
        </Alert>
      ) : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 2 }}>
        <Button
          variant="outlined"
          onClick={() => void checkForUpdates()}
          disabled={isBusy}
          startIcon={<MaterialIcon name="refresh" />}
        >
          Check for updates
        </Button>

        {phase === 'ready' ? (
          <Button
            variant="contained"
            onClick={() => void installUpdate()}
            startIcon={<MaterialIcon name="restart_alt" />}
          >
            Restart to update
          </Button>
        ) : null}
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={autoCheckForUpdates}
            onChange={(_, checked) => setAutoCheckForUpdatesPreference(checked)}
          />
        }
        label="Automatically check for updates"
      />
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
        When enabled, DiskScope checks for updates when the app starts. Portable builds do not
        receive automatic updates — reinstall from GitHub Releases instead.
      </Typography>
    </DsCard>
  );
}

export function SettingsView() {
  const { theme, confirmBeforeDelete, defaultDeleteMethod, developerCleanupEnabled } =
    usePreferencesStore();

  return (
    <DsViewLayout
      header={
        <DsPageHeader
          title="Settings"
          subtitle="Application preferences and appearance."
        />
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <UpdatesCard />

        <DsCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <MaterialIcon name="palette" style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="h3" component="h3" sx={{ fontSize: '18px', fontWeight: 600 }}>
              Appearance
            </Typography>
          </Box>

          <FormControl sx={{ minWidth: 200, mb: 2 }}>
            <InputLabel id="theme-select-label">Theme</InputLabel>
            <Select
              labelId="theme-select-label"
              value={theme}
              label="Theme"
              onChange={(event) => setThemePreference(event.target.value as 'light' | 'dark')}
              sx={{ borderRadius: `${radii.md}px` }}
            >
              <MenuItem value="light">Light</MenuItem>
              <MenuItem value="dark">Dark</MenuItem>
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Switch
                checked={theme === 'dark'}
                onChange={(_, checked) => setThemePreference(checked ? 'dark' : 'light')}
              />
            }
            label="Use dark mode"
          />
        </DsCard>

        <DsCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <MaterialIcon name="cleaning_services" style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="h3" component="h3" sx={{ fontSize: '18px', fontWeight: 600 }}>
              Cleanup
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={developerCleanupEnabled}
                onChange={(_, checked) => setDeveloperCleanupEnabledPreference(checked)}
              />
            }
            label="Developer cleanup detection"
            sx={{ mb: 1, display: 'flex' }}
          />
          <Typography variant="body2" color="text.secondary">
            When enabled, flags project folders like node_modules, build caches, and project dist/build
            output. Off by default — use Largest Files and File Types to find videos, games, and other
            large personal files.
          </Typography>
        </DsCard>

        <DsCard>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <MaterialIcon name="shield" style={{ color: 'var(--mui-palette-primary-main)' }} />
            <Typography variant="h3" component="h3" sx={{ fontSize: '18px', fontWeight: 600 }}>
              Safety
            </Typography>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={confirmBeforeDelete}
                onChange={(_, checked) => setConfirmBeforeDeletePreference(checked)}
              />
            }
            label="Confirm before deleting"
            sx={{ mb: 2, display: 'flex' }}
          />

          <FormControl sx={{ minWidth: 260, mb: defaultDeleteMethod === 'permanent' ? 2 : 0 }}>
            <InputLabel id="delete-method-select-label">Default delete method</InputLabel>
            <Select
              labelId="delete-method-select-label"
              value={defaultDeleteMethod}
              label="Default delete method"
              onChange={(event) =>
                setDefaultDeleteMethodPreference(event.target.value as DeleteMethod)
              }
              sx={{ borderRadius: `${radii.md}px` }}
            >
              <MenuItem value="recycle-bin">Recycle Bin</MenuItem>
              <MenuItem value="permanent">Permanent delete</MenuItem>
            </Select>
          </FormControl>

          {defaultDeleteMethod === 'permanent' ? (
            <Alert severity="warning" variant="outlined">
              Files deleted with permanent delete are not recoverable from the Recycle Bin.
            </Alert>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Deleted items are moved to the Recycle Bin when that method is selected.
            </Typography>
          )}
        </DsCard>

        <DsCard sx={{ bgcolor: 'surfaceContainerLow.main' }}>
          <Typography variant="body2" color="text.secondary">
            Exclusions are managed from the Exclusions section in the sidebar.
          </Typography>
        </DsCard>
      </Box>
    </DsViewLayout>
  );
}
