export interface CaptureArtifact {
  imageUrl: string;
  width: number;
  height: number;
  capturedAt: string;
}

export interface PixelDiffResult {
  imageUrl: string;
  width: number;
  height: number;
  diffPixels: number;
  diffPercent: string;
}

export interface ScratchCompareResult {
  projectId: string;
  viewportKey: string;
  runId: string;
  outputDir: string;
  viewport: { width: number; height: number };
  deviceScaleFactor?: number;
  sourceCapture: CaptureArtifact;
  resultCapture: CaptureArtifact;
  pixelDiff: PixelDiffResult;
  summaryUrl: string;
}

export type ScratchLatestCompareResponse =
  | { found: false }
  | ({ found: true } & ScratchCompareResult);

export interface ScratchStorageRun {
  projectId: string;
  viewportKey: string;
  runId: string;
  bytes: number;
  capturedAt: string | null;
}

export interface ScratchStorageInfo {
  root: string;
  totalBytes: number;
  runs: ScratchStorageRun[];
}

/** Preview 패널 1차: iframe 코드 vs Playwright PNG */
export type ScratchPreviewSubstrate = 'code' | 'capture';

/** 캡처 preview 안에서만: 겹침 vs diff 리포트 */
export type ScratchCaptureViewMode = 'overlay' | 'pixel-diff';

export type ScratchCompareHealth = {
  ok: boolean;
  message: string;
  captureDeviceScaleFactor: number;
};
