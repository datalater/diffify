import {
  hashScratchDocument,
  scratchDocumentEquals,
} from './scratch-content-hash';
import {
  blobStorageId,
  ensureScratchProjectsReady,
  getActiveProjectId,
  projectDraftKey,
  projectMetaKey,
} from './scratch-project-registry';
import {
  readScratchShowingSource,
  writeScratchShowingSource,
} from './scratch-ui-state';
import {
  computeScratchLoadPercent,
  type ScratchLoadProgressCallback,
} from './scratch-load-progress';
import {
  defaultScratchSnapshot,
  type ScratchEditors,
  type ScratchPersistSnapshot,
} from './scratch-persist';

export type { ScratchLoadProgressCallback } from './scratch-load-progress';

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

const IDB_NAME = 'diffify-scratch';
const IDB_VERSION = 1;
const BLOB_STORE = 'blobs';

const MAX_VERSION_LINE = 50;

let dbPromise: Promise<IDBDatabase> | null = null;
let storageReadyPromise: Promise<void> | null = null;

export function resetScratchStorageModuleState(): void {
  dbPromise = null;
  storageReadyPromise = null;
}

export async function countScratchIdbBlobs(): Promise<number> {
  if (typeof indexedDB === 'undefined') return 0;
  try {
    const db = await openDatabase();
    const tx = db.transaction(BLOB_STORE, 'readonly');
    return await idbRequest(tx.objectStore(BLOB_STORE).count());
  } catch {
    return 0;
  }
}

export async function deleteScratchIndexedDb(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  resetScratchStorageModuleState();
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(IDB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(request.error ?? new Error('indexedDB delete failed'));
    request.onblocked = () => resolve();
  });
}

type BlobRecord = {
  id: string;
  hash: string;
  content: ScratchEditors;
};

function openDatabase(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE, { keyPath: 'id' });
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

async function putBlob(
  projectId: string,
  hash: string,
  document: ScratchEditors,
): Promise<void> {
  const db = await openDatabase();
  const tx = db.transaction(BLOB_STORE, 'readwrite');
  const store = tx.objectStore(BLOB_STORE);
  const record: BlobRecord = {
    id: blobStorageId(projectId, hash),
    hash,
    content: document,
  };
  await idbRequest(store.put(record));
}

async function getBlobByHash(
  projectId: string,
  hash: string,
): Promise<ScratchEditors | null> {
  try {
    const db = await openDatabase();
    const tx = db.transaction(BLOB_STORE, 'readonly');
    const store = tx.objectStore(BLOB_STORE);
    const row = (await idbRequest(store.get(blobStorageId(projectId, hash)))) as
      | (BlobRecord & { content?: ScratchEditors & { showingSource?: boolean } })
      | undefined;
    if (!row?.content) return null;
    return normalizeStoredDocument(row.content);
  } catch {
    return null;
  }
}

