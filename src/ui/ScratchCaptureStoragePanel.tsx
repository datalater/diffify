import { useCallback, useEffect, useState } from 'react';
import {
  clearScratchCaptures,
  fetchScratchStorageInfo,
  formatStorageBytes,
} from '../lib/scratch-compare-api';
import type { ScratchStorageInfo } from '../lib/scratch-compare-types';

export function ScratchCaptureStoragePanel({
  refreshToken,
  compareBusy,
  onNotify,
  onCleared,
}: {
  refreshToken: number;
  compareBusy: boolean;
  onNotify: (message: string) => void;
  onCleared: () => void;
}) {
  const [storageInfo, setStorageInfo] = useState<ScratchStorageInfo | null>(
    null,
  );
  const [storageLoading, setStorageLoading] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);

  const refresh = useCallback(async () => {
    setStorageLoading(true);
    setStorageError(null);
    try {
      setStorageInfo(await fetchScratchStorageInfo());
    } catch (error) {
      setStorageError(
        error instanceof Error ? error.message : '저장소 집계 실패',
      );
    } finally {
      setStorageLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh, refreshToken]);

  const handleClear = async () => {
    if (
      !window.confirm(
        '`.diffify` 폴더의 캡처(PNG·summary)를 전부 삭제한다. 되돌릴 수 없다. 계속할까요?',
      )
    ) {
      return;
    }
    try {
      setIsClearing(true);
      await clearScratchCaptures();
      onCleared();
      await refresh();
      onNotify('로컬 캡처 저장소를 비웠다.');
    } catch (error) {
      onNotify(
        error instanceof Error ? error.message : '캡처 삭제에 실패했다.',
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <details className="group mt-3 rounded border border-slate-300 bg-white text-xs shadow-sm">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold text-slate-800 marker:content-none [&::-webkit-details-marker]:hidden">
        <span
          className="inline-block w-3 shrink-0 text-center text-slate-400 transition-transform group-open:rotate-90"
          aria-hidden
        >
          ▸
        </span>
        <span>로컬 캡처 저장소</span>
        <span className="ml-auto min-w-0 truncate text-[11px] font-normal text-slate-500">
          {storageLoading
            ? '집계 중…'
            : storageInfo
              ? `${formatStorageBytes(storageInfo.totalBytes)} · run ${storageInfo.runs.length}개`
              : '펼쳐서 상세'}
        </span>
      </summary>
      <div className="space-y-3 border-t border-slate-200 px-4 py-3">
        <p className="text-[11px] leading-relaxed text-slate-600">
          프로젝트·미리보기 크기(뷰포트)를 바꾸면 해당 폴더의 최신 run을
          자동으로 불러온다. <code className="rounded bg-slate-100 px-1">npm run dev</code> 에서만
          동작한다.
        </p>
        <div>
          루트{' '}
          <code className="rounded bg-slate-100 px-2 py-1 text-[11px] break-all">
            {storageInfo?.root ?? '(집계 대기)'}
          </code>
        </div>
        {storageError ? (
          <p className="text-red-700">{storageError}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={storageLoading}
            className="rounded border border-slate-400 bg-slate-100 px-2.5 py-1.5 text-[12px] font-semibold text-slate-800 hover:bg-slate-200 disabled:opacity-50"
            onClick={() => void refresh()}
          >
            {storageLoading ? '집계 중…' : '용량 새로고침'}
          </button>
          <button
            type="button"
            disabled={compareBusy || isClearing || storageLoading}
            className="rounded border border-red-300 bg-red-50 px-2.5 py-1.5 text-[12px] font-semibold text-red-800 hover:bg-red-100 disabled:opacity-50"
            onClick={() => void handleClear()}
          >
            {isClearing ? '삭제 중…' : '캡처 비우기'}
          </button>
        </div>
        {storageInfo && storageInfo.runs.length > 0 ? (
          <div className="max-h-48 overflow-auto rounded border border-slate-200">
            <table className="w-full border-separate border-spacing-0 text-left text-[11px]">
              <thead className="sticky top-0 bg-white text-slate-800 shadow-[0_1px_0_0_rgb(203_213_225)]">
                <tr>
                  <th className="border-b border-slate-300 px-2 py-1.5 font-semibold">
                    프로젝트
                  </th>
                  <th className="border-b border-slate-300 px-2 py-1.5 font-semibold">
                    뷰포트
                  </th>
                  <th className="border-b border-slate-300 px-2 py-1.5 font-semibold">
                    run
                  </th>
                  <th className="border-b border-slate-300 px-2 py-1.5 font-semibold">
                    크기
                  </th>
                </tr>
              </thead>
              <tbody>
                {storageInfo.runs.map((run) => (
                  <tr key={`${run.projectId}-${run.viewportKey}-${run.runId}`}>
                    <td className="border-b border-slate-100 px-2 py-1 font-mono text-[10px]">
                      {run.projectId.slice(0, 8)}…
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1 font-mono">
                      {run.viewportKey}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1 font-mono text-[10px]">
                      {run.runId}
                    </td>
                    <td className="border-b border-slate-100 px-2 py-1 tabular-nums">
                      {formatStorageBytes(run.bytes)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </details>
  );
}
