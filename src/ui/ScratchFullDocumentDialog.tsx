import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ScratchCodeEditor } from "../editor/scratch-code-editor";
import { SCRATCH_ACTION_BTN_CLASS } from "./ScratchEditorColumn";

/** 읽기 전용 CM — 스크롤·선택 가능, 기본 light 테마 */
const FULL_DOC_EDITOR_CLASS =
  "h-full min-h-0 flex-1 resize-none [&_.cm-editor]:!opacity-100";

const COPY_FEEDBACK_MS = 2000;

function CopyCheckIcon() {
  return (
    <svg
      className="size-3.5 shrink-0 text-emerald-600"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

export function ScratchFullDocumentDialog({
  open,
  title,
  documentHtml,
  onClose,
  onApply,
}: {
  open: boolean;
  title: string;
  documentHtml: string;
  onClose: () => void;
  /** 있으면 헤더에 "적용" 버튼을 노출한다 (예시 모달 전용). */
  onApply?: () => void;
}) {
  // 열릴 때만 본문을 마운트한다. 닫으면 언마운트되어 "복사됨" 등 내부 상태가
  // 자연히 초기화되므로, 별도의 리셋 effect가 필요 없다.
  if (!open) return null;
  return (
    <FullDocumentDialogBody
      title={title}
      documentHtml={documentHtml}
      onClose={onClose}
      onApply={onApply}
    />
  );
}

function FullDocumentDialogBody({
  title,
  documentHtml,
  onClose,
  onApply,
}: {
  title: string;
  documentHtml: string;
  onClose: () => void;
  onApply?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(documentHtml);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }, [documentHtml]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="scratch-full-doc-title"
        className="flex max-h-[min(90vh,48rem)] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white font-sans shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
          <h3
            id="scratch-full-doc-title"
            className="text-sm font-semibold text-slate-800"
          >
            {title}
          </h3>
          <div className="flex items-center gap-2">
            {onApply ? (
              <button
                type="button"
                onClick={onApply}
                className={`${SCRATCH_ACTION_BTN_CLASS} border-sky-300! bg-sky-50! text-sky-700! hover:bg-sky-100!`}
                title="이 예시를 에디터에 적용"
              >
                덮어쓰기
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={`${SCRATCH_ACTION_BTN_CLASS} inline-flex items-center gap-1`}
              title={
                copied ? "클립보드에 복사됨" : "전체 HTML을 클립보드에 복사"
              }
              aria-label={copied ? "복사됨" : "복사"}
            >
              {copied ? <CopyCheckIcon /> : null}
              <span aria-live="polite">{copied ? "복사됨" : "복사"}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={SCRATCH_ACTION_BTN_CLASS}
            >
              닫기
            </button>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50 p-4">
          <ScratchCodeEditor
            value={documentHtml}
            onChange={() => {}}
            language="html"
            readOnly
            fillHeight
            className={FULL_DOC_EDITOR_CLASS}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
