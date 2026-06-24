import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { ScanSessionControls } from '../scan-progress/ScanSessionControls';
import { ScanTargetPicker } from '../scan-picker/ScanTargetPicker';

type OverviewViewProps = {
  message?: string;
};

export function OverviewView({
  message = 'Run a scan to see disk usage summary and top metrics.',
}: OverviewViewProps) {
  return (
    <Card variant="outlined">
      <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, py: 2 }}>
        <Typography variant="h5" component="h2" sx={{ fontWeight: 500 }}>
          Overview
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
        <ScanTargetPicker />
        <ScanSessionControls />
      </CardContent>
    </Card>
  );
}
