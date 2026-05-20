import { useMemo, useState, type ReactNode, type RefObject } from 'react';
import { captureDisplaySize } from '../lib/scratch-compare-api';
import type {
  ScratchCaptureViewMode,
  ScratchCompareResult,
  ScratchPreviewSubstrate,
} from '../lib/scratch-compare-types';
import {
  ARTBOARD_MAT_VERTICAL_PAD_PX,
  ArtboardMatShell,
} from './ArtboardMatFrame';
import type { PreviewLiveMeasured } from '../lib/measure-iframe-content';
import { DiffifyLiveOverlay } from './DiffifyLiveOverlay';
import { useElementOuterHeight } from './use-element-outer-height';

const CAPTURE_EMPTY_MIN_WIDTH = 320;

const CAPTURE_EMPTY_INNER_CLASS =
  'grid min-h-80 place-items-center p-8 text-center text-sm text-slate-600';

function captureStageContentWidth(
  compareResult: ScratchCompareResult | null,
  previewWidth: number,
): number {
  if (compareResult) {
    return captureDisplaySize(compareResult).width;
  }
  return Math.max(previewWidth, CAPTURE_EMPTY_MIN_WIDTH);
}

function CapturePreviewEmpty({
  contentWidth,
  children,
}: {
  contentWidth: number;
  children: ReactNode;
}) {
  return (
    <ArtboardMatShell
      innerClassName={CAPTURE_EMPTY_INNER_CLASS}
      innerStyle={{ width: `${contentWidth}px` }}
    >
      <p className="max-w-md rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-6">
        {children}
      </p>
    </ArtboardMatShell>
  );
}

