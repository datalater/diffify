import type { ScratchLoadProgress } from '../lib/scratch-load-progress';

export function ScratchLoadOverlay({
  progress,
}: {
  progress: ScratchLoadProgress;
}) {
  const { message, percent, done, total, indeterminate } = progress;
  const showDeterminate =
    !indeterminate && typeof percent === 'number' && Number.isFinite(percent);
  const showCounts =
    typeof done === 'number' &&
    typeof total === 'number' &&
    total > 0;

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/85 backdrop-blur-[2px]"
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-labelledby="scratch-load-title"
      aria-describedby="scratch-load-desc"
    >
      <div className="mx-4 w-full max-w-md rounded-lg border border-slate-300 bg-white px-6 py-5 shadow-lg">
        <div
          className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700"
          aria-hidden
        />
        <p
          id="scratch-load-title"
          className="text-center text-sm font-medium text-slate-900"
        >
          {message}
        </p>
        {showCounts ? (
          <p
            id="scratch-load-desc"
            className="mt-1 text-center text-xs text-slate-600"
          >
            {done} / {total}
          </p>
        ) : (
          <p id="scratch-load-desc" className="sr-only">
            불러오는 중
          </p>
        )}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={showDeterminate ? percent : undefined}
          aria-valuetext={
            showDeterminate ? `${percent}%` : '진행 중'
          }
        >
          {showDeterminate ? (
            <div
              className="h-full rounded-full bg-slate-700 transition-[width] duration-200 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
            />
          ) : (
            <div className="scratch-load-indeterminate h-full w-1/3 rounded-full bg-slate-600" />
          )}
        </div>
        {showDeterminate ? (
          <p className="mt-2 text-center text-xs tabular-nums text-slate-500">
            {percent}%
          </p>
        ) : null}
      </div>
      <style>{`
        @keyframes scratch-load-slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        .scratch-load-indeterminate {
          animation: scratch-load-slide 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
