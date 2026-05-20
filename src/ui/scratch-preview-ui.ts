/** Preview 패널 — Storybook/Figma식 저채도 chrome */

export const SCRATCH_PREVIEW_PANEL_CLASS =
  'rounded-md border border-slate-200 bg-slate-50/80 px-3 py-2.5 font-sans text-xs leading-snug text-slate-800';

export const SCRATCH_PREVIEW_TOOLBAR_DIVIDER_CLASS =
  'hidden h-4 w-px shrink-0 bg-slate-300 sm:block';

export const SCRATCH_PREVIEW_HINT_CLASS =
  'text-[11px] font-normal text-slate-500';

/** segmented 트랙 (bg-slate-100 + inset ring) */
export const SCRATCH_SEGMENT_TRACK_CLASS =
  'inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md bg-slate-100 p-0.5 ring-1 ring-inset ring-slate-200/90';

export const SCRATCH_SEGMENT_ITEM_BASE =
  'inline-flex h-6 cursor-pointer items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-40';

export function scratchSegmentItemClass(active: boolean): string {
  return `${SCRATCH_SEGMENT_ITEM_BASE} ${
    active
      ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80'
      : 'text-slate-600 hover:text-slate-900'
  }`;
}

/** 툴바 액션 — 캡처 primary (저채도, 녹색 풀버튼 대신) */
export const SCRATCH_TOOLBAR_BTN_CLASS =
  'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[5px] border border-slate-300 bg-white px-2.5 text-xs font-medium text-slate-800 shadow-sm transition-colors hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 disabled:shadow-none';

export const SCRATCH_TOOLBAR_BTN_PRIMARY_CLASS =
  'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[5px] border border-slate-400 bg-slate-800 px-2.5 text-xs font-medium text-white shadow-sm transition-colors hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-200 disabled:text-slate-500';

export const SCRATCH_TOOLBAR_BTN_GHOST_CLASS =
  'inline-flex h-7 shrink-0 cursor-pointer items-center rounded-[5px] px-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-40';

export const SCRATCH_DIFF_METRICS_BADGE_CLASS =
  'inline-flex shrink-0 items-center rounded-[5px] bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-medium tabular-nums text-slate-600 ring-1 ring-inset ring-slate-200/90';

/** Source / Result 레이어 dot (채도만, pill 배경 없음) */
export const LAYER_DOT_SOURCE_CLASS = 'size-1.5 shrink-0 rounded-full bg-amber-500';
export const LAYER_DOT_RESULT_CLASS = 'size-1.5 shrink-0 rounded-full bg-emerald-600';
export const LAYER_DOT_MUTED_CLASS = 'size-1.5 shrink-0 rounded-full bg-slate-300';
