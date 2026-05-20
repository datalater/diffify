import type { ScratchCaptureViewMode } from '../lib/scratch-compare-types';
import { ScratchCaptureViewModeSwitch } from './ScratchCaptureViewModeSwitch';
import {
  SCRATCH_DIFF_METRICS_BADGE_CLASS,
  SCRATCH_TOOLBAR_BTN_GHOST_CLASS,
  SCRATCH_TOOLBAR_BTN_PRIMARY_CLASS,
} from './scratch-preview-ui';

/** 캡처 preview 2행 — Chromatic/Storybook식 툴바 */
export function ScratchDevCompareBar({
  disabled,
  isComparing,
  isLoadingLatest,
  captureViewMode,
  diffMetricsText,
  onCompare,
  onCaptureViewModeChange,
  onInstallBrowsers,
  isInstallingBrowsers,
  showInstallBrowsers,
}: {
  disabled?: boolean;
  isComparing: boolean;
  isLoadingLatest: boolean;
  captureViewMode: ScratchCaptureViewMode;
  diffMetricsText: string | null;
  onCompare: () => void;
  onCaptureViewModeChange: (mode: ScratchCaptureViewMode) => void;
  onInstallBrowsers?: () => void;
  isInstallingBrowsers?: boolean;
  showInstallBrowsers?: boolean;
}) {
  const busy = disabled || isComparing || isLoadingLatest;

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-2"
      role="group"
      aria-label="캡처 도구"
    >
      <ScratchCaptureViewModeSwitch
        value={captureViewMode}
        disabled={disabled}
        onChange={onCaptureViewModeChange}
      />

      <button
        type="button"
        className={SCRATCH_TOOLBAR_BTN_PRIMARY_CLASS}
        disabled={busy}
        title="Playwright로 source/result·diff PNG를 .diffify에 저장한다."
        onClick={onCompare}
      >
        {isComparing
          ? '캡처 중…'
          : isLoadingLatest
            ? '불러오는 중…'
            : '새로 캡처'}
      </button>

      {diffMetricsText ? (
        <span
          className={`${SCRATCH_DIFF_METRICS_BADGE_CLASS} ml-auto`}
          title="마지막 캡처 픽셀 diff 요약"
        >
          {diffMetricsText}
        </span>
      ) : null}

      {showInstallBrowsers && onInstallBrowsers ? (
        <button
          type="button"
          className={`${SCRATCH_TOOLBAR_BTN_GHOST_CLASS} ${diffMetricsText ? '' : 'ml-auto'}`}
          disabled={disabled || isInstallingBrowsers}
          title="npm exec playwright install chromium"
          onClick={onInstallBrowsers}
        >
          {isInstallingBrowsers ? '설치 중…' : 'Chromium 설치'}
        </button>
      ) : null}
    </div>
  );
}
