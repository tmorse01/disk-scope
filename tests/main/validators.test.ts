import { describe, expect, it } from 'vitest';
import { ValidationError } from '../../src/main/ipc/validators';
import {
  validateExportOptions,
  validatePath,
  validateScanSessionId,
  validateStartScanOptions,
} from '../../src/main/ipc/validators';

describe('IPC validators', () => {
  describe('validateScanSessionId', () => {
    it('accepts non-empty strings', () => {
      expect(validateScanSessionId('scan-1')).toBe('scan-1');
    });

    it('rejects empty values', () => {
      expect(() => validateScanSessionId('')).toThrow(ValidationError);
      expect(() => validateScanSessionId(42)).toThrow(ValidationError);
    });
  });

  describe('validatePath', () => {
    it('accepts non-empty paths', () => {
      expect(validatePath('/tmp/foo')).toBe('/tmp/foo');
    });

    it('rejects invalid paths', () => {
      expect(() => validatePath('')).toThrow(ValidationError);
    });
  });

  describe('validateStartScanOptions', () => {
    it('accepts valid options', () => {
      expect(validateStartScanOptions({ rootPath: 'C:\\Users' })).toEqual({
        rootPath: 'C:\\Users',
      });
    });

    it('rejects missing rootPath', () => {
      expect(() => validateStartScanOptions({})).toThrow(ValidationError);
    });
  });

  describe('validateExportOptions', () => {
    it('accepts json and csv', () => {
      expect(validateExportOptions({ format: 'json' })).toEqual({ format: 'json' });
      expect(validateExportOptions({ format: 'csv' })).toEqual({ format: 'csv' });
    });

    it('rejects unknown formats', () => {
      expect(() => validateExportOptions({ format: 'xml' })).toThrow(ValidationError);
    });
  });
});
