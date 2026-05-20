import { LAYOUT_BREAKPOINT_WIDTH_CHIPS } from './layout-breakpoints';

export const BREAKPOINT_WIDTHS = LAYOUT_BREAKPOINT_WIDTH_CHIPS.map(
  (chip) => chip.width,
) as [367, 368, 767, 768];

export type BreakpointWidth = (typeof BREAKPOINT_WIDTHS)[number];

/** 너비: breakpoint 칩 · 콘텐츠 w-fit · 수동 입력 — 동시에 하나만 active */
export type PreviewWidthMode =
  | { kind: 'breakpoint'; width: BreakpointWidth }
  | { kind: 'fit' }
  | { kind: 'custom' };

/** 높이: 콘텐츠 h-fit · cap(상한) — 동시에 하나만 active */
export type PreviewHeightMode = { kind: 'fit' } | { kind: 'cap' };

export const DEFAULT_PREVIEW_WIDTH_MODE: PreviewWidthMode = {
  kind: 'breakpoint',
  width: 768,
};

export const DEFAULT_PREVIEW_HEIGHT_MODE: PreviewHeightMode = { kind: 'cap' };

export function isBreakpointWidth(width: number): width is BreakpointWidth {
  return (BREAKPOINT_WIDTHS as readonly number[]).includes(width);
}

export function previewWidthModeFromWidth(width: number): PreviewWidthMode {
  if (isBreakpointWidth(width)) {
    return { kind: 'breakpoint', width };
  }
  return { kind: 'custom' };
}

export function isPreviewSizeModeAtBaseline(
  previewWidth: number,
  previewHeight: number,
  widthMode: PreviewWidthMode,
  heightMode: PreviewHeightMode,
  baseline: { previewWidth: number; previewHeight: number },
): boolean {
  return (
    previewWidth === baseline.previewWidth &&
    previewHeight === baseline.previewHeight &&
    widthMode.kind === 'breakpoint' &&
    widthMode.width === baseline.previewWidth &&
    heightMode.kind === 'cap'
  );
}
