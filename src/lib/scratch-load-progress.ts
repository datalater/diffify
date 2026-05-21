export type ScratchLoadPhase =
  | 'projects'
  | 'url-state'
  | 'migrate-blobs'
  | 'storage'
  | 'workspace'
  | 'dirty'
  | 'error';

export type ScratchLoadProgress = {
  phase: ScratchLoadPhase;
  message: string;
  /** 0–100; omitted when indeterminate */
  percent?: number;
  done?: number;
  total?: number;
  indeterminate?: boolean;
};

export type ScratchLoadProgressCallback = (progress: ScratchLoadProgress) => void;

const SEGMENT_END: Record<Exclude<ScratchLoadPhase, 'error'>, number> = {
  projects: 8,
  'url-state': 15,
  'migrate-blobs': 70,
  storage: 78,
  workspace: 92,
  dirty: 100,
};

const SEGMENT_START: Record<Exclude<ScratchLoadPhase, 'error'>, number> = {
  projects: 0,
  'url-state': 8,
  'migrate-blobs': 15,
  storage: 70,
  workspace: 78,
  dirty: 92,
};

export function computeScratchLoadPercent(
  phase: Exclude<ScratchLoadPhase, 'error'>,
  migrate?: { done: number; total: number },
): number {
  const start = SEGMENT_START[phase];
  const end = SEGMENT_END[phase];
  const size = end - start;

  if (phase === 'migrate-blobs' && migrate && migrate.total > 0) {
    const ratio = Math.min(1, Math.max(0, migrate.done / migrate.total));
    return Math.round(start + size * ratio);
  }

  return end;
}

export function initialScratchLoadProgress(): ScratchLoadProgress {
  return {
    phase: 'projects',
    message: '워크스페이스를 불러오는 중…',
    percent: 0,
    indeterminate: true,
  };
}
