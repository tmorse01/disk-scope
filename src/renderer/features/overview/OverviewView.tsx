import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import type { ExportFormat } from '../../../shared/types';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import { exportReportFromStore } from '../../stores/scan-store';
import { ScanSessionControls } from '../scan-progress/ScanSessionControls';
import { ScanTargetPicker } from '../scan-picker/ScanTargetPicker';

type OverviewViewProps = {
  message?: string;
};

export function OverviewView({
  message = 'Run a scan to see disk usage summary and top metrics.',
}: OverviewViewProps) {
  const { status, result } = useScanStore();
  const [exportingFormat, setExportingFormat] = useState<ExportFormat | null>(null);
  const hasResult = Boolean(result) && (status === 'completed' || status === 'cancelled');

  async function handleExport(format: ExportFormat): Promise<void> {
    setExportingFormat(format);
    try {
      await exportReportFromStore(format);
    } finally {
      setExportingFormat(null);
    }
  }

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
        {hasResult ? (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
            <Button
              variant="outlined"
              size="small"
              disabled={exportingFormat !== null}
              onClick={() => void handleExport('json')}
              startIcon={<MaterialIcon name="download" aria-hidden={false} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              {exportingFormat === 'json' ? 'Exporting…' : 'Export JSON'}
            </Button>
            <Button
              variant="outlined"
              size="small"
              disabled={exportingFormat !== null}
              onClick={() => void handleExport('csv')}
              startIcon={<MaterialIcon name="download" aria-hidden={false} />}
              sx={{ borderRadius: 999, textTransform: 'none', fontWeight: 600 }}
            >
              {exportingFormat === 'csv' ? 'Exporting…' : 'Export CSV'}
            </Button>
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}
