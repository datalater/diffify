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
  type PreviewScrollInfo,
  type PreviewScrollState,
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

function readScrollInfo(win: Window): PreviewScrollInfo {
  const docEl = win.document.documentElement;
  return {
    y: Math.round(win.scrollY),
    max: Math.round(Math.max(0, docEl.scrollHeight - docEl.clientHeight)),
  };
}

export function DiffifyLiveOverlay({
  sourceDoc,
  resultDoc,
  width,
  fallbackHeight,
  showingSource,
  onLiveBoxMeasured,
  onScrollChange,
  syncScroll = false,
}: {
  sourceDoc: string;
  resultDoc: string;
  width: number;
  fallbackHeight: number;
  showingSource: boolean;
  onLiveBoxMeasured?: (size: PreviewLiveMeasured) => void;
  onScrollChange?: (state: PreviewScrollState) => void;
  syncScroll?: boolean;
}) {
  const [sizeSource, setSizeSource] = useState<IframeContentSize | null>(null);
  const [sizeResult, setSizeResult] = useState<IframeContentSize | null>(null);
  const sourceFrameRef = useRef<HTMLIFrameElement | null>(null);
  const resultFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [trackedDocs, setTrackedDocs] = useState({ sourceDoc, resultDoc });

  /** sync 토글 시 전환된 iframe에 적용할 공유 세로 스크롤 위치 */
  const sharedScrollRef = useRef(0);
  const sourceScrollCleanupRef = useRef<(() => void) | null>(null);
  const resultScrollCleanupRef = useRef<(() => void) | null>(null);

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

  const canShowResult = Boolean(resultDoc.trim());
  const canShowSource = Boolean(sourceDoc.trim());
  const showSourceLayer = canShowSource && (showingSource || !canShowResult);
  const showResultLayer = canShowResult && (!showingSource || !canShowSource);

  /** scroll 핸들러는 onLoad 시점 클로저라 stale — 최신값을 ref로 읽는다. */
  const liveRef = useRef({
    showSourceLayer,
    showResultLayer,
    syncScroll,
    onScrollChange,
  });
  useEffect(() => {
    liveRef.current = {
      showSourceLayer,
      showResultLayer,
      syncScroll,
      onScrollChange,
    };
  });

  /** source·result 양쪽의 현재 스크롤을 읽어 함께 보고한다(둘 다 툴바에 표시). */
  const emitScrollState = useCallback(() => {
    const sourceWin = sourceFrameRef.current?.contentWindow ?? null;
    const resultWin = resultFrameRef.current?.contentWindow ?? null;
    liveRef.current.onScrollChange?.({
      source: sourceWin ? readScrollInfo(sourceWin) : null,
      result: resultWin ? readScrollInfo(resultWin) : null,
    });
  }, []);

  const attachScroll = useCallback(
    (which: 'source' | 'result', frame: HTMLIFrameElement) => {
      const win = frame.contentWindow;
      if (!win) return;
      const handler = () => {
        const live = liveRef.current;
        const visible =
          which === 'source' ? live.showSourceLayer : live.showResultLayer;
        // sync 기준은 "보고 있는 쪽"의 스크롤 위치
        if (visible) {
          sharedScrollRef.current = Math.round(win.scrollY);
          // sync ON이면 숨은 쪽도 실시간으로 같은 위치로 — 표시값이 함께 갱신된다.
          if (live.syncScroll) {
            const otherFrame =
              which === 'source'
                ? resultFrameRef.current
                : sourceFrameRef.current;
            otherFrame?.contentWindow?.scrollTo(0, sharedScrollRef.current);
          }
        }
        emitScrollState();
      };
      win.addEventListener('scroll', handler, { passive: true });
      const cleanup = () => win.removeEventListener('scroll', handler);
      if (which === 'source') {
        sourceScrollCleanupRef.current?.();
        sourceScrollCleanupRef.current = cleanup;
      } else {
        resultScrollCleanupRef.current?.();
        resultScrollCleanupRef.current = cleanup;
      }
    },
    [emitScrollState],
  );

  useEffect(
    () => () => {
      sourceScrollCleanupRef.current?.();
      resultScrollCleanupRef.current?.();
    },
    [],
  );

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
      attachScroll('source', event.currentTarget);
      emitScrollState();
    },
    [scheduleMeasure, attachScroll, emitScrollState],
  );

  const onResultLoad = useCallback(
    (event: SyntheticEvent<HTMLIFrameElement>) => {
      scheduleMeasure('result', event.currentTarget);
      attachScroll('result', event.currentTarget);
      emitScrollState();
    },
    [scheduleMeasure, attachScroll, emitScrollState],
  );

  /** 전환 시: sync면 보이는 iframe을 공유 위치로 맞추고, 양쪽 값을 툴바에 반영한다. */
  useEffect(() => {
    if (syncScroll) {
      const frame = showSourceLayer
        ? sourceFrameRef.current
        : showResultLayer
          ? resultFrameRef.current
          : null;
      frame?.contentWindow?.scrollTo(0, sharedScrollRef.current);
    }
    emitScrollState();
  }, [showSourceLayer, showResultLayer, syncScroll, emitScrollState]);

  /** measure로 콘텐츠 크기가 확정되면 max(스크롤 가능 범위)도 갱신해 반영한다. */
  useEffect(() => {
    emitScrollState();
  }, [sizeSource, sizeResult, emitScrollState]);

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
