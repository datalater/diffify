import { useCallback, useEffect, useRef, useState } from 'react';
import {
  exportScratchHtmlFile,
  pickScratchHtmlFile,
  readScratchHtmlFile,
  type ScratchHtmlLayer,
} from '../lib/scratch-html-io';
import {
  isScratchStateTooLongForUrl,
  MAX_URL_STATE_CHARS,
  type ScratchEditors,
  type ScratchPersistedContent,
} from '../lib/scratch-persist';
import {
  NavMenuChevron,
  NAV_MENU_TRIGGER_CLASS,
  ScratchNavPopover,
} from './ScratchNavPopover';

const SHARE_PANEL_CLASS = 'min-w-[11rem] px-1 py-1 font-sans';

const URL_COPY_DISABLED_TITLE = `인코딩된 URL의 ?state= 값이 최대 ${MAX_URL_STATE_CHARS.toLocaleString()}자를 넘어 공유할 수 없습니다. (브라우저 전체 URL 길이 한도가 아닌, gzip·base64로 인코딩한 state 파라미터 값 기준)`;

const MENU_ITEM_CLASS =
  'w-full cursor-pointer rounded px-3 py-1.5 text-left text-[12px] font-semibold text-slate-100 transition hover:bg-slate-700/80 disabled:cursor-not-allowed disabled:opacity-40';

const SUBMENU_ITEM_CLASS =
  'w-full cursor-pointer whitespace-nowrap rounded px-3 py-1.5 text-left text-[12px] text-slate-200 transition hover:bg-slate-700/80';

export function ScratchShareMenu({
  persistContent,
  editors,
  onCopyShareUrl,
  onImportLayer,
  onNotify,
}: {
  persistContent: ScratchPersistedContent;
  editors: ScratchEditors;
  onCopyShareUrl: () => void | Promise<void>;
  onImportLayer: (
    layer: ScratchHtmlLayer,
    parts: { head: string; bodyHtml: string },
  ) => void;
  onNotify: (message: string) => void;
}) {
  const [urlCopyDisabled, setUrlCopyDisabled] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void isScratchStateTooLongForUrl(persistContent).then((tooLong) => {
      if (!cancelled) setUrlCopyDisabled(tooLong);
    });
    return () => {
      cancelled = true;
    };
  }, [persistContent]);

  const layerParts = (layer: ScratchHtmlLayer) =>
    layer === 'source'
      ? { head: editors.sourceHead, html: editors.sourceHtml }
      : { head: editors.resultHead, html: editors.resultHtml };

  const handleExport = async (layer: ScratchHtmlLayer) => {
    const { head, html } = layerParts(layer);
    const result = await exportScratchHtmlFile(layer, head, html);
    if (result.ok) {
      onNotify(
        `${layer === 'source' ? 'Source' : 'Result'}를 ${result.fileName}으로 보냈다.`,
      );
      return;
    }
    if (result.reason === 'aborted') return;
    onNotify('파일보내기에 실패했다.');
  };

  const handleImport = async (layer: ScratchHtmlLayer) => {
    const file = await pickScratchHtmlFile();
    if (!file) return;
    if (!/\.html?$/i.test(file.name)) {
      onNotify('HTML(.html) 파일만 가져올 수 있다.');
      return;
    }
    const parts = await readScratchHtmlFile(file);
    if (!parts) {
      onNotify('HTML 파일을 읽지 못했다.');
      return;
    }
    onImportLayer(layer, parts);
    onNotify(
      `${layer === 'source' ? 'Source' : 'Result'}에 ${file.name}을 반영했다 (<head>·body 분리).`,
    );
  };

  return (
    <ScratchNavPopover
      panelClassName={SHARE_PANEL_CLASS}
      trigger={({ open, toggle, triggerId, panelId }) => (
        <button
          id={triggerId}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
          className={NAV_MENU_TRIGGER_CLASS}
          title="공유·가져오기·보내기"
        >
          공유
          <NavMenuChevron open={open} />
        </button>
      )}
    >
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          disabled={urlCopyDisabled}
          title={
            urlCopyDisabled
              ? URL_COPY_DISABLED_TITLE
              : '현재 입력을 ?state= URL로 클립보드에 복사'
          }
          onClick={() => void onCopyShareUrl()}
          className={MENU_ITEM_CLASS}
        >
          URL 복사
        </button>
        <ShareFlyoutMenu
          label="보내기"
          onSelect={(layer) => void handleExport(layer)}
        />
        <ShareFlyoutMenu
          label="가져오기"
          onSelect={(layer) => void handleImport(layer)}
        />
      </div>
    </ScratchNavPopover>
  );
}

function useHoverSubmenuEnabled(): boolean {
  const [enabled, setEnabled] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(hover: hover) and (pointer: fine)').matches
      : false,
  );

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const onChange = () => setEnabled(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return enabled;
}

const SUBMENU_CLOSE_DELAY_MS = 120;

function ShareFlyoutMenu({
  label,
  onSelect,
}: {
  label: string;
  onSelect: (layer: ScratchHtmlLayer) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
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
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

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
        className={`${MENU_ITEM_CLASS} flex items-center justify-between gap-3`}
      >
        {label}
        <span className="text-[10px] text-slate-500" aria-hidden>
          ▸
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute top-0 left-full z-[60] ml-0.5 min-w-[7rem] rounded border border-slate-600 bg-slate-800 py-1 pl-0.5 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className={SUBMENU_ITEM_CLASS}
            onClick={() => {
              onSelect('source');
              setOpen(false);
            }}
          >
            Source
          </button>
          <button
            type="button"
            role="menuitem"
            className={SUBMENU_ITEM_CLASS}
            onClick={() => {
              onSelect('result');
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
