import type {
  ScratchCompareHealth,
  ScratchCompareResult,
  ScratchLatestCompareResponse,
  ScratchStorageInfo,
} from './scratch-compare-types';

export function scratchViewportKey(
  width: number,
  height: number,
  deviceScaleFactor = 1,
): string {
  const base = `${Math.round(width)}x${Math.round(height)}`;
  if (deviceScaleFactor <= 1) return base;
  const scale =
    Number.isInteger(deviceScaleFactor) ?
      String(deviceScaleFactor)
    : String(deviceScaleFactor).replace('.', '_');
  return `${base}@${scale}x`;
}

export async function fetchScratchCompareHealth(): Promise<ScratchCompareHealth> {
  const res = await fetch('/__diffify__/health');
  const body = (await res.json()) as ScratchCompareHealth;
  return {
    ok: body.ok,
    message: body.message,
    captureDeviceScaleFactor:
      typeof body.captureDeviceScaleFactor === 'number' ?
        body.captureDeviceScaleFactor
      : 1,
  };
}

export async function installScratchCompareBrowsers(): Promise<{
  ok: boolean;
  message: string;
}> {
  const res = await fetch('/__diffify__/install-browsers', { method: 'POST' });
  return (await res.json()) as { ok: boolean; message: string };
}

export async function postScratchCompare(body: {
  projectId: string;
  viewportKey: string;
  width: number;
  height: number;
  sourceDocument: string;
  resultDocument: string;
}): Promise<ScratchCompareResult> {
  const res = await fetch('/__diffify__/compare', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await res.json()) as ScratchCompareResult | { error?: string };
  if (!res.ok || !('pixelDiff' in payload)) {
    throw new Error(
      'error' in payload && typeof payload.error === 'string' ?
        payload.error
      : 'Compare request failed.',
    );
  }
  return payload;
}

export async function fetchLatestScratchCompare(
  projectId: string,
  viewportKey: string,
): Promise<ScratchLatestCompareResponse> {
  const res = await fetch(
    `/__diffify__/latest-compare?projectId=${encodeURIComponent(projectId)}&viewportKey=${encodeURIComponent(viewportKey)}`,
  );
  if (!res.ok) {
    const body = (await res.json()) as { error?: string };
    throw new Error(body.error ?? 'Failed to load latest compare.');
  }
  return (await res.json()) as ScratchLatestCompareResponse;
}

export async function fetchScratchStorageInfo(): Promise<ScratchStorageInfo> {
  const res = await fetch('/__diffify__/storage');
  if (!res.ok) {
    throw new Error('Failed to list diffify storage.');
  }
  return (await res.json()) as ScratchStorageInfo;
}

export async function clearScratchCaptures(): Promise<void> {
  const res = await fetch('/__diffify__/clear-captures', { method: 'POST' });
  const body = (await res.json()) as { ok?: boolean; error?: string };
  if (!res.ok || !body.ok) {
    throw new Error(body.error ?? 'Failed to clear captures.');
  }
}

export function formatStorageBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** 캡처 PNG를 CSS 논리 px로 표시할 때 사용 (요소 스크린샷 실측 ÷ DPR) */
export function captureDisplaySize(result: ScratchCompareResult): {
  width: number;
  height: number;
} {
  const scale = result.deviceScaleFactor ?? 1;
  const pixelW = Math.max(
    result.sourceCapture.width,
    result.resultCapture.width,
    result.pixelDiff.width,
  );
  const pixelH = Math.max(
    result.sourceCapture.height,
    result.resultCapture.height,
    result.pixelDiff.height,
  );
  return {
    width: Math.round(pixelW / scale),
    height: Math.round(pixelH / scale),
  };
}
