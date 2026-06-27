import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useCallback, useEffect, useState } from 'react';
import { BrandMark } from './BrandMark';
import { DsWindowControls } from './DsWindowControls';
import { TITLE_BAR_HEIGHT } from '../theme/mui-theme';

const dragRegionSx = { WebkitAppRegion: 'drag' } as const;

function getWindowControls() {
  return typeof window !== 'undefined' ? window.diskScope?.windowControls : undefined;
}

export function useCustomWindowChrome(): boolean {
  return getWindowControls() !== undefined;
}

export function DsTitleBar() {
  const windowControls = getWindowControls();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!windowControls) {
      return;
    }

    let cancelled = false;

    void windowControls.isMaximized().then((maximized) => {
      if (!cancelled) {
        setIsMaximized(maximized);
      }
    });

    const unsubscribe = windowControls.onMaximizeChanged(({ isMaximized: next }) => {
      setIsMaximized(next);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [windowControls]);

  const handleMinimize = useCallback(() => {
    void windowControls?.minimize();
  }, [windowControls]);

  const handleToggleMaximize = useCallback(() => {
    void windowControls?.toggleMaximize();
  }, [windowControls]);

  const handleClose = useCallback(() => {
    void windowControls?.close();
  }, [windowControls]);

  const handleDoubleClick = useCallback(() => {
    void windowControls?.toggleMaximize();
  }, [windowControls]);

  if (!windowControls) {
    return null;
  }

  return (
    <Box
      component="header"
      aria-label="Window title bar"
      onDoubleClick={handleDoubleClick}
      sx={(theme) => ({
        display: 'flex',
        alignItems: 'stretch',
        height: TITLE_BAR_HEIGHT,
        flexShrink: 0,
        bgcolor: 'surfaceContainerLow.main',
        borderBottom: 1,
        borderColor: 'outlineVariant.main',
        userSelect: 'none',
        ...dragRegionSx,
        ...theme.applyStyles('dark', {
          bgcolor: 'surfaceContainerLow.main',
        }),
      })}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          minWidth: 0,
          flex: 1,
          ...dragRegionSx,
        }}
      >
        <BrandMark size={24} />
        <Typography
          component="h1"
          variant="body2"
          sx={{
            fontWeight: 600,
            color: 'text.primary',
            lineHeight: 1,
            whiteSpace: 'nowrap',
            ...dragRegionSx,
          }}
        >
          DiskScope
        </Typography>
      </Box>

      <DsWindowControls
        isMaximized={isMaximized}
        onMinimize={handleMinimize}
        onToggleMaximize={handleToggleMaximize}
        onClose={handleClose}
      />
    </Box>
  );
}
