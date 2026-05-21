import type { ReactNode } from 'react';

export const PANEL_SELECT_WRAP_CLASS = 'relative flex w-full items-center';

export const PANEL_SELECT_CLASS =
  'w-full min-w-0 cursor-pointer appearance-none rounded-md border border-[#30363d] bg-[#0d1117] py-1.5 pl-2.5 pr-8 text-xs font-medium text-[#e6edf3] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#388bfd] disabled:cursor-not-allowed disabled:text-[#484f58]';

function PanelSelectChevron() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-2.5 size-3 -translate-y-1/2 text-[#8b949e]"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
    </svg>
  );
}

export function ScratchPanelSelect({
  id,
  label,
  disabled,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  disabled?: boolean;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-[11px] font-medium text-[#8b949e]">
        {label}
      </label>
      <div className={PANEL_SELECT_WRAP_CLASS}>
        <select
          id={id}
          className={PANEL_SELECT_CLASS}
          disabled={disabled}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <PanelSelectChevron />
      </div>
    </div>
  );
}
