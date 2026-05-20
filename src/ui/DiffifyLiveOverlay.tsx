import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import {
  measureIframeContentSize,
  type IframeContentSize,
  type PreviewLiveMeasured,
} from '../lib/measure-iframe-content';
import { ArtboardMatEmpty, ArtboardMatFrame } from './ArtboardMatFrame';

const MEASURE_RETRY_MS = [150, 500] as const;

function measureWithRetries(
  frame: HTMLIFrameElement,
  setSize: (size: IframeContentSize) => void,
): () => void {
  const run = async () => {
    setSize(await measureIframeContentSize(frame));
  };
  void run();
  const timeoutIds = MEASURE_RETRY_MS.map((ms) =>
    window.setTimeout(() => void run(), ms),
  );
  return () => {
    for (const id of timeoutIds) {
      window.clearTimeout(id);
    }
  };
}

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
  onLiveBoxMeasured?: (size: PreviewLiveMeasured) => void;
}) {
  const [sizeSource, setSizeSource] = useState<IframeContentSize | null>(null);
  const [sizeResult, setSizeResult] = useState<IframeContentSize | null>(null);
  const sourceFrameRef = useRef<HTMLIFrameElement | null>(null);
  const resultFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [trackedDocs, setTrackedDocs] = useState({ sourceDoc, resultDoc });

  if (
    sourceDoc !== trackedDocs.sourceDoc ||
    resultDoc !== trackedDocs.resultDoc
  ) {
    setTrackedDocs({ sourceDoc, resultDoc });
    setSizeSource(null);
    setSizeResult(null);
  }

  useLayoutEffect(() => {
    sourceFrameRef.current = null;
    resultFrameRef.current = null;
  }, [sourceDoc, resultDoc]);

  const scheduleMeasure = useCallback(
    (which: 'source' | 'result', frame: HTMLIFrameElement) => {
      if (which === 'source') {
        sourceFrameRef.current = frame;
      } else {
        resultFrameRef.current = frame;
      }
      const setSize = which === 'source' ? setSizeSource : setSizeResult;
      return measureWithRetries(frame, setSize);
    },
    [],
  );

  useEffect(() => {
    const cleanups: (() => void)[] = [];
    if (sourceFrameRef.current) {
      cleanups.push(scheduleMeasure('source', sourceFrameRef.current));
    }
    if (resultFrameRef.current) {
      cleanups.push(scheduleMeasure('result', resultFrameRef.current));
    }
    return () => {
      for (const cleanup of cleanups) {
        cleanup();
      }
    };
  }, [width, fallbackHeight, scheduleMeasure]);

  const onSourceLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      scheduleMeasure('source', event.currentTarget);
    },
    [scheduleMeasure],
  );

  const onResultLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      scheduleMeasure('result', event.currentTarget);
    },
    [scheduleMeasure],
  );

  const canShowResult = Boolean(resultDoc.trim());
  const canShowSource = Boolean(sourceDoc.trim());
  const showSourceLayer = canShowSource && (showingSource || !canShowResult);
  const showResultLayer = canShowResult && (!showingSource || !canShowSource);

  /** 보이는 레이어만 box·w-fit/h-fit에 반영 (숨긴 쪽 높이가 섞이지 않음) */
  const visibleLayerSize =
    showSourceLayer && sizeSource
      ? sizeSource
      : showResultLayer && sizeResult
        ? sizeResult
        : null;

  const viewportCap = Math.max(fallbackHeight, 80);
  const boxHeight = visibleLayerSize
    ? Math.min(Math.max(visibleLayerSize.height, 80), viewportCap)
    : fallbackHeight;

  const contentWidth = visibleLayerSize?.width ?? width;
  const contentHeight = visibleLayerSize?.height ?? boxHeight;

  useEffect(() => {
    onLiveBoxMeasured?.({
      iframeWidth: width,
      iframeHeight: boxHeight,
      contentWidth,
      contentHeight,
    });
  }, [width, boxHeight, contentWidth, contentHeight, onLiveBoxMeasured]);

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
