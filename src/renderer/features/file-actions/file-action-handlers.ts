export async function revealTargetPath(targetPath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.revealPath(targetPath);
}

export async function copyTargetPath(targetPath: string): Promise<void> {
  if (typeof window.diskScope === 'undefined') {
    return;
  }

  await window.diskScope.copyPath(targetPath);
}
