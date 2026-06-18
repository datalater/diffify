import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  exportScratchHtmlFailureReason,
  exportScratchHtmlFile,
  pickScratchHtmlFile,
  readScratchHtmlFile,
  type ScratchHtmlLayer,
} from "../lib/scratch-html-io";
import {
  isScratchStateTooLongForUrl,
  MAX_URL_STATE_CHARS,
  type ScratchEditors,
  type ScratchPersistedContent,
} from "../lib/scratch-persist";
import { NAV_MENU_TRIGGER_CLASS, ScratchNavPopover } from "./ScratchNavPopover";
import {
  NavShareIcon,
  NAV_MENU_ICON_TRIGGER_CLASS,
} from "./scratch-topbar-icons";
import { settleSubmenuInViewport } from "./popover-viewport";
import {
  NAV_MENU_ITEM_CLASS,
  NAV_SUBMENU_ITEM_CLASS,
  NAV_SUBMENU_PANEL_BASE_CLASS,
} from "./scratch-github-ui";

const SHARE_PANEL_CLASS = "min-w-[11rem] px-1 py-1 font-sans";

const URL_COPY_DISABLED_TITLE = `인코딩된 URL의 ?state= 값이 최대 ${MAX_URL_STATE_CHARS.toLocaleString()}자를 넘어 공유할 수 없습니다. (브라우저 전체 URL 길이 한도가 아닌, gzip·base64로 인코딩한 state 파라미터 값 기준)`;

const COPY_FEEDBACK_MS = 2000;

