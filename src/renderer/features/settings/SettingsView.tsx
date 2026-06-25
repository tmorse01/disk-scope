import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { MaterialIcon } from '../../components/MaterialIcon';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { setThemePreference } from '../../stores/preferences-store';
import { radii } from '../../theme/tokens';

export function SettingsView() {
  const { theme } = usePreferencesStore();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <DsPageHeader
        title="Settings"
        subtitle="Application preferences and appearance."
      />

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
          control={<Switch checked={theme === 'dark'} onChange={(_, checked) => setThemePreference(checked ? 'dark' : 'light')} />}
          label="Use dark mode"
        />
      </DsCard>

      <DsCard sx={{ bgcolor: 'surfaceContainerLow.main' }}>
        <Typography variant="body2" color="text.secondary">
          More settings will appear here as DiskScope grows. Exclusions are managed from the Exclusions section in the
          sidebar.
        </Typography>
      </DsCard>
    </Box>
  );
}
