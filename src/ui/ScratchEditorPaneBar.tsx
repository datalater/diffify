import type { ScratchPaneId, ScratchPaneVisibility } from './scratch-pane-visibility';

const PANE_TOGGLE_STYLE: Record<
  ScratchPaneId,
  { activeBackgroundColor: string; activeColor: string }
> = {
  source: { activeBackgroundColor: '#d97706', activeColor: '#ffffff' },
  result: { activeBackgroundColor: '#059669', activeColor: '#ffffff' },
  preview: { activeBackgroundColor: '#2563eb', activeColor: '#ffffff' },
};

const PANE_LABEL: Record<ScratchPaneId, string> = {
  source: 'Source',
  result: 'Result',
  preview: 'Preview',
};

const TOGGLE_BTN_CLASS =
  'cursor-pointer px-2.5 py-1 text-[11px] font-medium leading-tight transition focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-400';

export function ScratchPaneEmptyState() {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-12">
      <p className="max-w-md text-center font-sans text-sm leading-snug text-slate-500">
        Source, Result, Preview 중 하나 이상을 선택하면 내용이 표시됩니다.
      </p>
    </div>
  );
}

export function ScratchEditorPaneBar({
  visibility,
  onTogglePane,
}: {
  visibility: ScratchPaneVisibility;
  onTogglePane: (pane: ScratchPaneId) => void;
}) {
  return (
    <div className="shrink-0 border-b border-slate-600/80 bg-slate-800 px-4 py-1.5 font-mono">
      <div
        className="inline-flex overflow-hidden rounded border border-slate-600"
        role="group"
        aria-label="표시할 패널"
      >
        {(['source', 'result', 'preview'] as const).map((pane) => {
          const active = visibility[pane];
          const { activeBackgroundColor, activeColor } = PANE_TOGGLE_STYLE[pane];
          return (
            <button
              key={pane}
              type="button"
              aria-pressed={active}
              onClick={() => onTogglePane(pane)}
              className={TOGGLE_BTN_CLASS}
              style={
                active
                  ? {
                      backgroundColor: activeBackgroundColor,
                      color: activeColor,
                    }
                  : {
                      backgroundColor: 'rgb(51 65 85)',
                      color: 'rgb(148 163 184)',
                    }
              }
            >
              {PANE_LABEL[pane]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
