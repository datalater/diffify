import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { NAV_PANEL_CLASS } from './scratch-github-ui';

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
          className={`${NAV_PANEL_CLASS} ${panelClassName ?? ''}`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

export { NAV_MENU_TRIGGER_CLASS } from './scratch-github-ui';

export function NavMenuChevron({ open }: { open: boolean }) {
  return (
    <span
      className={`text-[#8b949e] transition ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <svg className="size-3" viewBox="0 0 16 16" fill="currentColor">
        <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
      </svg>
    </span>
  );
}
