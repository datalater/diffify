import type { ReactNode } from 'react';

/** iframe 뷰포트 주변 아트보드 매트 — 흰 콘텐츠와 preview 패널 경계 구분 */
export function ArtboardMatFrame({
  width,
  height,
  children,
}: {
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="inline-block max-w-full rounded-b-md bg-slate-200 p-6">
      <div
        className="relative bg-white shadow-sm ring-1 ring-slate-300/90"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        {children}
      </div>
    </div>
  );
}

export function ArtboardMatEmpty({
  children,
  minWidth = 320,
}: {
  children: ReactNode;
  minWidth?: number;
}) {
  return (
    <div className="inline-block max-w-full rounded-md bg-slate-200 p-6">
      <div
        className="grid min-h-80 place-items-center rounded-sm bg-white p-8 text-sm text-slate-600 shadow-sm ring-1 ring-slate-300/90"
        style={{ minWidth: `${minWidth}px` }}
      >
        {children}
      </div>
    </div>
  );
}
