import { describe, expect, it } from 'vitest';
import {
  isDriveRoot,
  targetIcon,
  targetTitle,
} from '../../src/renderer/features/scan-picker/scan-target-utils';

describe('scan-target-utils', () => {
  it('detects drive roots', () => {
    expect(isDriveRoot('C:\\')).toBe(true);
    expect(isDriveRoot('D:')).toBe(true);
    expect(isDriveRoot('C:\\Users')).toBe(false);
  });

  it('picks icons by target kind', () => {
    expect(targetIcon('C:\\')).toBe('hard_drive');
    expect(targetIcon('C:\\Users\\Demo')).toBe('folder');
  });

  it('formats target titles', () => {
    expect(targetTitle('C:\\')).toBe('C: drive');
    expect(targetTitle('C:\\Users\\Projects')).toBe('Projects');
  });
});
