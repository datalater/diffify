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

export type ScratchCompareFeatureMode = 'overlay' | 'pixel-diff';

export type ScratchOverlayStackMode = 'live' | 'capture';
