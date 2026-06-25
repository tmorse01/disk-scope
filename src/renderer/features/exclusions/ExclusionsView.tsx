import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
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
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { ExclusionKind } from '../../../shared/types';
import { MaterialIcon } from '../../components/MaterialIcon';
import { addExclusion, removeExclusion } from '../../stores/preferences-store';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';

function exclusionKindLabel(kind: ExclusionKind): string {
  return kind === 'path' ? 'Exact path' : 'Folder name';
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
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, py: 2 }}>
        <Box>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
            Exclusions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Skip exact paths or folder name patterns during scans. Active exclusions apply to the
            next scan.
          </Typography>
        </Box>

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
            sx={{ flex: 1, minWidth: 240 }}
          />

          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {kind === 'path' ? (
              <Button
                type="button"
                variant="outlined"
                onClick={() => void handlePickPath()}
                sx={{ textTransform: 'none' }}
              >
                Browse
              </Button>
            ) : null}
            <Button type="submit" variant="contained" sx={{ textTransform: 'none' }}>
              Add exclusion
            </Button>
          </Box>
        </Box>

        {formError ? <Alert severity="error">{formError}</Alert> : null}

        {exclusions.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            No exclusions configured.
          </Typography>
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
                sx={{
                  px: 0,
                  borderBottom: 1,
                  borderColor: 'divider',
                }}
              >
                <ListItemText
                  primary={exclusion.value}
                  secondary={exclusionKindLabel(exclusion.kind)}
                  slotProps={{ primary: { sx: { wordBreak: 'break-all' } } }}
                />
                <Chip
                  label={exclusion.kind === 'path' ? 'Path' : 'Pattern'}
                  size="small"
                  sx={{ mr: 1 }}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}
