import type {
  ScratchCompareResult,
  ScratchLatestCompareResponse,
  ScratchStorageInfo,
} from './scratch-compare-types';

export function scratchViewportKey(width: number, height: number): string {
  return `${Math.round(width)}x${Math.round(height)}`;
}

export async function fetchScratchCompareHealth(): Promise<{
  ok: boolean;
  message: string;
}> {
  const res = await fetch('/__diffify__/health');
  return (await res.json()) as { ok: boolean; message: string };
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
      'error' in payload && typeof payload.error === 'string'
        ? payload.error
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
