import {
  hashScratchDocument,
  scratchDocumentEquals,
} from './scratch-content-hash';
import {
  readScratchShowingSource,
  writeScratchShowingSource,
} from './scratch-ui-state';
import {
  contentFromPayload,
  defaultScratchSnapshot,
  type ScratchEditors,
  type ScratchPersistPayload,
  type ScratchPersistSnapshot,
} from './scratch-persist';

export type ScratchVersionEntry = {
  entryId: string;
  hash: string;
  label: string;
  createdAt: number;
};

export type ScratchVersionMeta = {
  v: 1;
  versionLine: ScratchVersionEntry[];
  currentEntryId: string | null;
};

const META_KEY = 'diffify-scratch-meta';
const DRAFT_KEY = 'diffify-scratch-draft';
const LEGACY_KEY = 'diffify-scratch-v1';

const IDB_NAME = 'diffify-scratch';
const IDB_VERSION = 1;
const BLOB_STORE = 'blobs';

const MAX_VERSION_LINE = 50;

let dbPromise: Promise<IDBDatabase> | null = null;
let migratePromise: Promise<void> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'hash' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB open failed'));
  });
  return dbPromise;
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB request failed'));
  });
}

function normalizeStoredDocument(
  raw: ScratchEditors & { showingSource?: boolean },
): ScratchEditors {
  return {
    sourceHead: raw.sourceHead,
    sourceHtml: raw.sourceHtml,
    resultHead: raw.resultHead,
    resultHtml: raw.resultHtml,
  };
}

async function putBlob(hash: string, document: ScratchEditors): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(BLOB_STORE, 'readwrite');
  const store = tx.objectStore(BLOB_STORE);
  await idbRequest(store.put({ hash, content: document }));
}

export async function getBlobByHash(
  hash: string,
): Promise<ScratchEditors | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(BLOB_STORE, 'readonly');
    const store = tx.objectStore(BLOB_STORE);
    const row = (await idbRequest(store.get(hash))) as
      | { hash: string; content: ScratchEditors & { showingSource?: boolean } }
      | undefined;
    if (!row?.content) return null;
    return normalizeStoredDocument(row.content);
  } catch {
    return null;
  }
}

export function readScratchVersionMeta(): ScratchVersionMeta {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) {
      return { v: 1, versionLine: [], currentEntryId: null };
    }
    const parsed = JSON.parse(raw) as ScratchVersionMeta;
    if (parsed.v !== 1 || !Array.isArray(parsed.versionLine)) {
      return { v: 1, versionLine: [], currentEntryId: null };
    }
    return {
      v: 1,
      versionLine: parsed.versionLine,
      currentEntryId: parsed.currentEntryId ?? null,
    };
  } catch {
    return { v: 1, versionLine: [], currentEntryId: null };
  }
}

export function writeScratchVersionMeta(meta: ScratchVersionMeta): void {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* quota */
  }
}

export function readScratchDraft(): ScratchEditors | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as unknown;
    if (!isDraftPayload(payload)) return null;
    if ('ls' in payload && (payload.ls === 0 || payload.ls === 1)) {
      writeScratchShowingSource(payload.ls === 1);
    }
    return draftPayloadToDocument(payload);
  } catch {
    return null;
  }
}

export function writeScratchDraft(document: ScratchEditors): void {
  try {
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify(documentToDraftPayload(document)),
    );
  } catch {
    /* quota */
  }
}

