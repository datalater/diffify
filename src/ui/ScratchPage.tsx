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
  createScratchProject,
  ensureScratchProjectsReady,
  setActiveProjectId,
  type ScratchProjectRegistry,
} from "../lib/scratch-project-registry";
import {
  computeScratchLoadPercent,
  initialScratchLoadProgress,
  type ScratchLoadProgress,
  type ScratchLoadProgressCallback,
} from "../lib/scratch-load-progress";
import {
  checkoutScratchVersionEntry,
  commitScratchVersion,
  discardScratchDraftToCurrent,
  isScratchWorkspaceDirty,
  loadScratchWorkspace,
  SCRATCH_VERSION_DRAFT_VALUE,
  writeScratchDraft,
  type ScratchVersionMeta,
} from "../lib/scratch-version-storage";
import { writeScratchShowingSource } from "../lib/scratch-ui-state";
import {
  fetchScratchCompareHealth,
  installScratchCompareBrowsers,
  postScratchCompare,
  fetchLatestScratchCompare,
  scratchViewportKey,
} from "../lib/scratch-compare-api";
import type {
  ScratchCaptureViewMode,
  ScratchCompareResult,
  ScratchPreviewSubstrate,
} from "../lib/scratch-compare-types";
import type { ScratchHtmlLayer } from "../lib/scratch-html-io";
import type { PreviewLiveMeasured } from "../lib/measure-iframe-content";
import {
  DEFAULT_PREVIEW_HEIGHT_MODE,
  DEFAULT_PREVIEW_WIDTH_MODE,
  isBreakpointWidth,
  isPreviewSizeModeAtBaseline,
  previewWidthModeFromWidth,
  type PreviewHeightMode,
  type PreviewWidthMode,
} from "../lib/preview-size-mode";
import { ScratchCaptureStoragePanel } from "./ScratchCaptureStoragePanel";
import { ScratchComparePreview } from "./ScratchCapturePreview";
import { ScratchDevCompareBar } from "./ScratchDevCompareBar";
import { PreviewLayerChips } from "./PreviewLayerChips";
import { ScratchPreviewSubstrateSwitch } from "./ScratchPreviewSubstrateSwitch";
import {
  SCRATCH_PREVIEW_HINT_CLASS,
  SCRATCH_PREVIEW_PANEL_CLASS,
  SCRATCH_PREVIEW_TOOLBAR_DIVIDER_CLASS,
} from "./scratch-preview-ui";
import { ScratchFullDocumentDialog } from "./ScratchFullDocumentDialog";
import { PreviewDeviceToolbar } from "./PreviewDeviceToolbar";
import {
  ScratchEditorColumn,
  SCRATCH_ACTION_BTN_CLASS,
} from "./ScratchEditorColumn";
import { ScratchEditorPaneBar, ScratchPaneEmptyState } from "./ScratchEditorPaneBar";
import {
  countVisibleEditorPanes,
  countVisibleScratchPanes,
  DEFAULT_SCRATCH_PANE_VISIBILITY,
  type ScratchPaneId,
  type ScratchPaneVisibility,
} from "./scratch-pane-visibility";
import { isScratchEditorTypingTarget } from "../editor/scratch-editor-chrome";
import { ScratchLoadOverlay } from "./ScratchLoadOverlay";
import { ScratchTopBar } from "./ScratchTopBar";

const LIVE_PREVIEW_DEBOUNCE_MS = 200;
const DRAFT_DEBOUNCE_MS = 400;
const LOAD_OVERLAY_DELAY_MS = 200;

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

const EMPTY_VERSION_META: ScratchVersionMeta = {
  v: 1,
  versionLine: [],
  currentEntryId: null,
};

