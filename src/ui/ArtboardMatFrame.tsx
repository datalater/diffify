import type { CSSProperties, ReactNode } from 'react';

/** Tailwind p-6 — 아트보드 매트 상하 패딩 합 (스테이지 높이 계산용) */
export const ARTBOARD_MAT_VERTICAL_PAD_PX = 48;

/** 코드·캡처 preview 공통 — slate 매트 + 흰 아트보드 */
export const ARTBOARD_MAT_OUTER_CLASS =
  'inline-block max-w-full rounded-b-md bg-slate-200 p-6';

export const ARTBOARD_MAT_SURFACE_CLASS =
  'relative bg-white shadow-sm ring-1 ring-slate-300/90';

export function ArtboardMatShell({
  children,
  innerClassName = 'inline-block max-w-full',
  innerStyle,
}: {
  children: ReactNode;
  innerClassName?: string;
  innerStyle?: CSSProperties;
}) {
  return (
    <div className={ARTBOARD_MAT_OUTER_CLASS}>
      <div
        className={`${ARTBOARD_MAT_SURFACE_CLASS} ${innerClassName}`}
        style={innerStyle}
      >
        {children}
      </div>
    </div>
  );
}

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
    <ArtboardMatShell
      innerClassName="relative"
      innerStyle={{ width: `${width}px`, height: `${height}px` }}
    >
      {children}
    </ArtboardMatShell>
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
        className={`${ARTBOARD_MAT_SURFACE_CLASS} grid min-h-80 place-items-center rounded-sm p-8 text-sm text-slate-600`}
        style={{ minWidth: `${minWidth}px` }}
      >
        {children}
      </div>
    </div>
  );
}
