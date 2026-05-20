/**
 * `hera-client` app.css @theme — `--breakpoint-tablet`(368px), `--breakpoint-desktop`(768px).
 * 경계 양쪽(367/368, 767/768)으로 미디어쿼리 전후를 맞춘다.
 */
export const LAYOUT_BREAKPOINT_WIDTH_CHIPS = [
  {
    label: 'w367',
    width: 367,
    title: 'width 368px 미만 (mobile-down, width < 368px)',
  },
  {
    label: 'w368',
    width: 368,
    title: 'width 368px 이상 (min-width: tablet)',
  },
  {
    label: 'w767',
    width: 767,
    title: 'width 768px 미만 (tablet 구간 상한)',
  },
  {
    label: 'w768',
    width: 768,
    title: 'width 768px 이상 (min-width: desktop)',
  },
] as const;

export function breakpointChipButtonClass(active: boolean): string {
  return [
    'cursor-pointer rounded border px-2 py-0.5 text-[11px] font-semibold tabular-nums transition disabled:cursor-not-allowed',
    active
      ? 'border-amber-400/90 bg-amber-500/25 text-amber-100'
      : 'border-slate-500 bg-slate-700/80 text-slate-200 hover:border-slate-400 hover:bg-slate-600/80',
  ].join(' ');
}