/** 활성 모드만 in-flow — 부모 width/height 확정 (absolute-only collapse 방지) */
function CaptureViewPane({
  active,
  children,
}: {
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={
        active
          ? 'relative max-w-full'
          : 'pointer-events-none absolute top-0 left-0 max-w-full invisible'
      }
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

function PreviewStackLayer({
  active,
  measureRef,
  children,
}: {
  active: boolean;
  measureRef?: RefObject<HTMLDivElement | null>;
  children: ReactNode;
}) {
  return (
    <div
      ref={measureRef}
      className={`absolute top-0 left-0 max-w-full ${active ? 'z-10' : 'z-0'}`}
      style={{
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
      }}
      aria-hidden={!active}
    >
      {children}
    </div>
  );
}

export function ScratchCaptureOverlay({
  compareResult,
  showingSource,
  contentWidth,
}: {
  compareResult: ScratchCompareResult;
  showingSource: boolean;
  contentWidth: number;
}) {
  return (
    <ArtboardMatShell
      innerClassName="relative"
      innerStyle={{ width: `${contentWidth}px` }}
    >
      <img
        src={compareResult.resultCapture.imageUrl}
        alt="result capture"
        className="block h-auto w-full"
      />
      <img
        src={compareResult.sourceCapture.imageUrl}
        alt="source capture"
        className="absolute top-0 left-0 block h-auto w-full"
        style={{ visibility: showingSource ? 'visible' : 'hidden' }}
      />
    </ArtboardMatShell>
  );
}

function ScratchCapturePixelDiff({
  compareResult,
  contentWidth,
}: {
  compareResult: ScratchCompareResult;
  contentWidth: number;
}) {
  return (
    <ArtboardMatShell innerStyle={{ width: `${contentWidth}px` }}>
      <img
        src={compareResult.pixelDiff.imageUrl}
        alt="pixel diff"
        className="block h-auto w-full"
      />
      {compareResult.deviceScaleFactor &&
      compareResult.deviceScaleFactor > 1 ? (
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          DPR {compareResult.deviceScaleFactor}
        </p>
      ) : null}
    </ArtboardMatShell>
  );
}

/** 겹쳐보기·픽셀 diff 동시 유지 — 활성 pane만 in-flow로 width/height 확정 */
function ScratchCaptureStage({
  captureViewMode,
  compareResult,
  showingSource,
  previewWidth,
  onStageOuterHeight,
}: {
  captureViewMode: ScratchCaptureViewMode;
  compareResult: ScratchCompareResult | null;
  showingSource: boolean;
  previewWidth: number;
  onStageOuterHeight: (height: number) => void;
}) {
  const contentWidth = captureStageContentWidth(compareResult, previewWidth);
  const stageMeasureRef = useElementOuterHeight(onStageOuterHeight);

  const overlayActive = captureViewMode === 'overlay';
  const diffActive = captureViewMode === 'pixel-diff';

  return (
    <div ref={stageMeasureRef} className="inline-block max-w-full">
      <CaptureViewPane active={overlayActive}>
        {!compareResult ? (
          <CapturePreviewEmpty contentWidth={contentWidth}>
            아직 캡처가 없다. 「새로 캡처」로 Playwright 스냅샷을 만든다.
          </CapturePreviewEmpty>
        ) : (
          <ScratchCaptureOverlay
            compareResult={compareResult}
            showingSource={showingSource}
            contentWidth={contentWidth}
          />
        )}
      </CaptureViewPane>

      <CaptureViewPane active={diffActive}>
        {!compareResult ? (
          <CapturePreviewEmpty contentWidth={contentWidth}>
            「새로 캡처」를 실행하면 픽셀 diff 리포트를 볼 수 있다.
          </CapturePreviewEmpty>
        ) : (
          <ScratchCapturePixelDiff
            compareResult={compareResult}
            contentWidth={contentWidth}
          />
        )}
      </CaptureViewPane>
    </div>
  );
}

export function ScratchComparePreview({
  substrate,
  captureViewMode,
  compareResult,
  showingSource,
  sourceDoc,
  resultDoc,
  width,
  fallbackHeight,
  dualSubstrate,
  onLiveBoxMeasured,
}: {
  substrate: ScratchPreviewSubstrate;
  captureViewMode: ScratchCaptureViewMode;
  compareResult: ScratchCompareResult | null;
  showingSource: boolean;
  sourceDoc: string;
  resultDoc: string;
  width: number;
  fallbackHeight: number;
  dualSubstrate?: boolean;
  onLiveBoxMeasured?: (size: PreviewLiveMeasured) => void;
}) {
  if (!dualSubstrate) {
    return (
      <DiffifyLiveOverlay
        sourceDoc={sourceDoc}
        resultDoc={resultDoc}
        width={width}
        fallbackHeight={fallbackHeight}
        showingSource={showingSource}
        onLiveBoxMeasured={onLiveBoxMeasured}
      />
    );
  }

  const codeFallbackOuter =
    ARTBOARD_MAT_VERTICAL_PAD_PX + Math.max(fallbackHeight, 80);

  const [codeOuterHeight, setCodeOuterHeight] = useState(codeFallbackOuter);
  const [captureOuterHeight, setCaptureOuterHeight] = useState(
    320 + ARTBOARD_MAT_VERTICAL_PAD_PX,
  );

  const codeMeasureRef = useElementOuterHeight(setCodeOuterHeight);

  const stageHeight = useMemo(
    () => (substrate === 'code' ? codeOuterHeight : captureOuterHeight),
    [substrate, codeOuterHeight, captureOuterHeight],
  );

  const reportLiveMeasure = substrate === 'code' ? onLiveBoxMeasured : undefined;

  return (
    <div
      className="relative inline-block max-w-full"
      style={{ height: `${stageHeight}px` }}
    >
      <PreviewStackLayer
        active={substrate === 'code'}
        measureRef={codeMeasureRef}
      >
        <DiffifyLiveOverlay
          sourceDoc={sourceDoc}
          resultDoc={resultDoc}
          width={width}
          fallbackHeight={fallbackHeight}
          showingSource={showingSource}
          onLiveBoxMeasured={reportLiveMeasure}
        />
      </PreviewStackLayer>

      <PreviewStackLayer active={substrate === 'capture'}>
        <ScratchCaptureStage
          captureViewMode={captureViewMode}
          compareResult={compareResult}
          showingSource={showingSource}
          previewWidth={width}
          onStageOuterHeight={setCaptureOuterHeight}
        />
      </PreviewStackLayer>
    </div>
  );
}
