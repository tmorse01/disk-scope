import Box from '@mui/material/Box';

import Typography from '@mui/material/Typography';

import { formatBytes } from '../../../shared/format-bytes';
import {
  computeFilesPerSec,
  computeScanDurationMs,
  formatFilesPerSec,
} from '../../../shared/scan-duration';
import { DsTabular } from '../../components/DsTabular';
import { MaterialIcon } from '../../components/MaterialIcon';
import { useScanStore } from '../../hooks/useScanStore';
import { SCAN_STATUS_HEIGHT } from '../../theme/mui-theme';
import { shellFooterBackgroundSx } from '../../theme/shell-chrome';
import { formatElapsed, shortenPath } from './format-elapsed';



function statusIcon(status: string): string {

  switch (status) {

    case 'completed':

      return 'check_circle';

    case 'cancelled':

      return 'cancel';

    case 'failed':

      return 'error';

    default:

      return 'hourglass_empty';

  }

}



function statusLabel(status: string): string {

  switch (status) {

    case 'completed':

      return 'Scan complete';

    case 'cancelled':

      return 'Scan cancelled';

    case 'failed':

      return 'Scan failed';

    default:

      return 'No scan in progress';

  }

}



export function ScanProgressRegion() {

  const { status, result, scanError } = useScanStore();

  const hasSummary = status === 'completed' || status === 'cancelled';



  let statsLine = 'Scan progress will appear here during active scans.';

  let pathLine: string | null = null;



  if (hasSummary && result) {
    const durationMs = computeScanDurationMs(result);
    const filesPerSec = computeFilesPerSec(result.fileCount, durationMs);
    statsLine = `${result.fileCount.toLocaleString()} files · ${result.directoryCount.toLocaleString()} folders · ${formatBytes(result.totalSizeBytes)} · ${result.errorCount} errors · ${formatElapsed(durationMs)} · ${formatFilesPerSec(filesPerSec)}`;
    pathLine = result.rootPath;
  } else if (status === 'failed') {

    statsLine = scanError ?? 'The scan could not be completed.';

  }



  return (

    <Box

      component="footer"

      aria-label="Scan status"

      className="ds-glass"

      sx={(theme) => ({

        display: 'flex',

        alignItems: 'center',

        gap: 1.5,

        minHeight: SCAN_STATUS_HEIGHT,

        px: 3,

        py: 1,

        ...shellFooterBackgroundSx(theme),

        borderTop: 1,

        borderColor: 'outlineVariant.main',

        color: 'text.primary',

      })}

    >

      <MaterialIcon

        name={statusIcon(status)}

        style={{

          color:

            status === 'failed'

              ? 'var(--mui-palette-error-main)'

              : status === 'completed'

                ? 'var(--mui-palette-success-main)'

                : undefined,

          fontSize: 20,

          flexShrink: 0,

        }}

      />

      <Typography component="span" variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>

        {statusLabel(status)}

      </Typography>

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.25 }}>

        <Typography component="span" variant="body2" color="text.primary" noWrap title={statsLine}>

          {statsLine}

        </Typography>

        {pathLine ? (

          <DsTabular

            component="span"

            sx={{

              display: 'block',

              overflow: 'hidden',

              textOverflow: 'ellipsis',

              whiteSpace: 'nowrap',

              color: 'text.secondary',

              fontSize: '11px',

            }}

            title={pathLine}

          >

            {shortenPath(pathLine)}

          </DsTabular>

        ) : null}

      </Box>

    </Box>

  );

}


