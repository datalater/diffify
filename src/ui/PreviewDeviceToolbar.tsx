import type { ChangeEvent } from "react";
import type {
  PreviewLiveMeasured,
  PreviewScrollInfo,
  PreviewScrollState,
} from "../lib/measure-iframe-content";
import { LAYOUT_BREAKPOINT_WIDTH_CHIPS } from "../lib/layout-breakpoints";
import type {
  PreviewHeightMode,
  PreviewWidthMode,
} from "../lib/preview-size-mode";
import { isBreakpointWidth } from "../lib/preview-size-mode";

const PREVIEW_MAX_W = 4096;
const PREVIEW_MAX_H = 12000;

const TOOLBAR_CLASS =
  "flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-slate-300 bg-slate-50 px-3 py-1.5 font-sans text-[11px] leading-none text-slate-700";

const INPUT_CLASS =
  "w-[4.25rem] rounded-sm border border-slate-300 bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-800 tabular-nums focus:border-sky-500 focus:outline-none";

const SEPARATOR_CLASS = "text-slate-400";

const TEXT_BTN_CLASS =
  "cursor-pointer text-slate-500 transition hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40";

const CHIP_CLASS = (active: boolean) =>
  [
    "cursor-pointer rounded-sm px-1 py-0.5 font-mono tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40",
    active
      ? "bg-slate-200 text-slate-900"
      : "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
  ].join(" ");

function clampPreviewWidth(n: number): number {
  const r = Math.round(n);
  if (!Number.isFinite(r) || r < 1) return 1;
  return Math.min(PREVIEW_MAX_W, r);
}

function clampPreviewHeight(n: number): number {
  const r = Math.round(n);
  if (!Number.isFinite(r) || r < 1) return 1;
  return Math.min(PREVIEW_MAX_H, r);
}

function formatScroll(info: PreviewScrollInfo | null): string {
  if (!info) return "—";
  const pct = info.max > 0 ? Math.round((info.y / info.max) * 100) : 0;
  return `${info.y}px (${pct}%)`;
}

export type PreviewDeviceToolbarProps = {
  previewWidth: number;
  previewHeight: number;
  widthMode: PreviewWidthMode;
  heightMode: PreviewHeightMode;
  onSelectBreakpointWidth: (width: number) => void;
  onSelectWidthFit: () => void;
  onSelectHeightFit: () => void;
  onPreviewWidthCustom: (width: number) => void;
  onPreviewHeightCap: (height: number) => void;
  isPreviewSizeAtBaseline: boolean;
  onResetPreviewSize: () => void;
  previewMeasured: PreviewLiveMeasured | null;
  previewScroll: PreviewScrollState | null;
  showingSource: boolean;
  syncScroll: boolean;
  onToggleSyncScroll: () => void;
  className?: string;
};

