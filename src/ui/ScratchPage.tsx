import { useCallback, useEffect, useMemo, useState } from "react";
import {
  formatScratchBodyHtml,
  formatScratchHeadFragment,
} from "../lib/format-scratch-html";
import { createScratchDocument } from "../lib/source-document";
import { SCRATCH_SOURCE_HEAD_EXAMPLES } from "../lib/scratch-head-examples";
import {
  copyScratchShareUrl,
  decodeScratchState,
  defaultScratchPreviewDimensions,
  defaultScratchSnapshot,
  scratchPersistedContentFromEditors,
  type ScratchEditors,
  type ScratchPersistSnapshot,
} from "../lib/scratch-persist";
import {
  checkoutScratchVersionEntry,
  commitScratchVersion,
  discardScratchDraftToCurrent,
  isScratchWorkspaceDirty,
  loadScratchWorkspace,
  readScratchVersionMeta,
  SCRATCH_VERSION_DRAFT_VALUE,
  writeScratchDraft,
  type ScratchVersionMeta,
} from "../lib/scratch-version-storage";
import { writeScratchShowingSource } from "../lib/scratch-ui-state";
import type { ScratchHtmlLayer } from "../lib/scratch-html-io";
import { DiffifyLiveOverlay } from "./DiffifyLiveOverlay";
import { ScratchFullDocumentDialog } from "./ScratchFullDocumentDialog";
import { PreviewDeviceToolbar } from "./PreviewDeviceToolbar";
import {
  ScratchEditorColumn,
  SCRATCH_ACTION_BTN_CLASS,
} from "./ScratchEditorColumn";
import {
  countVisibleEditorPanes,
  countVisibleScratchPanes,
  DEFAULT_SCRATCH_PANE_VISIBILITY,
  ScratchEditorPaneBar,
  ScratchPaneEmptyState,
  type ScratchPaneId,
  type ScratchPaneVisibility,
} from "./ScratchEditorPaneBar";
import { ScratchTopBar } from "./ScratchTopBar";

const LIVE_PREVIEW_DEBOUNCE_MS = 200;
const DRAFT_DEBOUNCE_MS = 400;

const BASELINE_PREVIEW = defaultScratchPreviewDimensions();

function buildPreviewDocs(editors: ScratchEditors) {
  return {
    source: createScratchDocument(editors.sourceHead, editors.sourceHtml),
    result: createScratchDocument(editors.resultHead, editors.resultHtml),
  };
}

function editorsFromSnapshot(snapshot: ScratchPersistSnapshot): ScratchEditors {
  return {
    sourceHead: snapshot.sourceHead,
    sourceHtml: snapshot.sourceHtml,
    resultHead: snapshot.resultHead,
    resultHtml: snapshot.resultHtml,
  };
}

function applyEditorsToEditorState(
  document: ScratchEditors,
  setters: {
    setEditors: (e: ScratchEditors) => void;
    setPreviewDocs: (d: ReturnType<typeof buildPreviewDocs>) => void;
  },
): void {
  setters.setEditors(document);
  setters.setPreviewDocs(buildPreviewDocs(document));
}

const NAV_BADGE = {
  fgOnFill: "#ffffff",
  source: "#d97706",
  result: "#059669",
} as const;

const LAYER_CHIP_BTN_CLASS =
  "inline-flex cursor-pointer items-center rounded-full border-0 px-2.5 py-0.5 text-[11px] font-semibold shadow-sm transition-opacity hover:opacity-100 focus:outline-2 focus:outline-sky-500 focus:outline-offset-1";

function PreviewLayerChips({
  showingSource,
  onSelectLayer,
}: {
  showingSource: boolean;
  onSelectLayer: (layer: "source" | "result") => void;
}) {
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5"
      role="group"
      aria-label="미리보기 레이어"
    >
      <button
        type="button"
        className={LAYER_CHIP_BTN_CLASS}
        style={{
          backgroundColor: NAV_BADGE.source,
          color: NAV_BADGE.fgOnFill,
          opacity: showingSource ? 1 : 0.35,
        }}
        aria-pressed={showingSource}
        onClick={() => {
          if (!showingSource) onSelectLayer("source");
        }}
      >
        Source
      </button>
      <button
        type="button"
        className={LAYER_CHIP_BTN_CLASS}
        style={{
          backgroundColor: NAV_BADGE.result,
          color: NAV_BADGE.fgOnFill,
          opacity: showingSource ? 0.35 : 1,
        }}
        aria-pressed={!showingSource}
        onClick={() => {
          if (showingSource) onSelectLayer("result");
        }}
      >
        Result
      </button>
    </span>
  );
}

