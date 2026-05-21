import {
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { formatScratchHtmlDocument } from '../lib/format-scratch-html';
import { createScratchDocument } from '../lib/source-document';
import { ScratchFullDocumentDialog } from './ScratchFullDocumentDialog';

export const SCRATCH_ACTION_BTN_CLASS =
  'cursor-pointer rounded border border-slate-300 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800 hover:bg-slate-100';

const FORMAT_SHORTCUT_TITLE = '들여쓰기·줄바꿈 정리 (⌘S / Ctrl+S)';

function isFormatShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key === 's';
}

function handleFormatShortcut(
  event: KeyboardEvent,
  onFormat: (() => void) | undefined,
): void {
  if (!onFormat || !isFormatShortcut(event)) return;
  event.preventDefault();
  onFormat();
}

function ScratchFormatButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={SCRATCH_ACTION_BTN_CLASS}
      title={FORMAT_SHORTCUT_TITLE}
    >
      Format
    </button>
  );
}

export function ScratchEditorColumn({
  title,
  head,
  html,
  onHeadChange,
  onHtmlChange,
  headActions,
  htmlActions,
  onFormatHead,
  onFormatHtml,
  headHelp,
  className,
  fillHeight = false,
  disabled = false,
}: {
  title: string;
  head: string;
  html: string;
  onHeadChange: (value: string) => void;
  onHtmlChange: (value: string) => void;
  headActions?: ReactNode;
  htmlActions?: ReactNode;
  onFormatHead?: () => void;
  onFormatHtml?: () => void;
  headHelp?: string;
  className?: string;
  fillHeight?: boolean;
  disabled?: boolean;
}) {
  const [fullDocOpen, setFullDocOpen] = useState(false);
  const fullDocument = useMemo(
    () =>
      formatScratchHtmlDocument(createScratchDocument(head, html)),
    [head, html],
  );

  return (
    <>
      <div
        className={`flex min-h-0 flex-col gap-2 rounded border border-slate-300 bg-white p-3 shadow-sm ${className ?? ''}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFullDocOpen(true)}
              className={SCRATCH_ACTION_BTN_CLASS}
              title="iframe srcDoc에 들어갈 전체 HTML 문서"
              disabled={disabled}
            >
              전체 코드
            </button>
            {onFormatHead && !disabled ? (
              <ScratchFormatButton onClick={onFormatHead} />
            ) : null}
            {disabled ? null : headActions}
          </div>
        </div>
        <label className="flex min-h-0 flex-col gap-1 text-xs text-slate-700">
          <span>
            <code className="rounded bg-slate-200 px-1 text-slate-900">
              &lt;head&gt;
            </code>
          </span>
          {headHelp ? (
            <span className="text-[11px] text-slate-500">{headHelp}</span>
          ) : null}
          <textarea
            value={head}
            onChange={(event) => onHeadChange(event.target.value)}
            onKeyDown={(event) => handleFormatShortcut(event, onFormatHead)}
            spellCheck={false}
            disabled={disabled}
            className="min-h-28 w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 focus:outline-2 focus:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            placeholder={'<meta charset="UTF-8">\n<script src="..."></script>'}
          />
        </label>
        <label className="flex min-h-0 flex-1 flex-col gap-1 text-xs text-slate-700">
          <span className="flex flex-wrap items-center justify-between gap-2">
            <span>
              <code className="rounded bg-slate-200 px-1 text-slate-900">
                &lt;body&gt;
              </code>
            </span>
            <span className="flex shrink-0 flex-wrap items-center gap-2">
              {onFormatHtml && !disabled ? (
                <ScratchFormatButton onClick={onFormatHtml} />
              ) : null}
              {disabled ? null : htmlActions}
            </span>
          </span>
          <textarea
            value={html}
            onChange={(event) => onHtmlChange(event.target.value)}
            onKeyDown={(event) => handleFormatShortcut(event, onFormatHtml)}
            spellCheck={false}
            disabled={disabled}
            className={`w-full resize-y rounded border border-slate-200 bg-slate-50 p-2 font-mono text-[11px] leading-snug text-slate-900 focus:outline-2 focus:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60 ${fillHeight ? 'min-h-40 flex-1' : 'min-h-40'}`}
            placeholder="<div>...</div>"
          />
        </label>
      </div>
      <ScratchFullDocumentDialog
        open={fullDocOpen}
        title={`${title} — iframe 전체 문서`}
        documentHtml={fullDocument}
        onClose={() => setFullDocOpen(false)}
      />
    </>
  );
}
