import type { ChangeEvent } from 'react';
import { LAYOUT_BREAKPOINT_WIDTH_CHIPS } from '../lib/layout-breakpoints';

const PREVIEW_MAX_W = 4096;
const PREVIEW_MAX_H = 12000;

const TOOLBAR_CLASS =
  'flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-[#454545] bg-[#323232] px-3 py-1.5 font-sans text-[11px] leading-none text-[#ccc]';

const INPUT_CLASS =
  'w-[4.25rem] rounded-sm border border-[#5a5a5a] bg-[#1e1e1e] px-1.5 py-0.5 font-mono text-[11px] text-[#e8e8e8] tabular-nums focus:border-[#6eb3f7] focus:outline-none';

const SEPARATOR_CLASS = 'text-[#666]';

const TEXT_BTN_CLASS =
  'cursor-pointer text-[#999] transition hover:text-[#e8e8e8] disabled:cursor-not-allowed disabled:opacity-40';

const CHIP_CLASS = (active: boolean) =>
  [
    'cursor-pointer rounded-sm px-1 py-0.5 font-mono tabular-nums transition disabled:cursor-not-allowed disabled:opacity-40',
    active
      ? 'bg-[#454545] text-[#e8e8e8]'
      : 'text-[#999] hover:bg-[#3a3a3a] hover:text-[#ccc]',
  ].join(' ');

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

export type PreviewDeviceToolbarProps = {
  previewWidth: number;
  previewHeight: number;
  onPreviewWidthChange: (width: number) => void;
  onPreviewHeightChange: (height: number) => void;
  isPreviewSizeAtBaseline: boolean;
  onResetPreviewSize: () => void;
  previewMeasured: { width: number; height: number } | null;
  className?: string;
};

/** Chrome DevTools device toolbar — Preview 스테이지 상단 iframe 뷰포트 크기 */
export function PreviewDeviceToolbar({
  previewWidth,
  previewHeight,
  onPreviewWidthChange,
  onPreviewHeightChange,
  isPreviewSizeAtBaseline,
  onResetPreviewSize,
  previewMeasured,
  className,
}: PreviewDeviceToolbarProps) {
  return (
    <div
      className={`${TOOLBAR_CLASS} ${className ?? ''}`}
      role="toolbar"
      aria-label="iframe 뷰포트 크기"
    >
      <span className="text-[#999]">Dimensions</span>
      <label className="inline-flex items-center gap-1">
        <span className="sr-only">너비</span>
        <input
          type="number"
          min={1}
          max={PREVIEW_MAX_W}
          step={1}
          value={previewWidth}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onPreviewWidthChange(clampPreviewWidth(event.target.valueAsNumber));
          }}
          className={INPUT_CLASS}
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
          value={previewHeight}
          onChange={(event: ChangeEvent<HTMLInputElement>) => {
            onPreviewHeightChange(
              clampPreviewHeight(event.target.valueAsNumber),
            );
          }}
          className={INPUT_CLASS}
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
        className="mx-0.5 hidden h-3 w-px bg-[#555] sm:inline-block"
        aria-hidden
      />
      {LAYOUT_BREAKPOINT_WIDTH_CHIPS.map((chip) => (
        <button
          key={chip.label}
          type="button"
          onClick={() => onPreviewWidthChange(clampPreviewWidth(chip.width))}
          title={chip.title}
          className={CHIP_CLASS(previewWidth === chip.width)}
        >
          {chip.label}
        </button>
      ))}
      <span
        className="mx-0.5 hidden h-3 w-px bg-[#555] sm:inline-block"
        aria-hidden
      />
      <button
        type="button"
        disabled={previewMeasured === null}
        onClick={() => {
          if (!previewMeasured) return;
          onPreviewWidthChange(clampPreviewWidth(previewMeasured.width));
        }}
        title="iframe에서 실측한 콘텐츠 너비에 맞춘다. 높이는 유지한다."
        className={CHIP_CLASS(
          previewMeasured !== null && previewWidth === previewMeasured.width,
        )}
      >
        w-fit
      </button>
      <button
        type="button"
        disabled={previewMeasured === null}
        onClick={() => {
          if (!previewMeasured) return;
          onPreviewHeightChange(clampPreviewHeight(previewMeasured.height));
        }}
        title="iframe에서 실측한 콘텐츠 높이에 맞춘다. 너비는 유지한다."
        className={CHIP_CLASS(
          previewMeasured !== null && previewHeight === previewMeasured.height,
        )}
      >
        h-fit
      </button>
    </div>
  );
}
