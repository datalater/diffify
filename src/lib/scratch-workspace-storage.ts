import {
  projectDraftKey,
  projectMetaKey,
  resetScratchProjectsModuleState,
  tryReadProjectRegistry,
  type ScratchProjectRegistry,
} from './scratch-project-registry';
import {
  countScratchIdbBlobs,
  deleteScratchIndexedDb,
  resetScratchStorageModuleState,
  type ScratchVersionMeta,
} from './scratch-version-storage';

const SCRATCH_LS_PREFIX = 'diffify-scratch';

export type ScratchWorkspaceStorageInfo = {
  registry: ScratchProjectRegistry | null;
  projectCount: number;
  versionEntryCount: number;
  activeProjectId: string | null;
  activeProjectName: string | null;
  activeHasDraft: boolean;
  localStorageBytes: number;
  localStorageKeyCount: number;
  indexedDbBlobCount: number;
};

export function formatWorkspaceStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function readVersionMeta(projectId: string): ScratchVersionMeta {
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

function hasDraft(projectId: string): boolean {
  try {
    return localStorage.getItem(projectDraftKey(projectId)) !== null;
  } catch {
    return false;
  }
}

export function listScratchWorkspaceLocalStorageKeys(): string[] {
  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SCRATCH_LS_PREFIX)) {
        keys.push(key);
      }
    }
  } catch {
    /* ignore */
  }
  return keys;
}

function measureLocalStorage(keys: string[]): {
  localStorageBytes: number;
  localStorageKeyCount: number;
} {
  let bytes = 0;
  for (const key of keys) {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) bytes += key.length + value.length;
    } catch {
      /* ignore */
    }
  }
  return { localStorageBytes: bytes, localStorageKeyCount: keys.length };
}

export async function fetchScratchWorkspaceStorageInfo(): Promise<ScratchWorkspaceStorageInfo> {
  const registry = tryReadProjectRegistry();
  const keys = listScratchWorkspaceLocalStorageKeys();
  const { localStorageBytes, localStorageKeyCount } = measureLocalStorage(keys);
  const indexedDbBlobCount = await countScratchIdbBlobs();

  if (!registry || registry.projects.length === 0) {
    return {
      registry: null,
      projectCount: 0,
      versionEntryCount: 0,
      activeProjectId: null,
      activeProjectName: null,
      activeHasDraft: false,
      localStorageBytes,
      localStorageKeyCount,
      indexedDbBlobCount,
    };
  }

  let versionEntryCount = 0;
  for (const project of registry.projects) {
    versionEntryCount += readVersionMeta(project.id).versionLine.length;
  }

  const active = registry.projects.find(
    (p) => p.id === registry.activeProjectId,
  );

  return {
    registry,
    projectCount: registry.projects.length,
    versionEntryCount,
    activeProjectId: registry.activeProjectId,
    activeProjectName: active?.name ?? null,
    activeHasDraft: hasDraft(registry.activeProjectId),
    localStorageBytes,
    localStorageKeyCount,
    indexedDbBlobCount,
  };
}

export async function clearAllScratchWorkspaceStorage(): Promise<void> {
  const keys = listScratchWorkspaceLocalStorageKeys();
  for (const key of keys) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
  await deleteScratchIndexedDb();
  resetScratchStorageModuleState();
  resetScratchProjectsModuleState();
}
