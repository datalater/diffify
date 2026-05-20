const UI_KEY = 'diffify-scratch-ui';

export function readScratchShowingSource(defaultValue = true): boolean {
  try {
    const raw = localStorage.getItem(UI_KEY);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw) as { showingSource?: unknown };
    return parsed.showingSource === false ? false : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function writeScratchShowingSource(showingSource: boolean): void {
  try {
    localStorage.setItem(UI_KEY, JSON.stringify({ showingSource }));
  } catch {
    /* quota */
  }
}
