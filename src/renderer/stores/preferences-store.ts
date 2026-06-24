/**
 * User preferences (theme, exclusions, last paths).
 * TODO(task-010): add persistence via JSON preferences file.
 */
export type PreferencesStoreState = {
  theme: 'light' | 'dark';
};

export const preferencesStore: PreferencesStoreState = {
  theme: 'light',
};
