/** textarea·CodeMirror 공통 높이·resize 규칙 (preview 병렬 시 min만, max로 resize 잠금 안 함) */

export function scratchEditorSizeClass(
  fillHeight: boolean | undefined,
): string {
  if (fillHeight) return 'min-h-40 flex-1';
  return 'min-h-28';
}

export const TEXTAREA_EDITOR_BASE_CLASS =
  'w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 focus:outline-2 focus:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60';

export const CODEMIRROR_HOST_INNER_CLASS =
  '[&_.cm-editor]:flex [&_.cm-editor]:min-h-0 [&_.cm-editor]:h-full [&_.cm-editor]:max-h-full';

/** preview 병렬: 시작 높이 고정(CM 콘텐츠 높이 확장 방지). max-h 없음 → resize-y 유지 */
const COMPACT_CODEMIRROR_HOST_SIZE = 'h-28 min-h-28 shrink-0';

export function codeMirrorHostClass(fillHeight: boolean | undefined): string {
  const size = fillHeight
    ? 'min-h-40 min-h-0 flex-1'
    : COMPACT_CODEMIRROR_HOST_SIZE;
  return `flex w-full resize-y flex-col overflow-hidden ${size} ${CODEMIRROR_HOST_INNER_CLASS}`;
}

/** Space/D 등 전역 단축키 — 에디터 입력 중이면 무시 */
export function isScratchEditorTypingTarget(
  target: EventTarget | null,
): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('textarea, input, select')) return true;
  if (target.isContentEditable) return true;
  if (target.closest('.cm-editor')) return true;
  return false;
}

export function textareaEditorClass(fillHeight: boolean | undefined): string {
  return `${TEXTAREA_EDITOR_BASE_CLASS} ${scratchEditorSizeClass(fillHeight)}`;
}
