import { useEffect, useRef, type RefObject } from 'react';

/** 요소 offsetHeight를 ResizeObserver로 보고 (substrate 스택 높이용) */
export function useElementOuterHeight(
  onHeight: ((height: number) => void) | undefined,
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!onHeight) return;
    const el = ref.current;
    if (!el) return;

    const report = () => {
      onHeight(el.offsetHeight);
    };

    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    return () => observer.disconnect();
  }, [onHeight]);

  return ref;
}