const PREVIEW_MAX_W = 4096;
const PREVIEW_MAX_H = 12000;

function clampWidth(n: number): number {
  const r = Math.round(n);
  if (!Number.isFinite(r) || r < 1) return 1;
  return Math.min(PREVIEW_MAX_W, r);
}

function clampHeight(n: number): number {
  const r = Math.round(n);
  if (!Number.isFinite(r) || r < 1) return 1;
  return Math.min(PREVIEW_MAX_H, r);
}

export function ScratchPage() {
  const [hydrated, setHydrated] = useState(false);
  const [versionMeta, setVersionMeta] = useState<ScratchVersionMeta>(() =>
    readScratchVersionMeta(),
  );
  const [versionDirty, setVersionDirty] = useState(false);
  const defaults = defaultScratchSnapshot();
  const [editors, setEditors] = useState<ScratchEditors>(() =>
    editorsFromSnapshot(defaults),
  );
  const [previewDocs, setPreviewDocs] = useState(() =>
    buildPreviewDocs(editorsFromSnapshot(defaults)),
  );
  const [showingSource, setShowingSource] = useState(defaults.showingSource);
  const [previewWidth, setPreviewWidth] = useState(defaults.previewWidth);
  const [previewHeight, setPreviewHeight] = useState(defaults.previewHeight);
  const [status, setStatus] = useState(
    "저장된 내용을 불러오는 중… (draft·버전·URL `?state=`)",
  );
  const [previewMeasured, setPreviewMeasured] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [paneVisibility, setPaneVisibility] = useState<ScratchPaneVisibility>(
    () => ({ ...DEFAULT_SCRATCH_PANE_VISIBILITY }),
  );
  const [headExamplesOpen, setHeadExamplesOpen] = useState(false);

  const persistContent = useMemo(
    () => scratchPersistedContentFromEditors(editors, showingSource),
    [editors, showingSource],
  );

  const documentContent = editors;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const urlEncoded = new URLSearchParams(window.location.search).get(
        "state",
      );
      const urlSnap = urlEncoded ? await decodeScratchState(urlEncoded) : null;

      const workspace = await loadScratchWorkspace(urlSnap);
      if (cancelled) return;

      setEditors(workspace.editors);
      setPreviewDocs(buildPreviewDocs(workspace.editors));
      setShowingSource(workspace.showingSource);
      setVersionMeta(workspace.meta);
      const { previewWidth: w, previewHeight: h } =
        defaultScratchPreviewDimensions();
      setPreviewWidth(clampWidth(w));
      setPreviewHeight(clampHeight(h));
      setHydrated(true);

      const dirty = await isScratchWorkspaceDirty(
        workspace.editors,
        workspace.meta,
      );
      if (!cancelled) setVersionDirty(dirty);

      setStatus(
        urlSnap
          ? "URL `?state=`를 draft로 불러왔다. 확정하려면 「버전 생성」을 누른다."
          : workspace.hasDraft
            ? "draft를 불러왔다. 확정하려면 「버전 생성」을 누른다."
            : workspace.meta.versionLine.length > 0
              ? "마지막 확정 버전을 불러왔다. 편집하면 draft만 갱신된다."
              : "head·HTML 입력이 미리보기에 반영된다. 편집 후 「버전 생성」으로 확정한다.",
      );
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewDocs(buildPreviewDocs(editors));
    }, LIVE_PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [editors]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      writeScratchDraft(documentContent);
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, documentContent]);

  useEffect(() => {
    if (!hydrated) return;
    writeScratchShowingSource(showingSource);
  }, [hydrated, showingSource]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    void isScratchWorkspaceDirty(documentContent, versionMeta).then((dirty) => {
      if (!cancelled) setVersionDirty(dirty);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, documentContent, versionMeta]);

  const handleCreateVersion = useCallback(async () => {
    const result = await commitScratchVersion(documentContent);
    if (!result) {
      setStatus("버전을 저장하지 못했다 (IndexedDB·용량).");
      return;
    }
    setVersionMeta(result.meta);
    setVersionDirty(false);
    setStatus(`「${result.entry.label}」 버전을 확정했다.`);
  }, [documentContent]);

  const handleSelectVersionValue = useCallback(
    async (value: string) => {
      if (value === SCRATCH_VERSION_DRAFT_VALUE) return;

      if (!versionDirty && value === versionMeta.currentEntryId) {
        return;
      }

      const result =
        versionDirty && value === versionMeta.currentEntryId
          ? await discardScratchDraftToCurrent(versionMeta)
          : await checkoutScratchVersionEntry(value);

      if (!result) {
        setStatus("버전을 불러오지 못했다.");
        return;
      }

      applyEditorsToEditorState(result.editors, {
        setEditors,
        setPreviewDocs,
      });
      setVersionMeta(result.meta);
      setVersionDirty(false);
      setStatus(
        versionDirty && value === versionMeta.currentEntryId
          ? `draft를 버리고 「${result.entry.label}」로 맞췄다.`
          : `「${result.entry.label}」로 reset했다 (draft·타임라인 변경 없음).`,
      );
    },
    [versionMeta, versionDirty],
  );

  useEffect(() => {
    if (!paneVisibility.preview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const targetTag = (event.target as HTMLElement | null)?.tagName;
      if (
        targetTag === "INPUT" ||
        targetTag === "TEXTAREA" ||
        targetTag === "SELECT"
      ) {
        return;
      }
      if (event.code === "Space" || event.code === "KeyD") {
        event.preventDefault();
        setShowingSource((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [paneVisibility.preview]);

  const formatSourceHead = useCallback(() => {
    setEditors((prev) => ({
      ...prev,
      sourceHead: formatScratchHeadFragment(prev.sourceHead),
    }));
    setStatus("Source head를 포맷했다.");
  }, []);

  const formatSourceHtml = useCallback(() => {
    setEditors((prev) => ({
      ...prev,
      sourceHtml: formatScratchBodyHtml(prev.sourceHtml),
    }));
    setStatus("Source HTML을 포맷했다.");
  }, []);

  const formatResultHead = useCallback(() => {
    setEditors((prev) => ({
      ...prev,
      resultHead: formatScratchHeadFragment(prev.resultHead),
    }));
    setStatus("Result head를 포맷했다.");
  }, []);

  const formatResultHtml = useCallback(() => {
    setEditors((prev) => ({
      ...prev,
      resultHtml: formatScratchBodyHtml(prev.resultHtml),
    }));
    setStatus("Result HTML을 포맷했다.");
  }, []);

  const isPreviewSizeAtBaseline =
    previewWidth === BASELINE_PREVIEW.previewWidth &&
    previewHeight === BASELINE_PREVIEW.previewHeight;

  const resetPreviewSize = useCallback(() => {
    const { previewWidth: width, previewHeight: height } = BASELINE_PREVIEW;
    setPreviewWidth(width);
    setPreviewHeight(height);
    setStatus(`미리보기 크기를 ${width}×${height}(max)으로 되돌렸다.`);
  }, []);

  const handleCopyShareUrl = useCallback(async () => {
    const result = await copyScratchShareUrl(persistContent);
    if (result.ok) {
      setStatus("공유 URL을 클립보드에 복사했다.");
      return;
    }
    if (result.reason === "too_long") {
      setStatus(
        "?state= 값이 12,000자를 넘어 URL 복사가 불가능하다. 내보내기·localStorage를 사용한다.",
      );
      return;
    }
    setStatus("클립보드 복사에 실패했다. 주소창 URL을 직접 복사한다.");
  }, [persistContent]);

  const togglePane = useCallback((pane: ScratchPaneId) => {
    setPaneVisibility((prev) => ({ ...prev, [pane]: !prev[pane] }));
  }, []);

  const visiblePaneCount = countVisibleScratchPanes(paneVisibility);
  const visibleEditorPaneCount = countVisibleEditorPanes(paneVisibility);
  const previewOnly = paneVisibility.preview && visibleEditorPaneCount === 0;
  const editorsFillHeight =
    visibleEditorPaneCount > 0 && !paneVisibility.preview;
  const editorColumnClassName = editorsFillHeight
    ? "flex min-h-0 min-w-0 flex-1 flex-col"
    : "min-w-0 flex-1";

  const handleImportLayer = useCallback(
    (layer: ScratchHtmlLayer, parts: { head: string; bodyHtml: string }) => {
      setEditors((prev) =>
        layer === "source"
          ? {
              ...prev,
              sourceHead: parts.head,
              sourceHtml: parts.bodyHtml,
            }
          : {
              ...prev,
              resultHead: parts.head,
              resultHtml: parts.bodyHtml,
            },
      );
    },
    [],
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <ScratchTopBar
        status={status}
        persistContent={persistContent}
        editors={editors}
        onCopyShareUrl={handleCopyShareUrl}
        onImportLayer={handleImportLayer}
        onNotify={setStatus}
        versionMeta={versionMeta}
        versionDirty={versionDirty}
        versionControlsDisabled={!hydrated}
        onCreateVersion={() => void handleCreateVersion()}
        onSelectVersionValue={(value) => void handleSelectVersionValue(value)}
      />

      <ScratchEditorPaneBar
        visibility={paneVisibility}
        onTogglePane={togglePane}
      />

      <div className="flex min-h-0 flex-1 flex-col">
        {visiblePaneCount === 0 ? <ScratchPaneEmptyState /> : null}

        {visibleEditorPaneCount > 0 ? (
          <main
            className={`mobile-down:flex-col flex min-h-0 flex-row gap-4 p-4 ${editorsFillHeight || previewOnly ? "flex-1" : "shrink-0"}`}
          >
            {paneVisibility.source ? (
              <ScratchEditorColumn
                className={editorColumnClassName}
                fillHeight={editorsFillHeight}
                title="Source"
                head={editors.sourceHead}
                html={editors.sourceHtml}
                onHeadChange={(sourceHead) =>
                  setEditors((prev) => ({ ...prev, sourceHead }))
                }
                onHtmlChange={(sourceHtml) =>
                  setEditors((prev) => ({ ...prev, sourceHtml }))
                }
                onFormatHead={formatSourceHead}
                onFormatHtml={formatSourceHtml}
                headActions={
                  <button
                    type="button"
                    onClick={() => setHeadExamplesOpen(true)}
                    className={SCRATCH_ACTION_BTN_CLASS}
                    title="`<head>` 참고 스니펫 (복사용)"
                  >
                    Examples
                  </button>
                }
              />
            ) : null}
            {paneVisibility.result ? (
              <ScratchEditorColumn
                className={editorColumnClassName}
                fillHeight={editorsFillHeight}
                title="Result"
                head={editors.resultHead}
                html={editors.resultHtml}
                onHeadChange={(resultHead) =>
                  setEditors((prev) => ({ ...prev, resultHead }))
                }
                onHtmlChange={(resultHtml) =>
                  setEditors((prev) => ({ ...prev, resultHtml }))
                }
                onFormatHead={formatResultHead}
                onFormatHtml={formatResultHtml}
              />
            ) : null}
          </main>
        ) : null}

        {paneVisibility.preview ? (
          <section
            className={`flex min-h-0 flex-col ${visibleEditorPaneCount === 0 ? "p-4 pb-8" : "px-4 pb-8"} ${previewOnly || visibleEditorPaneCount === 0 ? "min-h-0 flex-1" : ""}`}
          >
            <div
              className={`flex min-h-0 flex-col overflow-auto border border-slate-300 bg-slate-100 p-3 shadow-sm ${previewOnly || visibleEditorPaneCount === 0 ? "min-h-0 flex-1" : ""}`}
            >
              <p className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 rounded-md border border-slate-300 bg-slate-50 px-3 py-2 font-sans text-xs leading-snug text-slate-800">
                <PreviewLayerChips
                  showingSource={showingSource}
                  onSelectLayer={(layer) =>
                    setShowingSource(layer === "source")
                  }
                />
                <span>
                  Space/D 또는 칩 클릭으로 Source·Result 전환 (iframe 유지).
                </span>
              </p>
              <div className="inline-flex max-w-full flex-col items-stretch overflow-hidden rounded-md shadow-sm ring-1 ring-slate-300/90">
                <PreviewDeviceToolbar
                  previewWidth={previewWidth}
                  previewHeight={previewHeight}
                  onPreviewWidthChange={(width) =>
                    setPreviewWidth(clampWidth(width))
                  }
                  onPreviewHeightChange={(height) =>
                    setPreviewHeight(clampHeight(height))
                  }
                  isPreviewSizeAtBaseline={isPreviewSizeAtBaseline}
                  onResetPreviewSize={resetPreviewSize}
                  previewMeasured={previewMeasured}
                />
                <DiffifyLiveOverlay
                  sourceDoc={previewDocs.source}
                  resultDoc={previewDocs.result}
                  width={previewWidth}
                  fallbackHeight={previewHeight}
                  showingSource={showingSource}
                  onLiveBoxMeasured={setPreviewMeasured}
                />
              </div>
            </div>
          </section>
        ) : null}
      </div>

      <ScratchFullDocumentDialog
        open={headExamplesOpen}
        title="Source — head Examples"
        documentHtml={SCRATCH_SOURCE_HEAD_EXAMPLES}
        onClose={() => setHeadExamplesOpen(false)}
      />
    </div>
  );
}