function readScratchVersionMeta(
  projectId = getActiveProjectId(),
): ScratchVersionMeta {
  try {
    const raw = localStorage.getItem(projectMetaKey(projectId));
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

export function writeScratchVersionMeta(
  meta: ScratchVersionMeta,
  projectId = getActiveProjectId(),
): void {
  try {
    localStorage.setItem(projectMetaKey(projectId), JSON.stringify(meta));
  } catch {
    /* quota */
  }
}

function readScratchDraft(projectId = getActiveProjectId()): ScratchEditors | null {
  try {
    const raw = localStorage.getItem(projectDraftKey(projectId));
    if (!raw) return null;
    const payload = JSON.parse(raw) as unknown;
    if (!isDraftPayload(payload)) return null;
    return draftPayloadToDocument(payload);
  } catch {
    return null;
  }
}

export function writeScratchDraft(
  document: ScratchEditors,
  projectId = getActiveProjectId(),
): void {
  try {
    localStorage.setItem(
      projectDraftKey(projectId),
      JSON.stringify(documentToDraftPayload(document)),
    );
  } catch {
    /* quota */
  }
}

export function clearScratchDraft(projectId = getActiveProjectId()): void {
  try {
    localStorage.removeItem(projectDraftKey(projectId));
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

function isDraftPayload(raw: unknown): raw is ScratchDraftPayloadV2 {
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

function pruneVersionLine(line: ScratchVersionEntry[]): ScratchVersionEntry[] {
  if (line.length <= MAX_VERSION_LINE) return line;
  return line.slice(line.length - MAX_VERSION_LINE);
}

function nextVersionLabel(lineLength: number): string {
  return `v${lineLength + 1}`;
}

export const SCRATCH_VERSION_DRAFT_VALUE = '__draft__';

export function restoredVersionLabel(
  sourceLabel: string,
  versionLineLength: number,
): string {
  return `v${versionLineLength + 1}(${sourceLabel} restored)`;
}

export type EnsureScratchStorageReadyOptions = {
  onProgress?: ScratchLoadProgressCallback;
};

export async function ensureScratchStorageReady(
  options?: EnsureScratchStorageReadyOptions,
): Promise<void> {
  const onProgress = options?.onProgress;
  if (storageReadyPromise) return storageReadyPromise;

  storageReadyPromise = (async () => {
    await ensureScratchProjectsReady();
    onProgress?.({
      phase: 'storage',
      message: '저장소 준비 중…',
      percent: computeScratchLoadPercent('storage'),
    });
    await openDatabase();
  })();

  return storageReadyPromise;
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
  projectId = getActiveProjectId(),
): Promise<ScratchEditors | null> {
  if (!entryId) return null;
  const entry = findVersionEntry(meta, entryId);
  if (!entry) return null;
  return getBlobByHash(projectId, entry.hash);
}

export type ScratchWorkspaceLoad = {
  editors: ScratchEditors;
  showingSource: boolean;
  meta: ScratchVersionMeta;
  hasDraft: boolean;
};

export type LoadScratchWorkspaceOptions = {
  onProgress?: ScratchLoadProgressCallback;
};

export async function loadScratchWorkspace(
  urlOverride: ScratchPersistSnapshot | null,
  projectId = getActiveProjectId(),
  options?: LoadScratchWorkspaceOptions,
): Promise<ScratchWorkspaceLoad> {
  await ensureScratchStorageReady({ onProgress: options?.onProgress });

  options?.onProgress?.({
    phase: 'workspace',
    message: 'draft·버전·URL state 불러오는 중…',
    percent: computeScratchLoadPercent('workspace'),
  });

  const defaultShowingSource = defaultScratchSnapshot().showingSource;

  if (urlOverride) {
    const editors: ScratchEditors = {
      sourceHead: urlOverride.sourceHead,
      sourceHtml: urlOverride.sourceHtml,
      resultHead: urlOverride.resultHead,
      resultHtml: urlOverride.resultHtml,
    };
    writeScratchDraft(editors, projectId);
    writeScratchShowingSource(urlOverride.showingSource, projectId);
    const meta = readScratchVersionMeta(projectId);
    return {
      editors,
      showingSource: urlOverride.showingSource,
      meta,
      hasDraft: true,
    };
  }

  const meta = readScratchVersionMeta(projectId);
  const showingSource = readScratchShowingSource(
    defaultShowingSource,
    projectId,
  );
  const draft = readScratchDraft(projectId);
  if (draft) {
    return { editors: draft, showingSource, meta, hasDraft: true };
  }

  const fromCurrent = await loadCommittedDocument(
    meta,
    meta.currentEntryId,
    projectId,
  );
  if (fromCurrent) {
    return { editors: fromCurrent, showingSource, meta, hasDraft: false };
  }

  const last = meta.versionLine[meta.versionLine.length - 1];
  if (last) {
    const fromLast = await getBlobByHash(projectId, last.hash);
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
    showingSource: readScratchShowingSource(defaults.showingSource, projectId),
    meta,
    hasDraft: false,
  };
}

export async function isScratchWorkspaceDirty(
  document: ScratchEditors,
  meta: ScratchVersionMeta,
  projectId = getActiveProjectId(),
): Promise<boolean> {
  if (readScratchDraft(projectId)) {
    const committed = await loadCommittedDocument(
      meta,
      meta.currentEntryId,
      projectId,
    );
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

  const committed = await loadCommittedDocument(
    meta,
    meta.currentEntryId,
    projectId,
  );
  if (!committed) return true;
  return !(await scratchDocumentEquals(document, committed));
}

export type CommitScratchVersionResult = {
  meta: ScratchVersionMeta;
  entry: ScratchVersionEntry;
};

export async function commitScratchVersion(
  document: ScratchEditors,
  projectId = getActiveProjectId(),
): Promise<CommitScratchVersionResult | null> {
  try {
    const hash = await hashScratchDocument(document);
    await putBlob(projectId, hash, document);

    const meta = readScratchVersionMeta(projectId);
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

    writeScratchVersionMeta(nextMeta, projectId);
    clearScratchDraft(projectId);

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

export async function discardScratchDraftToCurrent(
  meta: ScratchVersionMeta,
  projectId = getActiveProjectId(),
): Promise<CheckoutScratchVersionResult | null> {
  if (!meta.currentEntryId) return null;
  const entry = findVersionEntry(meta, meta.currentEntryId);
  if (!entry) return null;
  const editors = await loadCommittedDocument(
    meta,
    meta.currentEntryId,
    projectId,
  );
  if (!editors) return null;
  clearScratchDraft(projectId);
  return { meta, entry, editors };
}

export async function checkoutScratchVersionEntry(
  entryId: string,
  projectId = getActiveProjectId(),
): Promise<CheckoutScratchVersionResult | null> {
  const meta = readScratchVersionMeta(projectId);
  const entry = findVersionEntry(meta, entryId);
  if (!entry) return null;

  const editors = await getBlobByHash(projectId, entry.hash);
  if (!editors) return null;

  const nextMeta: ScratchVersionMeta = {
    v: 1,
    versionLine: meta.versionLine,
    currentEntryId: entryId,
  };

  writeScratchVersionMeta(nextMeta, projectId);
  clearScratchDraft(projectId);

  return { meta: nextMeta, entry, editors };
}

/** @deprecated use readScratchVersionMeta after ensureScratchStorageReady */
export { readScratchVersionMeta };
