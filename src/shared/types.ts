export type ScanSessionId = string;
export type NodeId = string;

export type ScanStatus =
  | 'idle'
  | 'selecting-target'
  | 'scanning'
  | 'cancelled'
  | 'completed'
  | 'failed';

export type RiskLevel = 'low' | 'medium' | 'high' | 'do-not-touch';

export type DirectoryNode = {
  id: NodeId;
  parentId: NodeId | null;
  name: string;
  path: string;
  sizeBytes: number;
  fileCount: number;
  directoryCount: number;
  childDirectoryIds: NodeId[];
  modifiedAt?: string;
  unreadable: boolean;
  errorCode?: string;
};

export type LargestFileEntry = {
  path: string;
  name: string;
  extension: string | null;
  sizeBytes: number;
  modifiedAt?: string;
};

export type ExtensionSummary = {
  extension: string | null;
  sizeBytes: number;
  fileCount: number;
};

export type CleanupCandidate = {
  path: string;
  name: string;
  label: string;
  ruleId: string;
  sizeBytes: number;
  fileCount: number;
  risk: RiskLevel;
  recommendation: string;
};

export type ScanFileError = {
  path: string;
  operation: 'stat' | 'read-dir' | 'read-link' | 'unknown';
  code: string;
  message: string;
};

export type ScanResult = {
  scanId: ScanSessionId;
  rootPath: string;
  startedAt: string;
  completedAt: string;
  totalSizeBytes: number;
  fileCount: number;
  directoryCount: number;
  errorCount: number;
  rootNodeId: NodeId;
  directoriesById: Record<NodeId, DirectoryNode>;
  largestFiles: LargestFileEntry[];
  extensionSummaries: ExtensionSummary[];
  cleanupCandidates: CleanupCandidate[];
  errors: ScanFileError[];
};

export type SelectedPath = {
  path: string;
};

export type ExclusionKind = 'path' | 'folder-name';

export type ScanExclusion = {
  id: string;
  kind: ExclusionKind;
  value: string;
};

export type AppPreferences = {
  theme: 'light' | 'dark';
  exclusions: ScanExclusion[];
};

export type StartScanOptions = {
  rootPath: string;
};

export type ExportFormat = 'json' | 'csv';

export type ExportOptions = {
  format: ExportFormat;
};

export type ScanProgressEvent = {
  scanId: ScanSessionId;
  filesScanned: number;
  directoriesScanned: number;
  bytesDiscovered: number;
  currentPath: string;
  errorCount: number;
  elapsedMs: number;
};

export type ScanCompleteEvent = {
  scanId: ScanSessionId;
  result: ScanResult;
};

export type ScanErrorEvent = {
  scanId: ScanSessionId;
  message: string;
  code?: string;
};

export type Unsubscribe = () => void;

export type DiskScopeAPI = {
  selectDirectory(): Promise<SelectedPath | null>;
  startScan(options: StartScanOptions): Promise<ScanSessionId>;
  cancelScan(scanId: ScanSessionId): Promise<void>;
  revealPath(path: string): Promise<void>;
  copyPath(path: string): Promise<void>;
  exportReport(scanId: ScanSessionId, options: ExportOptions): Promise<void>;
  getPreferences(): Promise<AppPreferences>;
  setPreferences(preferences: AppPreferences): Promise<AppPreferences>;
  onScanProgress(callback: (event: ScanProgressEvent) => void): Unsubscribe;
  onScanComplete(callback: (event: ScanCompleteEvent) => void): Unsubscribe;
  onScanError(callback: (event: ScanErrorEvent) => void): Unsubscribe;
};
