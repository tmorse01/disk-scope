export const NO_EXTENSION_LABEL = '[no extension]';

export function formatExtensionLabel(extension: string | null): string {
  return extension ?? NO_EXTENSION_LABEL;
}
