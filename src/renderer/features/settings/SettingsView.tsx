import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import type { DeleteMethod } from '../../../shared/types';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { MaterialIcon } from '../../components/MaterialIcon';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import {
  setConfirmBeforeDeletePreference,
  setDefaultDeleteMethodPreference,
  setDeveloperCleanupEnabledPreference,
  setThemePreference,
} from '../../stores/preferences-store';
import { radii } from '../../theme/tokens';

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
