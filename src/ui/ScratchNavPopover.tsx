import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

const PANEL_CLASS =
  'absolute left-0 top-full z-50 mt-1 min-w-[12rem] rounded border border-slate-600 bg-slate-800 py-2 shadow-lg';

export function ScratchNavPopover({
  trigger,
  children,
  panelClassName,
}: {
  trigger: (state: {
    open: boolean;
    toggle: () => void;
    triggerId: string;
    panelId: string;
  }) => ReactNode;
  children: ReactNode;
  panelClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerId = useId();
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((prev) => !prev), []);

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target as Node)
      ) {
        close();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  return (
    <div ref={rootRef} className="relative inline-flex">
      {trigger({ open, toggle, triggerId, panelId })}
      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-labelledby={triggerId}
          className={`${PANEL_CLASS} ${panelClassName ?? ''}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export const NAV_MENU_TRIGGER_CLASS =
  'inline-flex cursor-pointer items-center gap-1.5 rounded border border-slate-500 bg-slate-700 px-2.5 py-1.5 text-[12px] font-semibold text-slate-100 transition hover:bg-slate-600';

export function NavMenuChevron({ open }: { open: boolean }) {
  return (
    <span
      className={`text-[10px] text-slate-400 transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      ▾
    </span>
  );
}
