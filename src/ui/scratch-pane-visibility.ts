export type ScratchPaneId = "source" | "result" | "preview";

export type ScratchPaneVisibility = {
  source: boolean;
  result: boolean;
  preview: boolean;
};

/** @deprecated Use ScratchPaneVisibility */
export type EditorPaneVisibility = ScratchPaneVisibility;

/** @deprecated Use ScratchPaneId */
export type EditorPaneId = "source" | "result";

export const DEFAULT_SCRATCH_PANE_VISIBILITY: ScratchPaneVisibility = {
  source: true,
  result: true,
  preview: true,
};

/** @deprecated Use DEFAULT_SCRATCH_PANE_VISIBILITY */
export const DEFAULT_EDITOR_PANE_VISIBILITY = DEFAULT_SCRATCH_PANE_VISIBILITY;

export function countVisibleScratchPanes(
  visibility: ScratchPaneVisibility,
): number {
  return (
    (visibility.source ? 1 : 0) +
    (visibility.result ? 1 : 0) +
    (visibility.preview ? 1 : 0)
  );
}

export function countVisibleEditorPanes(
  visibility: ScratchPaneVisibility,
): number {
  return (visibility.source ? 1 : 0) + (visibility.result ? 1 : 0);
}
