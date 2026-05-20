import type { ScratchCompareResult } from '../lib/scratch-compare-types';
import { DiffifyLiveOverlay } from './DiffifyLiveOverlay';

export function ScratchCaptureOverlay({
  compareResult,
  showingSource,
}: {
  compareResult: ScratchCompareResult;
  showingSource: boolean;
}) {
  return (
    <div
      className="relative"
      style={{
        width: `${compareResult.sourceCapture.width}px`,
        height: `${compareResult.sourceCapture.height}px`,
      }}
    >
      <img
        src={compareResult.resultCapture.imageUrl}
        alt="result capture"
        className="block max-w-none"
      />
      <img
        src={compareResult.sourceCapture.imageUrl}
        alt="source capture"
        className="absolute top-0 left-0 block max-w-none"
        style={{ visibility: showingSource ? 'visible' : 'hidden' }}
      />
    </div>
  );
}

export function ScratchComparePreview({
  mode,
  compareResult,
  showingSource,
  overlayStackMode,
  sourceDoc,
  resultDoc,
  width,
  fallbackHeight,
  onLiveBoxMeasured,
}: {
  mode: 'overlay' | 'pixel-diff';
  compareResult: ScratchCompareResult | null;
  showingSource: boolean;
  overlayStackMode: 'live' | 'capture';
  sourceDoc: string;
  resultDoc: string;
  width: number;
  fallbackHeight: number;
  onLiveBoxMeasured?: (size: { width: number; height: number }) => void;
}) {
  if (mode === 'pixel-diff') {
    if (!compareResult) {
      return (
        <p className="rounded border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
          「새로 캡처」를 실행하면 픽셀 diff 리포트를 볼 수 있다.
        </p>
      );
    }
    return (
      <img
        src={compareResult.pixelDiff.imageUrl}
        alt="pixel diff"
        className="block max-w-none"
      />
    );
  }

  if (compareResult && overlayStackMode === 'capture') {
    return (
      <ScratchCaptureOverlay
        compareResult={compareResult}
        showingSource={showingSource}
      />
    );
  }

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
