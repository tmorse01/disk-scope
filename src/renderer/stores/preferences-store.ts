import type { AppPreferences, ExclusionKind, ScanExclusion } from '../../shared/types';

export type PreferencesStoreState = AppPreferences;

export const preferencesStore: PreferencesStoreState = {
  theme: 'light',
  exclusions: [],
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
}

function persistPreferences(): void {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  const snapshot: AppPreferences = {
    theme: preferencesStore.theme,
    exclusions: preferencesStore.exclusions.map((entry) => ({ ...entry })),
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

export function setPreferencesForTest(preferences: AppPreferences): void {
  applyPreferences(preferences);
  notifyPreferencesStore();
}

export function resetPreferencesStoreForTest(): void {
  preferencesStore.theme = 'light';
  preferencesStore.exclusions = [];
  notifyPreferencesStore();
}

export function getActiveExclusions(): ScanExclusion[] {
  return preferencesStore.exclusions;
}