/** 복사 성공 피드백 체크 (✓) */
function CopyCheckIcon() {
  return (
    <svg
      className="size-3.5 shrink-0 text-emerald-400"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

/** 비활성 사유를 title 호버로 안내한다는 시각 신호 (ⓘ) */
function UrlCopyInfoIcon() {
  return (
    <svg
      className="size-3.5 shrink-0"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Zm0 1.2a5.3 5.3 0 1 1 0 10.6 5.3 5.3 0 0 1 0-10.6ZM7.25 7a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0V7ZM8 4.3a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" />
    </svg>
  );
}

export function ScratchShareMenu({
  persistContent,
  editors,
  onCopyShareUrl,
  onImportLayer,
  onNotify,
}: {
  persistContent: ScratchPersistedContent;
  editors: ScratchEditors;
  onCopyShareUrl: () => Promise<boolean>;
  onImportLayer: (
    layer: ScratchHtmlLayer,
    parts: { head: string; bodyHtml: string },
  ) => void;
  onNotify: (message: string) => void;
}) {
  const [urlCopyDisabled, setUrlCopyDisabled] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isScratchStateTooLongForUrl(persistContent).then((tooLong) => {
      if (!cancelled) setUrlCopyDisabled(tooLong);
    });
    return () => {
      cancelled = true;
    };
  }, [persistContent]);

  useEffect(() => {
    if (!urlCopied) return;
    const timer = window.setTimeout(() => setUrlCopied(false), COPY_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [urlCopied]);

  const handleCopyShareUrl = useCallback(async () => {
    const ok = await onCopyShareUrl();
    if (ok) setUrlCopied(true);
  }, [onCopyShareUrl]);

  const layerParts = (layer: ScratchHtmlLayer) =>
    layer === "source"
      ? { head: editors.sourceHead, html: editors.sourceHtml }
      : { head: editors.resultHead, html: editors.resultHtml };

  const handleExport = async (layer: ScratchHtmlLayer) => {
    const { head, html } = layerParts(layer);
    const result = await exportScratchHtmlFile(layer, head, html);
    if (result.ok) {
      onNotify(
        `${layer === "source" ? "Source" : "Result"}를 ${result.fileName}으로 보냈다.`,
      );
      return;
    }
    const failureReason = exportScratchHtmlFailureReason(result);
    if (failureReason === "aborted") return;
    onNotify("파일 내보내기에 실패했다.");
  };

  const handleImport = async (layer: ScratchHtmlLayer) => {
    const file = await pickScratchHtmlFile();
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      onNotify("HTML(.html) 파일만 가져올 수 있다.");
      return;
    }
    const parts = await readScratchHtmlFile(file);
    if (!parts) {
      onNotify("HTML 파일을 읽지 못했다.");
      return;
    }
    onImportLayer(layer, parts);
    onNotify(
      `${layer === "source" ? "Source" : "Result"}에 ${file.name}을 반영했다 (<head>·body 분리).`,
    );
  };

  return (
    <ScratchNavPopover
      align="end"
      panelClassName={SHARE_PANEL_CLASS}
      trigger={({ open, toggle, triggerId, panelId }) => (
        <button
          id={triggerId}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
          className={`${NAV_MENU_TRIGGER_CLASS} ${NAV_MENU_ICON_TRIGGER_CLASS}`}
          title="공유·가져오기·내보내기"
          aria-label="공유·가져오기·내보내기"
        >
          <NavShareIcon />
        </button>
      )}
    >
      <div className="flex flex-col gap-0.5">
        {/* disabled 버튼은 브라우저가 title 툴팁을 안 띄우므로, wrapper에 title을
            주고 버튼은 pointer-events-none 처리해 호버가 wrapper로 전달되게 한다. */}
        <span
          className={`block ${urlCopyDisabled ? "cursor-not-allowed" : ""}`}
          title={urlCopyDisabled ? URL_COPY_DISABLED_TITLE : undefined}
        >
          <button
            type="button"
            disabled={urlCopyDisabled}
            title={
              urlCopyDisabled
                ? undefined
                : "현재 입력을 ?state= URL로 클립보드에 복사"
            }
            onClick={() => void handleCopyShareUrl()}
            className={`${NAV_MENU_ITEM_CLASS} flex items-center justify-between gap-1.5 ${
              urlCopyDisabled ? "pointer-events-none" : ""
            }`}
          >
            <span aria-live="polite">
              {urlCopied ? "복사됨" : "URL 복사"}
            </span>
            {urlCopied ? (
              <CopyCheckIcon />
            ) : urlCopyDisabled ? (
              <UrlCopyInfoIcon />
            ) : null}
          </button>
        </span>
        <ShareFlyoutMenu
          label="내보내기"
          submenuExpand="start"
          onSelect={(layer) => void handleExport(layer)}
        />
        <ShareFlyoutMenu
          label="가져오기"
          submenuExpand="start"
          onSelect={(layer) => void handleImport(layer)}
        />
      </div>
    </ScratchNavPopover>
  );
}

function useHoverSubmenuEnabled(): boolean {
  const [enabled, setEnabled] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return enabled;
}

const SUBMENU_CLOSE_DELAY_MS = 120;

function ShareFlyoutMenu({
  label,
  onSelect,
  submenuExpand = "end",
}: {
  label: string;
  onSelect: (layer: ScratchHtmlLayer) => void;
  /** end = 오른쪽(left-full), start = 왼쪽(right-full) — 공유 패널은 start 권장 */
  submenuExpand?: "end" | "start";
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoverSubmenuEnabled = useHoverSubmenuEnabled();

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, SUBMENU_CLOSE_DELAY_MS);
  }, [clearCloseTimer]);

  const openSubmenu = useCallback(() => {
    clearCloseTimer();
    setOpen(true);
  }, [clearCloseTimer]);

  useEffect(() => {
    return () => clearCloseTimer();
  }, [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useLayoutEffect(() => {
    if (!open || !submenuRef.current) return;
    const submenu = submenuRef.current;
    settleSubmenuInViewport(
      submenu,
      NAV_SUBMENU_PANEL_BASE_CLASS,
      submenuExpand,
    );

    const onResize = () => {
      settleSubmenuInViewport(
        submenu,
        NAV_SUBMENU_PANEL_BASE_CLASS,
        submenuExpand,
      );
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [open, submenuExpand]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={() => {
        if (hoverSubmenuEnabled) openSubmenu();
      }}
      onMouseLeave={() => {
        if (hoverSubmenuEnabled) scheduleClose();
      }}
    >
      <button
        type="button"
        onClick={() => {
          if (hoverSubmenuEnabled) {
            openSubmenu();
            return;
          }
          setOpen((prev) => !prev);
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`${NAV_MENU_ITEM_CLASS} flex items-center justify-between gap-3`}
      >
        {label}
        <span className="text-[#8b949e]" aria-hidden>
          ▸
        </span>
      </button>
      {open ? (
        <div
          ref={submenuRef}
          role="menu"
          className={`${NAV_SUBMENU_PANEL_BASE_CLASS} top-0 left-full ml-0.5`}
        >
          <button
            type="button"
            role="menuitem"
            className={NAV_SUBMENU_ITEM_CLASS}
            onClick={() => {
              onSelect("source");
              setOpen(false);
            }}
          >
            Source
          </button>
          <button
            type="button"
            role="menuitem"
            className={NAV_SUBMENU_ITEM_CLASS}
            onClick={() => {
              onSelect("result");
              setOpen(false);
            }}
          >
            Result
          </button>
        </div>
      ) : null}
    </div>
  );
}
