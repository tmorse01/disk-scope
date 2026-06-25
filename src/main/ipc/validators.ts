import type { ExportFormat, ScanSessionId } from '../../shared/types';
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

export function validateScanSessionId(value: unknown): ScanSessionId {
  return assertNonEmptyString(value, 'scanId');
}

export function validatePath(value: unknown): string {
  return assertNonEmptyString(value, 'path');
}

export function validateStartScanOptions(value: unknown): { rootPath: string } {
  if (!value || typeof value !== 'object') {
    throw new ValidationError('options', 'startScan options must be an object');
  }

  const record = value as Record<string, unknown>;
  return { rootPath: validatePath(record.rootPath) };
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

export function validateAppPreferences(value: unknown): ReturnType<typeof normalizePreferences> {
  return normalizePreferences(value);
}
