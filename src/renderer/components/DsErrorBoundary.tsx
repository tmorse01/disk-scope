import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { Component, Fragment, type ErrorInfo, type ReactNode } from 'react';
import { MaterialIcon } from './MaterialIcon';

type DsErrorBoundaryProps = {
  children: ReactNode;
  /** Called when the user chooses a safe fallback (e.g. navigate to Overview). */
  onBackToSafety?: () => void;
  /** When any value changes, the boundary clears its error state. */
  resetKeys?: readonly unknown[];
  title?: string;
};

type DsErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
};

export class DsErrorBoundary extends Component<DsErrorBoundaryProps, DsErrorBoundaryState> {
  state: DsErrorBoundaryState = {
    hasError: false,
    error: null,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<DsErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Renderer error boundary caught an error', error, info.componentStack);
  }

  componentDidUpdate(prevProps: DsErrorBoundaryProps): void {
    const { resetKeys } = this.props;
    if (!this.state.hasError || !resetKeys || !prevProps.resetKeys) {
      return;
    }

    if (
      resetKeys.length !== prevProps.resetKeys.length ||
      resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.resetError();
    }
  }

  private resetError = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleRetry = (): void => {
    this.setState((state) => ({
      hasError: false,
      error: null,
      retryCount: state.retryCount + 1,
    }));
  };

  private handleBackToSafety = (): void => {
    this.resetError();
    this.props.onBackToSafety?.();
  };

  render(): ReactNode {
    const { children, title = 'Something went wrong' } = this.props;
    const { hasError, error, retryCount } = this.state;

    if (!hasError) {
      return <Fragment key={retryCount}>{children}</Fragment>;
    }

    return (
      <Box
        role="alert"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 2,
          py: 6,
          px: 2,
        }}
      >
        <Box
          sx={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            bgcolor: 'error.light',
            color: 'error.contrastText',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialIcon name="error" filled style={{ fontSize: 36 }} />
        </Box>

        <Typography variant="h5" component="h2">
          {title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 480 }}>
          {error?.message ?? 'An unexpected error occurred while rendering this view.'}
        </Typography>

        <Alert severity="warning" variant="outlined" sx={{ maxWidth: 480, textAlign: 'left' }}>
          Your scan data is still available. Try again or return to a safe view.
        </Alert>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            onClick={this.handleRetry}
            startIcon={<MaterialIcon name="refresh" aria-hidden={false} />}
            sx={{ textTransform: 'none', borderRadius: 999 }}
          >
            Try again
          </Button>
          {this.props.onBackToSafety ? (
            <Button
              variant="outlined"
              onClick={this.handleBackToSafety}
              startIcon={<MaterialIcon name="home" aria-hidden={false} />}
              sx={{ textTransform: 'none', borderRadius: 999 }}
            >
              Back to safety
            </Button>
          ) : null}
        </Stack>

        {retryCount > 0 ? (
          <Typography variant="caption" color="text.disabled">
            Retry attempt {retryCount}
          </Typography>
        ) : null}
      </Box>
    );
  }
}
