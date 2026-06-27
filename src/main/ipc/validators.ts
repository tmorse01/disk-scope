import type { DeleteMethod, ExportFormat, ScanSessionId } from '../../shared/types';
import { normalizePreferences } from '../services/preferences-store';

export class ValidationError extends Error {
  readonly field: string;

  constructor(field: string, message: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

function assertNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(field, `${field} must be a non-empty string`);
  }
  return value;
}

function isDeleteMethod(value: unknown): value is DeleteMethod {
  return value === 'recycle-bin' || value === 'permanent';
}

export function validateScanSessionId(value: unknown): ScanSessionId {
  return assertNonEmptyString(value, 'scanId');
}

export function validatePath(value: unknown): string {
  return assertNonEmptyString(value, 'path');
}

export function validateStartScanOptions(value: unknown): {
  rootPath: string;
  useFilesystemCache: boolean;
} {
  if (!value || typeof value !== 'object') {
    throw new ValidationError('options', 'startScan options must be an object');
  }

  const record = value as Record<string, unknown>;
  const useFilesystemCache = record.useFilesystemCache;

  if (useFilesystemCache !== undefined && typeof useFilesystemCache !== 'boolean') {
    throw new ValidationError('useFilesystemCache', 'useFilesystemCache must be a boolean');
  }

  return {
    rootPath: validatePath(record.rootPath),
    useFilesystemCache: useFilesystemCache !== false,
  };
}

export function validateExportOptions(value: unknown): { format: ExportFormat } {
  if (!value || typeof value !== 'object') {
    throw new ValidationError('options', 'export options must be an object');
  }

  const record = value as Record<string, unknown>;
  const format = record.format;

  if (format !== 'json' && format !== 'csv') {
    throw new ValidationError('format', 'format must be "json" or "csv"');
  }

  return { format };
}

export function validateDeletePathOptions(value: unknown): { path: string; method: DeleteMethod } {
  if (!value || typeof value !== 'object') {
    throw new ValidationError('options', 'deletePath options must be an object');
  }

  const record = value as Record<string, unknown>;
  const targetPath = validatePath(record.path);
  const method = record.method;

  if (!isDeleteMethod(method)) {
    throw new ValidationError('method', 'method must be "recycle-bin" or "permanent"');
  }

  return { path: targetPath, method };
}

export function validateAppPreferences(value: unknown): ReturnType<typeof normalizePreferences> {
  return normalizePreferences(value);
}
