import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import type { ExclusionKind } from '../../../shared/types';
import { DsCard } from '../../components/DsCard';
import { DsPageHeader } from '../../components/DsStatusChip';
import { DsViewLayout } from '../../components/DsViewLayout';
import { MaterialIcon } from '../../components/MaterialIcon';
import { addExclusion, removeExclusion } from '../../stores/preferences-store';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { radii } from '../../theme/tokens';

function exclusionKindLabel(kind: ExclusionKind): string {
  return kind === 'path' ? 'Exact path' : 'Folder name pattern';
}

export function ExclusionsView() {
  const { exclusions } = usePreferencesStore();
  const [kind, setKind] = useState<ExclusionKind>('folder-name');
  const [value, setValue] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setFormError('Enter a path or folder name pattern.');
      return;
    }

    addExclusion(kind, trimmed);
    setValue('');
    setFormError(null);
  };

  const handlePickPath = async () => {
    if (typeof window.diskScope === 'undefined') {
      setFormError('DiskScope API is not available yet.');
      return;
    }

    try {
      const selected = await window.diskScope.selectDirectory();
      if (!selected) {
        return;
      }

      setKind('path');
      setValue(selected.path);
      setFormError(null);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Failed to pick a folder.');
    }
  };

  return (
    <DsViewLayout
      header={
        <DsPageHeader
          title="Exclusions"
          subtitle="Skip exact paths or folder name patterns during scans. Active exclusions apply to the next scan."
        />
      }
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <DsCard>
          <Box
            component="form"
            onSubmit={(event) => {
              event.preventDefault();
              handleAdd();
            }}
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}
          >
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel id="exclusion-kind-label">Type</InputLabel>
              <Select
                labelId="exclusion-kind-label"
                value={kind}
                label="Type"
                onChange={(event) => setKind(event.target.value as ExclusionKind)}
                sx={{ borderRadius: `${radii.md}px` }}
              >
                <MenuItem value="folder-name">Folder name pattern</MenuItem>
                <MenuItem value="path">Exact path</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={kind === 'path' ? 'Folder path' : 'Folder name pattern'}
              placeholder={kind === 'path' ? 'C:\\Projects\\node_modules' : 'node_modules'}
              value={value}
              onChange={(event) => {
                setValue(event.target.value);
                setFormError(null);
              }}
              helperText={
                kind === 'folder-name'
                  ? 'Use * and ? wildcards. Matches any folder name in the scan tree.'
                  : 'Exclude this folder and everything inside it.'
              }
              sx={{ flex: 1, minWidth: 240, '& .MuiOutlinedInput-root': { borderRadius: `${radii.md}px` } }}
            />

            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {kind === 'path' ? (
                <Button type="button" variant="outlined" onClick={() => void handlePickPath()}>
                  Browse
                </Button>
              ) : null}
              <Button type="submit" variant="contained">
                Add exclusion
              </Button>
            </Box>
          </Box>

          {formError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {formError}
            </Alert>
          ) : null}
        </DsCard>

        <DsCard noPadding>
          {exclusions.length === 0 ? (
            <Box sx={{ p: 3, color: 'text.secondary', fontStyle: 'italic' }}>No exclusions configured.</Box>
          ) : (
            <List dense disablePadding aria-label="Configured exclusions">
              {exclusions.map((exclusion) => (
                <ListItem
                  key={exclusion.id}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      aria-label={`Remove exclusion ${exclusion.value}`}
                      onClick={() => removeExclusion(exclusion.id)}
                    >
                      <MaterialIcon name="delete" />
                    </IconButton>
                  }
                  sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
                >
                  <ListItemText
                    primary={exclusion.value}
                    secondary={exclusionKindLabel(exclusion.kind)}
                    slotProps={{ primary: { sx: { wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '13px' } } }}
                  />
                  <Chip
                    label={exclusion.kind === 'path' ? 'Path' : 'Pattern'}
                    size="small"
                    sx={{ mr: 1, borderRadius: `${radii.full}px` }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DsCard>
      </Box>
    </DsViewLayout>
  );
}
