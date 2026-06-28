import type { AppPreferences, ExclusionKind, ScanExclusion } from '../../shared/types';

export type PreferencesStoreState = AppPreferences;

export const preferencesStore: PreferencesStoreState = {
  theme: 'light',
  exclusions: [],
  confirmBeforeDelete: true,
  defaultDeleteMethod: 'recycle-bin',
  developerCleanupEnabled: false,
};

type PreferencesStoreListener = (state: PreferencesStoreState) => void;

const listeners = new Set<PreferencesStoreListener>();

let storeVersion = 0;
let saveQueue: Promise<void> = Promise.resolve();

export function getPreferencesStoreVersion(): number {
  return storeVersion;
}

export function subscribePreferencesStore(listener: PreferencesStoreListener): () => void {
  listeners.add(listener);
  listener(preferencesStore);

  return () => {
    listeners.delete(listener);
  };
}

function notifyPreferencesStore(): void {
  storeVersion += 1;
  for (const listener of listeners) {
    listener(preferencesStore);
  }
}

function applyPreferences(preferences: AppPreferences): void {
  preferencesStore.theme = preferences.theme;
  preferencesStore.exclusions = [...preferences.exclusions];
  preferencesStore.confirmBeforeDelete = preferences.confirmBeforeDelete;
  preferencesStore.defaultDeleteMethod = preferences.defaultDeleteMethod;
  preferencesStore.developerCleanupEnabled = preferences.developerCleanupEnabled;
}

function persistPreferences(): void {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  const snapshot: AppPreferences = {
    theme: preferencesStore.theme,
    exclusions: preferencesStore.exclusions.map((entry) => ({ ...entry })),
    confirmBeforeDelete: preferencesStore.confirmBeforeDelete,
    defaultDeleteMethod: preferencesStore.defaultDeleteMethod,
    developerCleanupEnabled: preferencesStore.developerCleanupEnabled,
  };

  saveQueue = saveQueue
    .then(async () => {
      const saved = await window.diskScope.setPreferences(snapshot);
      applyPreferences(saved);
      notifyPreferencesStore();
    })
    .catch(() => {
      // Keep local edits visible even if persistence fails.
    });
}

export async function initPreferencesStore(): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  try {
    const preferences = await window.diskScope.getPreferences();
    applyPreferences(preferences);
    notifyPreferencesStore();
  } catch {
    // Renderer can still edit local defaults when preload is unavailable.
  }
}

export function addExclusion(kind: ExclusionKind, value: string): void {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }

  preferencesStore.exclusions = [
    ...preferencesStore.exclusions,
    {
      id: crypto.randomUUID(),
      kind,
      value: trimmed,
    },
  ];
  notifyPreferencesStore();
  persistPreferences();
}

export function removeExclusion(exclusionId: string): void {
  preferencesStore.exclusions = preferencesStore.exclusions.filter((entry) => entry.id !== exclusionId);
  notifyPreferencesStore();
  persistPreferences();
}

export function setThemePreference(theme: AppPreferences['theme']): void {
  preferencesStore.theme = theme;
  notifyPreferencesStore();
  persistPreferences();
}

export function setConfirmBeforeDeletePreference(confirmBeforeDelete: boolean): void {
  preferencesStore.confirmBeforeDelete = confirmBeforeDelete;
  notifyPreferencesStore();
  persistPreferences();
}

export function setDefaultDeleteMethodPreference(defaultDeleteMethod: AppPreferences['defaultDeleteMethod']): void {
  preferencesStore.defaultDeleteMethod = defaultDeleteMethod;
  notifyPreferencesStore();
  persistPreferences();
}

export function setDeveloperCleanupEnabledPreference(developerCleanupEnabled: boolean): void {
  preferencesStore.developerCleanupEnabled = developerCleanupEnabled;
  notifyPreferencesStore();
  persistPreferences();
}

export function setPreferencesForTest(preferences: AppPreferences): void {
  applyPreferences(preferences);
  notifyPreferencesStore();
}

export function resetPreferencesStoreForTest(): void {
  preferencesStore.theme = 'light';
  preferencesStore.exclusions = [];
  preferencesStore.confirmBeforeDelete = true;
  preferencesStore.defaultDeleteMethod = 'recycle-bin';
  preferencesStore.developerCleanupEnabled = false;
  notifyPreferencesStore();
}

export function getActiveExclusions(): ScanExclusion[] {
  return preferencesStore.exclusions;
}
