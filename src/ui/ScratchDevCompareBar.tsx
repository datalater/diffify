import {
  GITHUB_BTN_CLASS,
  GITHUB_COMPARE_BAR_CLASS,
  GITHUB_COMPARE_CAPTURE_BTN_CLASS,
  GITHUB_COMPARE_METRICS_CLASS,
  GITHUB_COMPARE_SEGMENT_CLASS,
  GITHUB_COMPARE_SELECT_CLASS,
  GITHUB_COMPARE_SELECT_WRAP_CLASS,
} from './scratch-github-ui';
import type {
  ScratchCompareFeatureMode,
  ScratchOverlayStackMode,
} from '../lib/scratch-compare-types';

function SelectChevron() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-[#8b949e]"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
    </svg>
  );
}

export function ScratchDevCompareBar({
  disabled,
  isComparing,
  isLoadingLatest,
  featureMode,
  overlayStackMode,
  diffMetricsText,
  hasCompareResult,
  onCompare,
  onFeatureModeChange,
  onOverlayStackModeChange,
  onInstallBrowsers,
  isInstallingBrowsers,
  showInstallBrowsers,
}: {
  disabled?: boolean;
  isComparing: boolean;
  isLoadingLatest: boolean;
  hasCompareResult: boolean;
  featureMode: ScratchCompareFeatureMode;
  overlayStackMode: ScratchOverlayStackMode;
  diffMetricsText: string | null;
  onCompare: () => void;
  onFeatureModeChange: (mode: ScratchCompareFeatureMode) => void;
  onOverlayStackModeChange: (mode: ScratchOverlayStackMode) => void;
  onInstallBrowsers?: () => void;
  isInstallingBrowsers?: boolean;
  showInstallBrowsers?: boolean;
}) {
  return (
    <div
      className={GITHUB_COMPARE_BAR_CLASS}
      role="group"
      aria-label="픽셀 캡처 (로컬 dev)"
    >
      <button
        type="button"
        className={GITHUB_COMPARE_CAPTURE_BTN_CLASS}
        disabled={disabled || isComparing || isLoadingLatest}
        title="Playwright로 source/result·diff PNG를 .diffify에 저장한다 (npm run dev 전용)."
        onClick={onCompare}
      >
        {isComparing
          ? '캡처 중…'
          : isLoadingLatest
            ? '불러오는 중…'
            : '새로 캡처'}
      </button>

      <div className={GITHUB_COMPARE_SELECT_WRAP_CLASS}>
        <label className="sr-only" htmlFor="scratch-compare-mode">
          비교 모드
        </label>
        <select
          id="scratch-compare-mode"
          className={GITHUB_COMPARE_SELECT_CLASS}
          value={featureMode}
          disabled={disabled}
          onChange={(e) =>
            onFeatureModeChange(e.target.value as ScratchCompareFeatureMode)
          }
        >
          <option value="overlay" className="bg-[#161b22]">
            오버레이
          </option>
          <option value="pixel-diff" className="bg-[#161b22]">
            픽셀 diff
          </option>
        </select>
        <SelectChevron />
      </div>

      {hasCompareResult && featureMode === 'overlay' ? (
        <label
          className={`${GITHUB_COMPARE_SEGMENT_CLASS} h-full cursor-pointer gap-1.5 text-[11px] text-[#e6edf3]`}
        >
          <input
            type="checkbox"
            checked={overlayStackMode === 'live'}
            disabled={disabled}
            className="size-3.5 shrink-0 accent-[#388bfd]"
            onChange={(e) =>
              onOverlayStackModeChange(e.target.checked ? 'live' : 'capture')
            }
          />
          라이브
        </label>
      ) : null}

      <span
        className={`${GITHUB_COMPARE_METRICS_CLASS} h-full`}
        title={
          diffMetricsText
            ? '마지막 캡처 픽셀 diff 요약'
            : '캡처 후 diff %·px가 표시된다'
        }
      >
        {diffMetricsText ?? '—'}
      </span>

      {showInstallBrowsers && onInstallBrowsers ? (
        <button
          type="button"
          className={`${GITHUB_BTN_CLASS} h-full shrink-0 border-l border-[#30363d] text-[#d29922]`}
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
