import { useCallback, useEffect, useState } from 'react';
import {
  clearAllScratchWorkspaceStorage,
  fetchScratchWorkspaceStorageInfo,
  formatWorkspaceStorageBytes,
  type ScratchWorkspaceStorageInfo,
} from '../lib/scratch-workspace-storage';
import { NavMenuChevron, ScratchNavPopover } from './ScratchNavPopover';
import { NAV_MENU_TRIGGER_CLASS } from './scratch-github-ui';

const PANEL_CLASS = 'min-w-[18rem] max-w-[22rem] px-0 py-0 font-sans';

const ACTION_BTN_CLASS =
  'w-full cursor-pointer rounded-sm px-3 py-1.5 text-left text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50';

const REFRESH_BTN_CLASS = `${ACTION_BTN_CLASS} text-[#e6edf3] hover:bg-[#30363d]`;
const CLEAR_BTN_CLASS = `${ACTION_BTN_CLASS} text-[#f85149] hover:bg-[#f8514926]`;

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-[#8b949e]">{label}</span>
      <span className="tabular-nums text-[#e6edf3]">{value}</span>
    </div>
  );
}

function ScratchLocalStoragePanel({
  disabled,
  onNotify,
  onCleared,
}: {
  disabled?: boolean;
  onNotify: (message: string) => void;
  onCleared: () => void | Promise<void>;
}) {
  const [info, setInfo] = useState<ScratchWorkspaceStorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setInfo(await fetchScratchWorkspaceStorageInfo());
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장소 집계 실패');
      setInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const handleClear = async () => {
    if (
      !window.confirm(
        '이 브라우저의 scratch 데이터를 전부 삭제한다.\n(프로젝트·draft·확정 버전)\n되돌릴 수 없다. 계속할까?',
      )
    ) {
      return;
    }
    try {
      setIsClearing(true);
      await clearAllScratchWorkspaceStorage();
      await onCleared();
      await refresh();
      onNotify('로컬 저장소를 비웠다.');
    } catch (err) {
      onNotify(
        err instanceof Error ? err.message : '로컬 저장소 비우기에 실패했다.',
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="px-3 py-3">
      <div className="mb-3 border-b border-[#30363d] pb-3">
        <p className="text-xs font-semibold text-[#e6edf3]">로컬 저장소</p>
        <p className="mt-0.5 text-[11px] leading-snug text-[#8b949e]">
          브라우저 · draft·버전·프로젝트
        </p>
      </div>

      {loading ? (
        <p className="text-xs text-[#8b949e]">집계 중…</p>
      ) : error ? (
        <p className="text-xs text-[#f85149]">{error}</p>
      ) : info ? (
        <div className="space-y-1.5">
          <StatRow label="프로젝트" value={`${info.projectCount}개`} />
          <StatRow label="확정 버전" value={`${info.versionEntryCount}개`} />
          <StatRow
            label="draft"
            value={
              info.activeHasDraft
                ? `있음${info.activeProjectName ? ` · ${info.activeProjectName}` : ''}`
                : '없음'
            }
          />
          <div className="my-2 border-t border-[#30363d]" />
          <StatRow
            label="localStorage"
            value={`${formatWorkspaceStorageBytes(info.localStorageBytes)} · ${info.localStorageKeyCount}키`}
          />
          <StatRow
            label="IndexedDB"
            value={`${info.indexedDbBlobCount} blobs`}
          />
        </div>
      ) : null}

      <div className="mt-3 space-y-1 border-t border-[#30363d] pt-3">
        <button
          type="button"
          disabled={disabled || loading || isClearing}
          className={REFRESH_BTN_CLASS}
          onClick={() => void refresh()}
        >
          {loading ? '집계 중…' : '집계 새로고침'}
        </button>
        <button
          type="button"
          disabled={disabled || loading || isClearing}
          className={CLEAR_BTN_CLASS}
          onClick={() => void handleClear()}
        >
          {isClearing ? '삭제 중…' : '로컬 저장소 비우기'}
        </button>
      </div>
    </div>
  );
}

export function ScratchLocalStorageMenu({
  disabled,
  onNotify,
  onCleared,
}: {
  disabled?: boolean;
  onNotify: (message: string) => void;
  onCleared: () => void | Promise<void>;
}) {
  return (
    <ScratchNavPopover
      align="end"
      panelClassName={PANEL_CLASS}
      trigger={({ open, toggle, triggerId, panelId }) => (
        <button
          id={triggerId}
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
          className={NAV_MENU_TRIGGER_CLASS}
          title="브라우저에 저장된 프로젝트·draft·버전"
        >
          로컬 저장소
          <NavMenuChevron open={open} />
        </button>
      )}
    >
      <ScratchLocalStoragePanel
        disabled={disabled}
        onNotify={onNotify}
        onCleared={onCleared}
      />
    </ScratchNavPopover>
  );
}
