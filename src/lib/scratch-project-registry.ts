const REGISTRY_KEY = 'diffify-scratch-projects';

const LEGACY_META_KEY = 'diffify-scratch-meta';
const LEGACY_DRAFT_KEY = 'diffify-scratch-draft';
const LEGACY_UI_KEY = 'diffify-scratch-ui';

export type ScratchProjectSummary = {
  id: string;
  name: string;
  createdAt: number;
};

export type ScratchProjectRegistry = {
  v: 1;
  activeProjectId: string;
  projects: ScratchProjectSummary[];
};

let migrateProjectsPromise: Promise<ScratchProjectRegistry> | null = null;

function readRegistryRaw(): ScratchProjectRegistry | null {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ScratchProjectRegistry;
    if (parsed.v !== 1 || !Array.isArray(parsed.projects)) return null;
    if (typeof parsed.activeProjectId !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeProjectRegistry(registry: ScratchProjectRegistry): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
  } catch {
    /* quota */
  }
}

export function defaultAutoProjectName(index: number): string {
  return index === 1 ? '기본 프로젝트' : `프로젝트 ${index}`;
}

function createProjectSummary(name: string): ScratchProjectSummary {
  return {
    id: crypto.randomUUID(),
    name: name.trim() || '새 프로젝트',
    createdAt: Date.now(),
  };
}

function copyLegacyKey(from: string, to: string): void {
  const value = localStorage.getItem(from);
  if (value !== null) {
    localStorage.setItem(to, value);
    localStorage.removeItem(from);
  }
}

export function projectMetaKey(projectId: string): string {
  return `diffify-scratch:${projectId}:meta`;
}

export function projectDraftKey(projectId: string): string {
  return `diffify-scratch:${projectId}:draft`;
}

export function projectUiKey(projectId: string): string {
  return `diffify-scratch:${projectId}:ui`;
}

export function blobStorageId(projectId: string, hash: string): string {
  return `${projectId}:${hash}`;
}

export function readProjectRegistry(): ScratchProjectRegistry {
  const raw = readRegistryRaw();
  if (!raw || raw.projects.length === 0) {
    throw new Error(
      'ensureScratchProjectsReady must run before readProjectRegistry',
    );
  }
  return raw;
}

export function getActiveProjectId(): string {
  return readProjectRegistry().activeProjectId;
}

export function getActiveProject(): ScratchProjectSummary {
  const registry = readProjectRegistry();
  const found = registry.projects.find((p) => p.id === registry.activeProjectId);
  if (!found) return registry.projects[0]!;
  return found;
}

export function setActiveProjectId(projectId: string): ScratchProjectRegistry {
  const registry = readProjectRegistry();
  if (!registry.projects.some((p) => p.id === projectId)) {
    return registry;
  }
  const next = { ...registry, activeProjectId: projectId };
  writeProjectRegistry(next);
  return next;
}

export function createScratchProject(name: string): ScratchProjectRegistry {
  const registry = readProjectRegistry();
  const project = createProjectSummary(
    name.trim() || defaultAutoProjectName(registry.projects.length + 1),
  );
  const next: ScratchProjectRegistry = {
    v: 1,
    activeProjectId: project.id,
    projects: [...registry.projects, project],
  };
  writeProjectRegistry(next);
  return next;
}

export function renameScratchProject(
  projectId: string,
  name: string,
): ScratchProjectRegistry {
  const registry = readProjectRegistry();
  const trimmed = name.trim();
  if (!trimmed) return registry;
  const next: ScratchProjectRegistry = {
    ...registry,
    projects: registry.projects.map((p) =>
      p.id === projectId ? { ...p, name: trimmed } : p,
    ),
  };
  writeProjectRegistry(next);
  return next;
}

/** 전역 localStorage 키 → 첫 프로젝트 스코프 (IDB는 version-storage에서) */
export async function ensureScratchProjectsReady(): Promise<ScratchProjectRegistry> {
  if (migrateProjectsPromise) return migrateProjectsPromise;

  migrateProjectsPromise = (async () => {
    const existing = readRegistryRaw();
    if (existing && existing.projects.length > 0) {
      const activeExists = existing.projects.some(
        (p) => p.id === existing.activeProjectId,
      );
      if (activeExists) return existing;
    }

    const project = createProjectSummary(
      existing?.projects[0]?.name ?? defaultAutoProjectName(1),
    );
    const projectId = existing?.projects[0]?.id ?? project.id;
    const summary: ScratchProjectSummary = existing?.projects[0] ?? {
      ...project,
      id: projectId,
    };

    copyLegacyKey(LEGACY_META_KEY, projectMetaKey(projectId));
    copyLegacyKey(LEGACY_DRAFT_KEY, projectDraftKey(projectId));
    copyLegacyKey(LEGACY_UI_KEY, projectUiKey(projectId));

    const registry: ScratchProjectRegistry = {
      v: 1,
      activeProjectId: projectId,
      projects: [summary],
    };
    writeProjectRegistry(registry);
    return registry;
  })();

  return migrateProjectsPromise;
}
