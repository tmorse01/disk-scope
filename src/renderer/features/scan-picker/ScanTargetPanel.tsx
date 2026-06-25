import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { DsCard } from '../../components/DsCard';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { usePreferencesStore } from '../../hooks/usePreferencesStore';
import { useScanStore } from '../../hooks/useScanStore';
import {
  pickScanTarget,
  removeSelectedPath,
  startScanFromStore,
} from '../../stores/scan-store';
import { radii } from '../../theme/tokens';
import { isDriveRoot, targetIcon, targetTitle } from './scan-target-utils';

export function ScanTargetPanel() {
  const { status, selectedPaths, pickerError, scanError } = useScanStore();
  const { exclusions } = usePreferencesStore();
  const isSelecting = status === 'selecting-target';
  const isScanning = status === 'scanning';
  const canStart = selectedPaths.length > 0 && !isScanning && !isSelecting;
  const showExclusions = exclusions.length > 0 && !isScanning;

  return (
    <DsCard sx={{ p: { xs: 2, sm: 2.5 } }}>
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box>
          <Typography variant="h3" component="h2" sx={{ fontSize: '20px', fontWeight: 600 }}>
            Scan targets
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Add folders or drives, then start a scan.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="medium"
          disabled={isSelecting || isScanning}
          onClick={() => void pickScanTarget()}
          startIcon={<MaterialIcon name="add_circle" filled aria-hidden={false} />}
          sx={{ borderRadius: `${radii.lg}px`, textTransform: 'none', fontWeight: 600, flexShrink: 0 }}
        >
          {isSelecting ? 'Opening picker…' : 'Add folder or drive'}
        </Button>
      </Box>

      {selectedPaths.length === 0 ? (
        <Box
          sx={{
            py: 3,
            px: 2,
            textAlign: 'center',
            borderRadius: `${radii.lg}px`,
            border: 1,
            borderStyle: 'dashed',
            borderColor: 'outlineVariant.main',
            bgcolor: 'surfaceContainerLow.main',
          }}
        >
          <MaterialIcon
            name="folder_open"
            style={{ fontSize: 32, color: 'var(--mui-palette-text-secondary)', marginBottom: 8 }}
          />
          <Typography variant="body2" color="text.secondary">
            No targets selected yet.
          </Typography>
        </Box>
      ) : (
        <List
          dense
          disablePadding
          aria-label="Selected scan targets"
          sx={{
            maxHeight: 220,
            overflow: 'auto',
            border: 1,
            borderColor: 'outlineVariant.main',
            borderRadius: `${radii.lg}px`,
            bgcolor: 'surfaceContainerLowest.main',
          }}
        >
          {selectedPaths.map((path, index) => (
            <ListItem
              key={path}
              secondaryAction={
                !isScanning ? (
                  <IconButton
                    edge="end"
                    aria-label={`Remove ${targetTitle(path)}`}
                    onClick={() => removeSelectedPath(path)}
                    size="small"
                  >
                    <MaterialIcon name="close" />
                  </IconButton>
                ) : null
              }
              sx={{
                borderBottom: index < selectedPaths.length - 1 ? 1 : 0,
                borderColor: 'outlineVariant.main',
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: `${radii.md}px`,
                    bgcolor: 'surfaceContainerHigh.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialIcon
                    name={targetIcon(path)}
                    filled={isDriveRoot(path)}
                    style={{ fontSize: 20, color: 'var(--mui-palette-primary-main)' }}
                  />
                </Box>
              </ListItemIcon>
              <ListItemText
                primary={
                  <Typography component="span" sx={{ fontWeight: 600 }} noWrap>
                    {targetTitle(path)}
                  </Typography>
                }
                secondary={
                  <DsTabular
                    component="span"
                    sx={{
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '12px',
                    }}
                    title={path}
                  >
                    {path}
                  </DsTabular>
                }
              />
            </ListItem>
          ))}
        </List>
      )}

      {selectedPaths.length > 1 ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
          Scans run on the first target in the list.
        </Typography>
      ) : null}

      {showExclusions ? (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 0.75, alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mr: 0.5 }}>
            Exclusions ({exclusions.length})
          </Typography>
          {exclusions.map((exclusion) => (
            <Chip
              key={exclusion.id}
              size="small"
              label={exclusion.value}
              icon={
                <MaterialIcon
                  name={exclusion.kind === 'path' ? 'folder_off' : 'block'}
                  style={{ fontSize: 16 }}
                />
              }
            />
          ))}
        </Box>
      ) : null}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, alignItems: 'center' }}>
        <Button
          variant="contained"
          color="primary"
          disabled={!canStart}
          onClick={() => void startScanFromStore()}
          startIcon={<MaterialIcon name="play_arrow" filled aria-hidden={false} />}
          sx={{ borderRadius: `${radii.full}px`, textTransform: 'none', fontWeight: 600 }}
        >
          Start scan
        </Button>
      </Box>

      {pickerError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {pickerError}
        </Alert>
      ) : null}
      {scanError ? (
        <Alert severity="error" sx={{ mt: 2 }}>
          {scanError}
        </Alert>
      ) : null}
    </DsCard>
  );
}
