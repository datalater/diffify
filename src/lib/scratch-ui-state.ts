import { getActiveProjectId, projectUiKey } from './scratch-project-registry';

export function readScratchShowingSource(
  defaultValue = true,
  projectId = getActiveProjectId(),
): boolean {
  try {
    const raw = localStorage.getItem(projectUiKey(projectId));
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw) as { showingSource?: unknown };
    return parsed.showingSource === false ? false : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function writeScratchShowingSource(
  showingSource: boolean,
  projectId = getActiveProjectId(),
): void {
  try {
    localStorage.setItem(
      projectUiKey(projectId),
      JSON.stringify({ showingSource }),
    );
  } catch {
    /* quota */
  }
}
