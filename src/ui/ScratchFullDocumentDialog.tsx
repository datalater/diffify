import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function ScratchFullDocumentDialog({
  open,
  title,
  documentHtml,
  onClose,
}: {
  open: boolean;
  title: string;
  documentHtml: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/55 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scratch-full-doc-title"
        className="flex max-h-[min(90vh,48rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-600 bg-slate-800 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-600 px-4 py-3">
          <h3
            id="scratch-full-doc-title"
            className="font-sans text-sm font-semibold text-slate-100"
          >
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void navigator.clipboard.writeText(documentHtml)}
              className="cursor-pointer rounded border border-slate-500 bg-slate-700 px-2.5 py-1 text-[12px] font-semibold text-slate-100 hover:bg-slate-600"
            >
              복사
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded border border-slate-500 bg-slate-700 px-2.5 py-1 text-[12px] font-semibold text-slate-100 hover:bg-slate-600"
            >
              닫기
            </button>
          </div>
        </div>
        <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11px] leading-snug text-slate-200">
          <code>{documentHtml}</code>
        </pre>
      </div>
    </div>,
    document.body,
  );
}