export function clearScratchDraft(): void {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

type ScratchDraftPayloadV2 = {
  sh: string;
  sx: string;
  rh: string;
  rx: string;
};

type ScratchDraftPayloadLegacy = ScratchDraftPayloadV2 & { ls: 0 | 1 };

function isDraftPayload(
  raw: unknown,
): raw is ScratchDraftPayloadV2 | ScratchDraftPayloadLegacy {
  if (typeof raw !== 'object' || raw === null) return false;
  const p = raw as ScratchDraftPayloadV2;
  return (
    typeof p.sh === 'string' &&
    typeof p.sx === 'string' &&
    typeof p.rh === 'string' &&
    typeof p.rx === 'string'
  );
}

function documentToDraftPayload(
  document: ScratchEditors,
): ScratchDraftPayloadV2 {
  return {
    sh: document.sourceHead,
    sx: document.sourceHtml,
    rh: document.resultHead,
    rx: document.resultHtml,
  };
}

function draftPayloadToDocument(
  payload: ScratchDraftPayloadV2,
): ScratchEditors {
  return {
    sourceHead: payload.sh,
    sourceHtml: payload.sx,
    resultHead: payload.rh,
    resultHtml: payload.rx,
  };
}

function isLegacyPayload(raw: unknown): raw is ScratchPersistPayload {
  if (typeof raw !== 'object' || raw === null) return false;
  const p = raw as ScratchPersistPayload;
  return (
    (p.v === 1 || p.v === 2) &&
    typeof p.sh === 'string' &&
    typeof p.sx === 'string' &&
    typeof p.rh === 'string' &&
    typeof p.rx === 'string' &&
    (p.ls === 0 || p.ls === 1)
  );
}

function pruneVersionLine(line: ScratchVersionEntry[]): ScratchVersionEntry[] {
  if (line.length <= MAX_VERSION_LINE) return line;
  return line.slice(line.length - MAX_VERSION_LINE);
}

function nextVersionLabel(lineLength: number): string {
  return `v${lineLength + 1}`;
}

/** select `value` when editor has unsaved draft */
export const SCRATCH_VERSION_DRAFT_VALUE = '__draft__';

/** Append 시에만 사용 — 라벨 유일: `v4(v1 restored)` */
export function restoredVersionLabel(
  sourceLabel: string,
  versionLineLength: number,
): string {
  return `v${versionLineLength + 1}(${sourceLabel} restored)`;
}

export async function migrateLegacyScratchStorage(): Promise<void> {
  if (migratePromise) return migratePromise;

  migratePromise = (async () => {
    const meta = readScratchVersionMeta();
    if (meta.versionLine.length > 0 || readScratchDraft()) return;

    try {
      const raw = localStorage.getItem(LEGACY_KEY);
      if (!raw) return;
      const payload = JSON.parse(raw) as unknown;
      if (!isLegacyPayload(payload)) return;
      const legacy = contentFromPayload(payload);
      writeScratchDraft({
        sourceHead: legacy.sourceHead,
        sourceHtml: legacy.sourceHtml,
        resultHead: legacy.resultHead,
        resultHtml: legacy.resultHtml,
      });
      writeScratchShowingSource(legacy.showingSource);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      /* ignore */
    }
  })();

  return migratePromise;
}

export function findVersionEntry(
  meta: ScratchVersionMeta,
  entryId: string,
): ScratchVersionEntry | undefined {
  return meta.versionLine.find((entry) => entry.entryId === entryId);
}

export async function loadCommittedDocument(
  meta: ScratchVersionMeta,
  entryId: string | null,
): Promise<ScratchEditors | null> {
  if (!entryId) return null;
  const entry = findVersionEntry(meta, entryId);
  if (!entry) return null;
  return getBlobByHash(entry.hash);
}

export type ScratchWorkspaceLoad = {
  editors: ScratchEditors;
  showingSource: boolean;
  meta: ScratchVersionMeta;
  hasDraft: boolean;
};

export async function loadScratchWorkspace(
  urlOverride: ScratchPersistSnapshot | null,
): Promise<ScratchWorkspaceLoad> {
  await migrateLegacyScratchStorage();

  const defaultShowingSource = defaultScratchSnapshot().showingSource;

  if (urlOverride) {
    const editors: ScratchEditors = {
      sourceHead: urlOverride.sourceHead,
      sourceHtml: urlOverride.sourceHtml,
      resultHead: urlOverride.resultHead,
      resultHtml: urlOverride.resultHtml,
    };
    writeScratchDraft(editors);
    writeScratchShowingSource(urlOverride.showingSource);
    const meta = readScratchVersionMeta();
    return {
      editors,
      showingSource: urlOverride.showingSource,
      meta,
      hasDraft: true,
    };
  }

  const meta = readScratchVersionMeta();
  const showingSource = readScratchShowingSource(defaultShowingSource);
  const draft = readScratchDraft();
  if (draft) {
    return { editors: draft, showingSource, meta, hasDraft: true };
  }

  const fromCurrent = await loadCommittedDocument(meta, meta.currentEntryId);
  if (fromCurrent) {
    return { editors: fromCurrent, showingSource, meta, hasDraft: false };
  }

  const last = meta.versionLine[meta.versionLine.length - 1];
  if (last) {
    const fromLast = await getBlobByHash(last.hash);
    if (fromLast) {
      return { editors: fromLast, showingSource, meta, hasDraft: false };
    }
  }

  const defaults = defaultScratchSnapshot();
  const editors: ScratchEditors = {
    sourceHead: defaults.sourceHead,
    sourceHtml: defaults.sourceHtml,
    resultHead: defaults.resultHead,
    resultHtml: defaults.resultHtml,
  };
  return {
    editors,
    showingSource: readScratchShowingSource(defaults.showingSource),
    meta,
    hasDraft: false,
  };
}

export async function isScratchWorkspaceDirty(
  document: ScratchEditors,
  meta: ScratchVersionMeta,
): Promise<boolean> {
  if (readScratchDraft()) {
    const committed = await loadCommittedDocument(meta, meta.currentEntryId);
    if (!committed) return true;
    return !(await scratchDocumentEquals(document, committed));
  }

  if (!meta.currentEntryId) {
    const defaults = defaultScratchSnapshot();
    const baseline: ScratchEditors = {
      sourceHead: defaults.sourceHead,
      sourceHtml: defaults.sourceHtml,
      resultHead: defaults.resultHead,
      resultHtml: defaults.resultHtml,
    };
    return !(await scratchDocumentEquals(document, baseline));
  }

  const committed = await loadCommittedDocument(meta, meta.currentEntryId);
  if (!committed) return true;
  return !(await scratchDocumentEquals(document, committed));
}

export type CommitScratchVersionResult = {
  meta: ScratchVersionMeta;
  entry: ScratchVersionEntry;
};

export async function commitScratchVersion(
  document: ScratchEditors,
): Promise<CommitScratchVersionResult | null> {
  try {
    const hash = await hashScratchDocument(document);
    await putBlob(hash, document);

    const meta = readScratchVersionMeta();
    const entry: ScratchVersionEntry = {
      entryId: crypto.randomUUID(),
      hash,
      label: nextVersionLabel(meta.versionLine.length),
      createdAt: Date.now(),
    };

    const versionLine = pruneVersionLine([...meta.versionLine, entry]);
    const nextMeta: ScratchVersionMeta = {
      v: 1,
      versionLine,
      currentEntryId: entry.entryId,
    };

    writeScratchVersionMeta(nextMeta);
    clearScratchDraft();

    return { meta: nextMeta, entry };
  } catch {
    return null;
  }
}

export type CheckoutScratchVersionResult = {
  meta: ScratchVersionMeta;
  entry: ScratchVersionEntry;
  editors: ScratchEditors;
};

/** draft 버리고 `currentEntryId` 확정본으로 맞춤 (reset --hard @ HEAD) */
export async function discardScratchDraftToCurrent(
  meta: ScratchVersionMeta,
): Promise<CheckoutScratchVersionResult | null> {
  if (!meta.currentEntryId) return null;
  const entry = findVersionEntry(meta, meta.currentEntryId);
  if (!entry) return null;
  const editors = await loadCommittedDocument(meta, meta.currentEntryId);
  if (!editors) return null;
  clearScratchDraft();
  return { meta, entry, editors };
}

/** 확정 버전으로 checkout — versionLine 변경 없음, draft 삭제 */
export async function checkoutScratchVersionEntry(
  entryId: string,
): Promise<CheckoutScratchVersionResult | null> {
  const meta = readScratchVersionMeta();
  const entry = findVersionEntry(meta, entryId);
  if (!entry) return null;

  const editors = await getBlobByHash(entry.hash);
  if (!editors) return null;

  const nextMeta: ScratchVersionMeta = {
    v: 1,
    versionLine: meta.versionLine,
    currentEntryId: entryId,
  };

  writeScratchVersionMeta(nextMeta);
  clearScratchDraft();

  return { meta: nextMeta, entry, editors };
}
