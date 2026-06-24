import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

export function SettingsView() {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
          Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Application preferences will appear here.
        </Typography>
      </CardContent>
    </Card>
  );
}
