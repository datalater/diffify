export type ScratchLoadPhase =
  | 'projects'
  | 'url-state'
  | 'storage'
  | 'workspace'
  | 'dirty'
  | 'error';

export type ScratchLoadProgress = {
  phase: ScratchLoadPhase;
  message: string;
  /** 0–100; omitted when indeterminate */
  percent?: number;
  indeterminate?: boolean;
};

export type ScratchLoadProgressCallback = (progress: ScratchLoadProgress) => void;

const SEGMENT_END: Record<Exclude<ScratchLoadPhase, 'error'>, number> = {
  projects: 10,
  'url-state': 20,
  storage: 35,
  workspace: 90,
  dirty: 100,
};

export function computeScratchLoadPercent(
  phase: Exclude<ScratchLoadPhase, 'error'>,
): number {
  return SEGMENT_END[phase];
}

export function initialScratchLoadProgress(): ScratchLoadProgress {
  return {
    phase: 'projects',
    message: '워크스페이스를 불러오는 중…',
    percent: 0,
    indeterminate: true,
  };
}