/** Preview 스테이지 상단 — breakpoint·w-fit/h-fit 은 라디오 그룹 */
export function PreviewDeviceToolbar({
  previewWidth,
  previewHeight,
  widthMode,
  heightMode,
  onSelectBreakpointWidth,
  onSelectWidthFit,
  onSelectHeightFit,
  onPreviewWidthCustom,
  onPreviewHeightCap,
  isPreviewSizeAtBaseline,
  onResetPreviewSize,
  previewMeasured,
  previewScroll,
  showingSource,
  syncScroll,
  onToggleSyncScroll,
  className,
}: PreviewDeviceToolbarProps) {
  const displayWidth = previewMeasured?.iframeWidth ?? previewWidth;
  const displayHeight = previewMeasured?.iframeHeight ?? previewHeight;
  const canWidthFit =
    previewMeasured !== null && previewMeasured.contentWidth > 1;
  const canHeightFit =
    previewMeasured !== null && previewMeasured.contentHeight > 0;

  return (
    <div
      className={`${TOOLBAR_CLASS} ${className ?? ""}`}
      role="toolbar"
      aria-label="iframe 뷰포트 크기"
    >
      <span className="text-slate-500">Dimensions</span>
      <label className="inline-flex items-center gap-1">
        <span className="sr-only">너비</span>
        <input
          type="number"
          min={1}
          max={PREVIEW_MAX_W}
          step={1}
          value={displayWidth}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            const width = clampPreviewWidth(event.target.valueAsNumber);
            if (isBreakpointWidth(width)) {
              onSelectBreakpointWidth(width);
            } else {
              onPreviewWidthCustom(width);
            }
          }}
          className={INPUT_CLASS}
          title="iframe 뷰포트 너비"
        />
      </label>
      <span className={SEPARATOR_CLASS} aria-hidden>
        ×
      </span>
      <label className="inline-flex items-center gap-1">
        <span className="sr-only">높이</span>
        <input
          type="number"
          min={1}
          max={PREVIEW_MAX_H}
          step={1}
          value={displayHeight}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onPreviewHeightCap(clampPreviewHeight(event.target.valueAsNumber));
          }}
          className={INPUT_CLASS}
          title={
            heightMode.kind === "fit"
              ? "콘텐츠에 맞춘 높이 (수동 입력 시 cap 모드)"
              : previewMeasured && displayHeight < previewHeight
                ? `iframe 높이 (최대 ${previewHeight})`
                : "iframe 뷰포트 높이"
          }
        />
      </label>
      <button
        type="button"
        onClick={onResetPreviewSize}
        disabled={isPreviewSizeAtBaseline}
        className={TEXT_BTN_CLASS}
        title="불러온 값(또는 기본 768×900)으로 되돌린다."
      >
        Reset
      </button>
      <span
        className="mx-0.5 hidden h-3 w-px bg-slate-300 sm:inline-block"
        aria-hidden
      />
      {LAYOUT_BREAKPOINT_WIDTH_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onSelectBreakpointWidth(chip.width)}
          title={chip.title}
          className={CHIP_CLASS(
            widthMode.kind === "breakpoint" && widthMode.width === chip.width,
          )}
        >
          {chip.label}
        </button>
      ))}
      <span
        className="mx-0.5 hidden h-3 w-px bg-slate-300 sm:inline-block"
        aria-hidden
      />
      <button
        type="button"
        disabled={!canWidthFit}
        onClick={onSelectWidthFit}
        title="보이는 레이어 콘텐츠 실측 너비에 맞춘다 (breakpoint 칩과 배타)."
        className={CHIP_CLASS(widthMode.kind === "fit")}
      >
        w-fit
      </button>
      <button
        type="button"
        disabled={!canHeightFit}
        onClick={onSelectHeightFit}
        title="보이는 레이어 콘텐츠 실측 높이에 맞춘다 (cap 모드와 배타)."
        className={CHIP_CLASS(heightMode.kind === "fit")}
      >
        h-fit
      </button>
      <span
        className="mx-0.5 hidden h-3 w-px bg-slate-300 sm:inline-block"
        aria-hidden
      />
      {/* sync scroll 토글 + 위치 표시는 한 기능이므로 함께 줄바꿈되도록 묶는다 */}
      <span className="inline-flex items-center gap-2 whitespace-nowrap">
        <button
          type="button"
          onClick={onToggleSyncScroll}
          title="전환 시 source↔result 스크롤 위치를 공유한다."
          className={CHIP_CLASS(syncScroll)}
        >
          sync scroll
        </button>
        <span
          className="font-mono tabular-nums"
          title="source·result 세로 스크롤 위치 (전체 대비 %) — 보고 있는 쪽이 진하게 표시된다."
        >
          <span className={showingSource ? "text-slate-900" : "text-slate-400"}>
            source {formatScroll(previewScroll?.source ?? null)}
          </span>
          <span className="mx-1 text-slate-300" aria-hidden>
            ·
          </span>
          <span
            className={!showingSource ? "text-slate-900" : "text-slate-400"}
          >
            result {formatScroll(previewScroll?.result ?? null)}
          </span>
        </span>
      </span>
    </div>
  );
}