export function ScratchPage() {
  const [hydrated, setHydrated] = useState(false);
  const [projectRegistry, setProjectRegistry] =
    useState<ScratchProjectRegistry | null>(null);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(
    null,
  );
  const [versionMeta, setVersionMeta] =
    useState<ScratchVersionMeta>(EMPTY_VERSION_META);
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
  const [previewWidthMode, setPreviewWidthMode] =
    useState<PreviewWidthMode>(DEFAULT_PREVIEW_WIDTH_MODE);
  const [previewHeightMode, setPreviewHeightMode] =
    useState<PreviewHeightMode>(DEFAULT_PREVIEW_HEIGHT_MODE);
  const [status, setStatus] = useState("");
  const [loadProgress, setLoadProgress] = useState<ScratchLoadProgress | null>(
    () => initialScratchLoadProgress(),
  );
  const [showLoadOverlay, setShowLoadOverlay] = useState(false);
  const [previewMeasured, setPreviewMeasured] =
    useState<PreviewLiveMeasured | null>(null);
  const [paneVisibility, setPaneVisibility] = useState<ScratchPaneVisibility>(
    () => ({ ...DEFAULT_SCRATCH_PANE_VISIBILITY }),
  );
  const [headExamplesOpen, setHeadExamplesOpen] = useState(false);

  const isDevCompare = import.meta.env.DEV;
  const [captureDeviceScaleFactor, setCaptureDeviceScaleFactor] = useState(1);
  const [previewSubstrate, setPreviewSubstrate] =
    useState<ScratchPreviewSubstrate>("code");
  const viewportKey = useMemo(
    () =>
      scratchViewportKey(
        previewWidth,
        previewHeight,
        captureDeviceScaleFactor,
      ),
    [previewWidth, previewHeight, captureDeviceScaleFactor],
  );
  const [compareResult, setCompareResult] = useState<ScratchCompareResult | null>(
    null,
  );
  const [isComparing, setIsComparing] = useState(false);
  const [isLoadingLatestCompare, setIsLoadingLatestCompare] = useState(false);
  const [captureViewMode, setCaptureViewMode] =
    useState<ScratchCaptureViewMode>("overlay");
  const [storageRefreshToken, setStorageRefreshToken] = useState(0);
  const [showInstallBrowsers, setShowInstallBrowsers] = useState(false);
  const [isInstallingBrowsers, setIsInstallingBrowsers] = useState(false);

  const persistContent = useMemo(
    () => scratchPersistedContentFromEditors(editors, showingSource),
    [editors, showingSource],
  );

  const documentContent = editors;

  const reportLoadProgress = useCallback<ScratchLoadProgressCallback>(
    (progress) => {
      setLoadProgress(progress);
    },
    [],
  );

  const applyWorkspaceLoad = useCallback(
    async (
      projectId: string,
      workspace: Awaited<ReturnType<typeof loadScratchWorkspace>>,
      options: {
        urlSnap: boolean;
        projectLabel?: string;
        onProgress?: ScratchLoadProgressCallback;
      },
    ) => {
      setEditors(workspace.editors);
      setPreviewDocs(buildPreviewDocs(workspace.editors));
      setShowingSource(workspace.showingSource);
      setVersionMeta(workspace.meta);

      options.onProgress?.({
        phase: "dirty",
        message: "변경 여부 확인 중…",
        percent: computeScratchLoadPercent("dirty"),
      });

      const dirty = await isScratchWorkspaceDirty(
        workspace.editors,
        workspace.meta,
        projectId,
      );
      setVersionDirty(dirty);

      const prefix = options.projectLabel
        ? `「${options.projectLabel}」 — `
        : "";
      setStatus(
        options.urlSnap
          ? `${prefix}URL \`?state=\`를 draft로 불러왔다. 확정하려면 「버전 생성」을 누른다.`
          : workspace.hasDraft
            ? `${prefix}draft를 불러왔다. 확정하려면 「버전 생성」을 누른다.`
            : workspace.meta.versionLine.length > 0
              ? `${prefix}마지막 확정 버전을 불러왔다. 편집하면 draft만 갱신된다.`
              : `${prefix}head·HTML 입력이 미리보기에 반영된다. 편집 후 「버전 생성」으로 확정한다.`,
      );
    },
    [],
  );

  const loadProjectWorkspace = useCallback(
    async (
      projectId: string,
      urlSnap: ScratchPersistSnapshot | null = null,
      projectLabel?: string,
      onProgress?: ScratchLoadProgressCallback,
    ) => {
      const workspace = await loadScratchWorkspace(urlSnap, projectId, {
        onProgress,
      });
      await applyWorkspaceLoad(projectId, workspace, {
        urlSnap: urlSnap !== null,
        projectLabel,
        onProgress,
      });
    },
    [applyWorkspaceLoad],
  );

  const bootstrapScratchWorkspace = useCallback(async () => {
    reportLoadProgress({
      phase: "projects",
      message: "프로젝트 준비 중…",
      percent: computeScratchLoadPercent("projects"),
    });
    const registry = await ensureScratchProjectsReady();
    setProjectRegistry(registry);
    setActiveProjectIdState(registry.activeProjectId);
    const projectId = registry.activeProjectId;

    const urlEncoded = new URLSearchParams(window.location.search).get(
      "state",
    );
    let urlSnap: ScratchPersistSnapshot | null = null;
    if (urlEncoded) {
      reportLoadProgress({
        phase: "url-state",
        message: "URL `?state=` 디코딩 중…",
        percent: computeScratchLoadPercent("url-state"),
      });
      urlSnap = await decodeScratchState(urlEncoded);
    }

    const project = registry.projects.find((p) => p.id === projectId);
    await loadProjectWorkspace(
      projectId,
      urlSnap,
      project?.name,
      reportLoadProgress,
    );

    const { previewWidth: w, previewHeight: h } =
      defaultScratchPreviewDimensions();
    setPreviewWidth(clampWidth(w));
    setPreviewHeight(clampHeight(h));
    setPreviewWidthMode(DEFAULT_PREVIEW_WIDTH_MODE);
    setPreviewHeightMode(DEFAULT_PREVIEW_HEIGHT_MODE);
  }, [loadProjectWorkspace, reportLoadProgress]);

  const handleWorkspaceStorageCleared = useCallback(async () => {
    setCompareResult(null);
    try {
      const registry = await ensureScratchProjectsReady();
      setProjectRegistry(registry);
      setActiveProjectIdState(registry.activeProjectId);
      const project = registry.projects.find(
        (p) => p.id === registry.activeProjectId,
      );
      await loadProjectWorkspace(
        registry.activeProjectId,
        null,
        project?.name,
      );
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "알 수 없는 오류";
      setStatus(`워크스페이스를 불러오지 못했다. (${detail})`);
    }
  }, [loadProjectWorkspace]);

  const reloadProjectWorkspace = useCallback(
    async (projectId: string, projectLabel?: string) => {
      setShowLoadOverlay(false);
      setLoadProgress(initialScratchLoadProgress());
      try {
        await loadProjectWorkspace(
          projectId,
          null,
          projectLabel,
          reportLoadProgress,
        );
        setLoadProgress(null);
        setHydrated(true);
      } catch (error) {
        const detail =
          error instanceof Error ? error.message : "알 수 없는 오류";
        setStatus(`워크스페이스를 불러오지 못했다. (${detail})`);
        setLoadProgress(null);
        setHydrated(true);
      }
    },
    [loadProjectWorkspace, reportLoadProgress],
  );

  const flushDraftForActiveProject = useCallback(() => {
    if (!hydrated || !activeProjectId) return;
    writeScratchDraft(documentContent, activeProjectId);
    writeScratchShowingSource(showingSource, activeProjectId);
  }, [hydrated, activeProjectId, documentContent, showingSource]);

  useEffect(() => {
    if (hydrated) return undefined;
    const timer = window.setTimeout(
      () => setShowLoadOverlay(true),
      LOAD_OVERLAY_DELAY_MS,
    );
    return () => {
      window.clearTimeout(timer);
      setShowLoadOverlay(false);
    };
  }, [hydrated]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await bootstrapScratchWorkspace();
        if (cancelled) return;

        setLoadProgress(null);
        setHydrated(true);
      } catch (error) {
        if (cancelled) return;
        const detail =
          error instanceof Error ? error.message : "알 수 없는 오류";
        setStatus(`워크스페이스를 불러오지 못했다. (${detail})`);
        setLoadProgress(null);
        setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bootstrapScratchWorkspace, reportLoadProgress]);

  useEffect(() => {
    if (!isDevCompare) return;
    void fetchScratchCompareHealth().then((health) => {
      setCaptureDeviceScaleFactor(health.captureDeviceScaleFactor);
    });
  }, [isDevCompare]);

  useEffect(() => {
    if (!isDevCompare || !hydrated || !activeProjectId) return;

    let cancelled = false;

    void (async () => {
      setIsLoadingLatestCompare(true);
      try {
        const payload = await fetchLatestScratchCompare(
          activeProjectId,
          viewportKey,
        );
        if (cancelled) return;
        if (!payload.found) {
          setCompareResult(null);
          return;
        }
        setCompareResult(payload);
      } catch {
        if (!cancelled) {
          setCompareResult(null);
        }
      } finally {
        if (!cancelled) setIsLoadingLatestCompare(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isDevCompare, hydrated, activeProjectId, viewportKey]);

  const handleCompareNow = useCallback(async () => {
    if (!activeProjectId || !hydrated) return;

    setIsComparing(true);
    setShowInstallBrowsers(false);
    try {
      const payload = await postScratchCompare({
        projectId: activeProjectId,
        viewportKey,
        width: previewWidth,
        height: previewHeight,
        sourceDocument: previewDocs.source,
        resultDocument: previewDocs.result,
      });
      setCompareResult(payload);
      setStorageRefreshToken((t) => t + 1);
      const scaleNote =
        payload.deviceScaleFactor && payload.deviceScaleFactor > 1
          ? ` · DPR ${payload.deviceScaleFactor}`
          : "";
      setStatus(
        payload.pixelDiff.diffPixels === 0
          ? `캡처 완료 (run ${payload.runId}). pixel-perfect.${scaleNote}`
          : `캡처 완료 (run ${payload.runId}). ${payload.pixelDiff.diffPercent}% 차이.${scaleNote}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "캡처에 실패했다.";
      setStatus(message);
      if (/launch a browser|playwright install/i.test(message)) {
        setShowInstallBrowsers(true);
      }
    } finally {
      setIsComparing(false);
    }
  }, [
    activeProjectId,
    hydrated,
    viewportKey,
    previewWidth,
    previewHeight,
    previewDocs.source,
    previewDocs.result,
  ]);

  const handleInstallBrowsers = useCallback(async () => {
    setIsInstallingBrowsers(true);
    try {
      const result = await installScratchCompareBrowsers();
      setStatus(result.message);
      setShowInstallBrowsers(!result.ok);
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "브라우저 설치에 실패했다.",
      );
    } finally {
      setIsInstallingBrowsers(false);
    }
  }, []);

  const handleSelectProject = useCallback(
    async (projectId: string) => {
      if (!projectRegistry || projectId === activeProjectId) return;

      flushDraftForActiveProject();
      const next = setActiveProjectId(projectId);
      setProjectRegistry(next);
      setActiveProjectIdState(projectId);
      setHydrated(false);

      const project = next.projects.find((p) => p.id === projectId);
      await reloadProjectWorkspace(projectId, project?.name);
      setStatus(`프로젝트를 「${project?.name ?? ""}」(으)로 전환했다.`);
    },
    [
      projectRegistry,
      activeProjectId,
      flushDraftForActiveProject,
      reloadProjectWorkspace,
    ],
  );

  const handleCreateProject = useCallback(async () => {
    if (!projectRegistry) return;

    const name = window.prompt("프로젝트 이름 (비우면 자동 번호)", "");
    if (name === null) return;

    flushDraftForActiveProject();
    const next = createScratchProject(name);
    setProjectRegistry(next);
    setActiveProjectIdState(next.activeProjectId);
    setHydrated(false);

    const project = next.projects.find((p) => p.id === next.activeProjectId);
    await reloadProjectWorkspace(next.activeProjectId, project?.name);
    setStatus(`새 프로젝트 「${project?.name ?? ""}」를 만들었다.`);
  }, [projectRegistry, flushDraftForActiveProject, reloadProjectWorkspace]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPreviewDocs(buildPreviewDocs(editors));
    }, LIVE_PREVIEW_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [editors]);

  useEffect(() => {
    if (!hydrated || !activeProjectId) return;
    const timer = window.setTimeout(() => {
      writeScratchDraft(documentContent, activeProjectId);
    }, DRAFT_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [hydrated, activeProjectId, documentContent]);

  useEffect(() => {
    if (!hydrated || !activeProjectId) return;
    writeScratchShowingSource(showingSource, activeProjectId);
  }, [hydrated, activeProjectId, showingSource]);

  useEffect(() => {
    if (!hydrated || !activeProjectId) return;
    let cancelled = false;
    void isScratchWorkspaceDirty(
      documentContent,
      versionMeta,
      activeProjectId,
    ).then((dirty) => {
      if (!cancelled) setVersionDirty(dirty);
    });
    return () => {
      cancelled = true;
    };
  }, [hydrated, activeProjectId, documentContent, versionMeta]);

  const handleCreateVersion = useCallback(async () => {
    if (!activeProjectId) return;
    const result = await commitScratchVersion(
      documentContent,
      activeProjectId,
    );
    if (!result) {
      setStatus("버전을 저장하지 못했다 (IndexedDB·용량).");
      return;
    }
    setVersionMeta(result.meta);
    setVersionDirty(false);
    setStatus(`「${result.entry.label}」 버전을 확정했다.`);
  }, [documentContent, activeProjectId]);

  const handleSelectVersionValue = useCallback(
    async (value: string) => {
      if (!activeProjectId) return;
      if (value === SCRATCH_VERSION_DRAFT_VALUE) return;

      if (!versionDirty && value === versionMeta.currentEntryId) {
        return;
      }

      const result =
        versionDirty && value === versionMeta.currentEntryId
          ? await discardScratchDraftToCurrent(versionMeta, activeProjectId)
          : await checkoutScratchVersionEntry(value, activeProjectId);

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
    [versionMeta, versionDirty, activeProjectId],
  );

  useEffect(() => {
    if (!paneVisibility.preview) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isScratchEditorTypingTarget(event.target)) {
        return;
      }
      if (event.code === "Space" || event.code === "KeyD") {
        const layerToggleEnabled =
          !isDevCompare ||
          previewSubstrate === "code" ||
          (previewSubstrate === "capture" && captureViewMode === "overlay");
        if (!layerToggleEnabled) return;
        event.preventDefault();
        setShowingSource((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    paneVisibility.preview,
    isDevCompare,
    previewSubstrate,
    captureViewMode,
  ]);

  const diffMetricsText =
    compareResult?.pixelDiff == null
      ? null
      : compareResult.pixelDiff.diffPixels === 0
        ? "pixel-perfect"
        : `${compareResult.pixelDiff.diffPercent}% · ${compareResult.pixelDiff.diffPixels.toLocaleString()} px`;

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

  const handleLiveBoxMeasured = useCallback(
    (size: PreviewLiveMeasured) => {
      setPreviewMeasured(size);
      if (previewWidthMode.kind === "fit") {
        const next = clampWidth(size.contentWidth);
        setPreviewWidth((prev) => (prev === next ? prev : next));
      }
      if (previewHeightMode.kind === "fit") {
        const next = clampHeight(size.contentHeight);
        setPreviewHeight((prev) => (prev === next ? prev : next));
      }
    },
    [previewWidthMode, previewHeightMode],
  );

  const handleSelectBreakpointWidth = useCallback((width: number) => {
    const w = clampWidth(width);
    setPreviewWidthMode(
      isBreakpointWidth(w)
        ? { kind: "breakpoint", width: w }
        : { kind: "custom" },
    );
    setPreviewWidth(w);
  }, []);

  const handleSelectWidthFit = useCallback(() => {
    if (!previewMeasured || previewMeasured.contentWidth <= 1) return;
    setPreviewWidthMode({ kind: "fit" });
    setPreviewWidth(clampWidth(previewMeasured.contentWidth));
  }, [previewMeasured]);

  const handleSelectHeightFit = useCallback(() => {
    if (!previewMeasured || previewMeasured.contentHeight <= 0) return;
    setPreviewHeightMode({ kind: "fit" });
    setPreviewHeight(clampHeight(previewMeasured.contentHeight));
  }, [previewMeasured]);

  const handlePreviewWidthCustom = useCallback((width: number) => {
    const w = clampWidth(width);
    setPreviewWidthMode(previewWidthModeFromWidth(w));
    setPreviewWidth(w);
  }, []);

  const handlePreviewHeightCap = useCallback((height: number) => {
    setPreviewHeightMode({ kind: "cap" });
    setPreviewHeight(clampHeight(height));
  }, []);

  const isPreviewSizeAtBaseline = isPreviewSizeModeAtBaseline(
    previewWidth,
    previewHeight,
    previewWidthMode,
    previewHeightMode,
    BASELINE_PREVIEW,
  );

  const resetPreviewSize = useCallback(() => {
    const { previewWidth: width, previewHeight: height } = BASELINE_PREVIEW;
    setPreviewWidth(width);
    setPreviewHeight(height);
    setPreviewWidthMode(DEFAULT_PREVIEW_WIDTH_MODE);
    setPreviewHeightMode(DEFAULT_PREVIEW_HEIGHT_MODE);
    setStatus(`미리보기 크기를 ${width}×${height}으로 되돌렸다.`);
  }, []);

  const handleCopyShareUrl = useCallback(async () => {
    const result = await copyScratchShareUrl(persistContent);
    if (result.ok) {
      setStatus("공유 URL을 클립보드에 복사했다.");
      return;
    }
    if (result.reason === "too_long") {
      setStatus(
        "?state= 값이 12,000자를 넘어 URL 복사가 불가능하다. HTML 보내기·가져오기를 사용한다.",
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
        projectRegistry={projectRegistry}
        onSelectProject={(id) => void handleSelectProject(id)}
        onCreateProject={() => void handleCreateProject()}
        workspaceStorageDisabled={!hydrated}
        onWorkspaceStorageCleared={() => void handleWorkspaceStorageCleared()}
      />

      <ScratchEditorPaneBar
        visibility={paneVisibility}
        onTogglePane={togglePane}
      />

      <div className="relative flex min-h-0 flex-1 flex-col">
        {!hydrated && showLoadOverlay && loadProgress ? (
          <ScratchLoadOverlay progress={loadProgress} />
        ) : null}
        {visiblePaneCount === 0 ? <ScratchPaneEmptyState /> : null}

        {visibleEditorPaneCount > 0 ? (
          <main
            className={`mobile-down:flex-col flex min-h-0 flex-row gap-4 p-4 ${editorsFillHeight || previewOnly ? "flex-1" : "shrink-0"} ${editorsFillHeight ? "max-h-[95dvh] overflow-auto" : ""} ${!hydrated ? "pointer-events-none" : ""}`}
          >
            {paneVisibility.source ? (
              <ScratchEditorColumn
                className={editorColumnClassName}
                fillHeight={editorsFillHeight}
                disabled={!hydrated}
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
                disabled={!hydrated}
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
            className={`flex min-h-0 flex-col ${visibleEditorPaneCount === 0 ? "p-4 pb-8" : "px-4 pb-8"} ${previewOnly || visibleEditorPaneCount === 0 ? "min-h-0 flex-1" : ""} ${!hydrated ? "pointer-events-none" : ""}`}
          >
            <div
              className={`flex min-h-0 flex-col overflow-auto border border-slate-300 bg-slate-100 p-3 shadow-sm ${previewOnly || visibleEditorPaneCount === 0 ? "min-h-0 flex-1" : ""}`}
            >
              <div className={`mb-2 ${SCRATCH_PREVIEW_PANEL_CLASS}`}>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                  {isDevCompare ? (
                    <>
                      <ScratchPreviewSubstrateSwitch
                        value={previewSubstrate}
                        onChange={setPreviewSubstrate}
                      />
                      <span
                        className={SCRATCH_PREVIEW_TOOLBAR_DIVIDER_CLASS}
                        aria-hidden
                      />
                    </>
                  ) : null}
                  {previewSubstrate === "code" ||
                  !isDevCompare ||
                  previewSubstrate === "capture" ? (
                    <div
                      className={
                        isDevCompare &&
                        previewSubstrate === "capture" &&
                        captureViewMode !== "overlay"
                          ? "pointer-events-none invisible"
                          : undefined
                      }
                      aria-hidden={
                        isDevCompare &&
                        previewSubstrate === "capture" &&
                        captureViewMode !== "overlay"
                      }
                    >
                      <PreviewLayerChips
                        showingSource={showingSource}
                        onSelectLayer={(layer) =>
                          setShowingSource(layer === "source")
                        }
                      />
                    </div>
                  ) : null}
                  <span
                    className={`${SCRATCH_PREVIEW_HINT_CLASS} ${
                      previewSubstrate === "code" || !isDevCompare
                        ? ""
                        : captureViewMode === "overlay"
                          ? ""
                          : "pointer-events-none invisible"
                    }`}
                    aria-hidden={
                      !(
                        previewSubstrate === "code" ||
                        !isDevCompare ||
                        captureViewMode === "overlay"
                      )
                    }
                  >
                    {previewSubstrate === "code" || !isDevCompare
                      ? "Space/D · Source/Result"
                      : "Space/D · 레이어"}
                  </span>
                </div>
                {isDevCompare ? (
                  <div
                    className={
                      previewSubstrate === "capture"
                        ? undefined
                        : "pointer-events-none invisible"
                    }
                    aria-hidden={previewSubstrate !== "capture"}
                  >
                    <ScratchDevCompareBar
                      disabled={!hydrated || !activeProjectId}
                      isComparing={isComparing}
                      isLoadingLatest={isLoadingLatestCompare}
                      captureViewMode={captureViewMode}
                      diffMetricsText={diffMetricsText}
                      onCompare={() => void handleCompareNow()}
                      onCaptureViewModeChange={setCaptureViewMode}
                      showInstallBrowsers={showInstallBrowsers}
                      isInstallingBrowsers={isInstallingBrowsers}
                      onInstallBrowsers={() => void handleInstallBrowsers()}
                    />
                  </div>
                ) : null}
              </div>
              <div className="inline-flex max-w-full flex-col items-stretch overflow-x-auto overflow-y-visible rounded-md shadow-sm ring-1 ring-slate-300/90">
                <PreviewDeviceToolbar
                  previewWidth={previewWidth}
                  previewHeight={previewHeight}
                  widthMode={previewWidthMode}
                  heightMode={previewHeightMode}
                  onSelectBreakpointWidth={handleSelectBreakpointWidth}
                  onSelectWidthFit={handleSelectWidthFit}
                  onSelectHeightFit={handleSelectHeightFit}
                  onPreviewWidthCustom={handlePreviewWidthCustom}
                  onPreviewHeightCap={handlePreviewHeightCap}
                  isPreviewSizeAtBaseline={isPreviewSizeAtBaseline}
                  onResetPreviewSize={resetPreviewSize}
                  previewMeasured={previewMeasured}
                />
                <ScratchComparePreview
                  substrate={isDevCompare ? previewSubstrate : "code"}
                  captureViewMode={captureViewMode}
                  compareResult={isDevCompare ? compareResult : null}
                  dualSubstrate={isDevCompare}
                  showingSource={showingSource}
                  sourceDoc={previewDocs.source}
                  resultDoc={previewDocs.result}
                  width={previewWidth}
                  fallbackHeight={previewHeight}
                  onLiveBoxMeasured={handleLiveBoxMeasured}
                />
              </div>
              {isDevCompare ? (
                <ScratchCaptureStoragePanel
                  refreshToken={storageRefreshToken}
                  compareBusy={isComparing || isLoadingLatestCompare}
                  onNotify={setStatus}
                  onCleared={() => {
                    setCompareResult(null);
                  }}
                />
              ) : null}
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
