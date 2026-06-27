import type { RiskLevel } from '../../../shared/types';

export type DeleteTargetKind = 'file' | 'directory';

export type DeleteTarget = {
  path: string;
  name: string;
  kind: DeleteTargetKind;
  sizeBytes: number;
  childFileCount?: number;
  childDirectoryCount?: number;
  risk?: RiskLevel;
};
