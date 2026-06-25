import { useSyncExternalStore } from 'react';
import {
  getPreferencesStoreVersion,
  preferencesStore,
  subscribePreferencesStore,
  type PreferencesStoreState,
} from '../stores/preferences-store';

export function usePreferencesStore(): PreferencesStoreState {
  useSyncExternalStore(
    (onStoreChange) => subscribePreferencesStore(() => onStoreChange()),
    getPreferencesStoreVersion,
    () => 0,
  );
  return preferencesStore;
}
