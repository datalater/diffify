import { useCallback, useEffect, useState, type SyntheticEvent } from 'react';
import {
  measureIframeContentSize,
  type IframeContentSize,
} from '../lib/measure-iframe-content';
import { ArtboardMatEmpty, ArtboardMatFrame } from './ArtboardMatFrame';

export function DiffifyLiveOverlay({
  sourceDoc,
  resultDoc,
  width,
  fallbackHeight,
  showingSource,
  onLiveBoxMeasured,
}: {
  sourceDoc: string;
  resultDoc: string;
  width: number;
  fallbackHeight: number;
  showingSource: boolean;
  onLiveBoxMeasured?: (size: { width: number; height: number }) => void;
}) {
  const [sizeSource, setSizeSource] = useState<IframeContentSize | null>(null);
  const [sizeResult, setSizeResult] = useState<IframeContentSize | null>(null);

  useEffect(() => {
    setSizeSource(null);
    setSizeResult(null);
  }, [sourceDoc, resultDoc, width, fallbackHeight]);

  const scheduleMeasure = useCallback(
    (which: 'source' | 'result') => (frame: HTMLIFrameElement) => {
      const setSize = which === 'source' ? setSizeSource : setSizeResult;
      const run = async () => {
        setSize(await measureIframeContentSize(frame));
      };
      void run();
      window.setTimeout(() => void run(), 150);
      window.setTimeout(() => void run(), 500);
    },
    [],
  );

  const onSourceLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      scheduleMeasure('source')(event.currentTarget);
    },
    [scheduleMeasure],
  );

  const onResultLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      scheduleMeasure('result')(event.currentTarget);
    },
    [scheduleMeasure],
  );

  const canShowResult = Boolean(resultDoc.trim());
  const canShowSource = Boolean(sourceDoc.trim());
  const showSourceLayer = canShowSource && (showingSource || !canShowResult);
  const showResultLayer = canShowResult && (!showingSource || !canShowSource);

  const hSource = sizeSource?.height ?? null;
  const hResult = sizeResult?.height ?? null;
  const hasMeasure = hSource !== null || hResult !== null;
  const rawMax = Math.max(hSource ?? 0, hResult ?? 0, 80);
  const viewportCap = Math.max(fallbackHeight, 80);
  const boxHeight = hasMeasure ? Math.min(rawMax, viewportCap) : fallbackHeight;

  const visibleLayerSize =
    showSourceLayer && sizeSource
      ? sizeSource
      : showResultLayer && sizeResult
        ? sizeResult
        : null;

  useEffect(() => {
    onLiveBoxMeasured?.({
      width: visibleLayerSize?.width ?? width,
      height: boxHeight,
    });
  }, [visibleLayerSize, width, boxHeight, onLiveBoxMeasured]);

  if (!canShowSource && !canShowResult) {
    return (
      <ArtboardMatEmpty>
        <span>Source·Result HTML을 입력한다.</span>
      </ArtboardMatEmpty>
    );
  }

  return (
    <ArtboardMatFrame width={width} height={boxHeight}>
      <div className="relative size-full">
      {canShowResult ? (
        <iframe
          title="diffify-result"
          srcDoc={resultDoc}
          onLoad={onResultLoad}
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{
            width: `${width}px`,
            height: `${boxHeight}px`,
            border: 0,
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 0,
            visibility: showResultLayer ? 'visible' : 'hidden',
            pointerEvents: showResultLayer ? 'auto' : 'none',
          }}
          className="block"
        />
      ) : null}
      {canShowSource ? (
        <iframe
          title="diffify-source"
          srcDoc={sourceDoc}
          onLoad={onSourceLoad}
          sandbox="allow-scripts allow-same-origin allow-forms"
          style={{
            width: `${width}px`,
            height: `${boxHeight}px`,
            border: 0,
            position: 'absolute',
            left: 0,
            top: 0,
            zIndex: 1,
            visibility: showSourceLayer ? 'visible' : 'hidden',
            pointerEvents: showSourceLayer ? 'auto' : 'none',
          }}
          className="block"
        />
      ) : null}
      </div>
    </ArtboardMatFrame>
  );
}
