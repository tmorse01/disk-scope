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

export type CleanupCandidateCategory = 'general' | 'developer';

export type CleanupCandidate = {
  path: string;
  name: string;
  label: string;
  ruleId: string;
  sizeBytes: number;
  fileCount: number;
  risk: RiskLevel;
  recommendation: string;
  category: CleanupCandidateCategory;
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
  durationMs: number;
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

export type DeleteMethod = 'recycle-bin' | 'permanent';

export type DirectoryListingEntry = {
  name: string;
  path: string;
  kind: 'file' | 'directory';
  sizeBytes: number;
  modifiedAt?: string;
};

export type DeletePathOptions = {
  path: string;
  method: DeleteMethod;
};

export type FileActionError = {
  code: string;
  message: string;
};

export type AppPreferences = {
  theme: 'light' | 'dark';
  exclusions: ScanExclusion[];
  confirmBeforeDelete: boolean;
  defaultDeleteMethod: DeleteMethod;
  developerCleanupEnabled: boolean;
  autoCheckForUpdates: boolean;
};

export type UpdatePhase =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'ready'
  | 'up-to-date'
  | 'error';

export type UpdateStatusSnapshot = {
  phase: UpdatePhase;
  currentVersion: string;
  availableVersion?: string;
  lastCheckedAt?: string;
  downloadPercent?: number;
  message?: string;
  errorMessage?: string;
};

export type StartScanOptions = {
  rootPath: string;
  useFilesystemCache?: boolean;
};

export type StartScanResponse = {
  scanId: ScanSessionId;
  cacheWarning?: string;
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

export type PersistedScanHistoryEntry = {
  scanId: ScanSessionId;
  status: 'completed' | 'cancelled';
  developerCleanupEnabledAtScan: boolean;
  savedAt: string;
  result: ScanResult;
};

export type ScanHistoryFile = {
  version: number;
  lastSelectedPaths: string[];
  entries: PersistedScanHistoryEntry[];
};

export type ScanHistoryHydrationEntry = {
  scanId: ScanSessionId;
  status: 'completed' | 'cancelled';
  developerCleanupEnabledAtScan: boolean;
  savedAt: string;
  result: ScanResult;
  rootPathMissing: boolean;
};

export type ScanHistoryHydrationPayload = {
  entries: ScanHistoryHydrationEntry[];
  lastSelectedPaths: string[];
};

export type E2eAutostartConfig = {
  rootPath: string;
};

export type Unsubscribe = () => void;

export type WindowMaximizeChangedEvent = {
  isMaximized: boolean;
};

export type WindowControlsAPI = {
  minimize(): Promise<void>;
  toggleMaximize(): Promise<boolean>;
  close(): Promise<void>;
  isMaximized(): Promise<boolean>;
  onMaximizeChanged(callback: (event: WindowMaximizeChangedEvent) => void): Unsubscribe;
};

export type UpdateAPI = {
  checkForUpdates(): Promise<void>;
  installUpdate(): Promise<void>;
  getUpdateStatus(): Promise<UpdateStatusSnapshot>;
  onUpdateStatus(callback: (status: UpdateStatusSnapshot) => void): Unsubscribe;
};

export type DiskScopeAPI = {
  selectDirectory(): Promise<SelectedPath | null>;
  startScan(options: StartScanOptions): Promise<StartScanResponse>;
  cancelScan(scanId: ScanSessionId): Promise<void>;
  revealPath(path: string): Promise<void>;
  copyPath(path: string): Promise<void>;
  listDirectoryContents(dirPath: string): Promise<import('./result').Result<DirectoryListingEntry[], FileActionError>>;
  deletePath(options: DeletePathOptions): Promise<import('./result').Result<void, FileActionError>>;
  exportReport(scanId: ScanSessionId, options: ExportOptions): Promise<void>;
  getPreferences(): Promise<AppPreferences>;
  setPreferences(preferences: AppPreferences): Promise<AppPreferences>;
  getScanHistory(): Promise<ScanHistoryHydrationPayload>;
  saveLastSelectedPaths(paths: string[]): Promise<void>;
  onScanProgress(callback: (event: ScanProgressEvent) => void): Unsubscribe;
  onScanComplete(callback: (event: ScanCompleteEvent) => void): Unsubscribe;
  onScanError(callback: (event: ScanErrorEvent) => void): Unsubscribe;
  /** Returns fixture scan config when DISKSCOPE_E2E=1 at launch; otherwise null. */
  getE2eAutostartConfig(): Promise<E2eAutostartConfig | null>;
  windowControls?: WindowControlsAPI;
  updates?: UpdateAPI;
};
