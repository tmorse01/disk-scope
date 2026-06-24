export const IPC_CHANNELS = {
  SELECT_DIRECTORY: 'disk-scope:select-directory',
  START_SCAN: 'disk-scope:start-scan',
  CANCEL_SCAN: 'disk-scope:cancel-scan',
  REVEAL_PATH: 'disk-scope:reveal-path',
  COPY_PATH: 'disk-scope:copy-path',
  EXPORT_REPORT: 'disk-scope:export-report',
  SCAN_PROGRESS: 'disk-scope:scan-progress',
  SCAN_COMPLETE: 'disk-scope:scan-complete',
  SCAN_ERROR: 'disk-scope:scan-error',
} as const;
