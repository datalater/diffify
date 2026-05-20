import type { ReactNode } from 'react';
import type { ScratchHtmlLayer } from '../lib/scratch-html-io';
import type {
  ScratchEditors,
  ScratchPersistedContent,
} from '../lib/scratch-persist';
import { ScratchShareMenu } from './ScratchShareMenu';

export type ScratchTopBarProps = {
  status: string;
  persistContent: ScratchPersistedContent;
  editors: ScratchEditors;
  onCopyShareUrl: () => void | Promise<void>;
  onImportLayer: (
    layer: ScratchHtmlLayer,
    parts: { head: string; bodyHtml: string },
  ) => void;
  onNotify: (message: string) => void;
  trailing?: ReactNode;
};

export function ScratchTopBar({
  status,
  persistContent,
  editors,
  onCopyShareUrl,
  onImportLayer,
  onNotify,
  trailing,
}: ScratchTopBarProps) {
  return (
    <nav className="border-b border-slate-700 bg-slate-800 font-mono text-[13px] text-slate-200 shadow-sm">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-slate-600/80 px-4 py-2.5">
        <span className="text-[14px] font-semibold tracking-tight text-slate-100">
          diffify scratch
        </span>

        <ScratchShareMenu
          persistContent={persistContent}
          editors={editors}
          onCopyShareUrl={onCopyShareUrl}
          onImportLayer={onImportLayer}
          onNotify={onNotify}
        />

        {trailing}
      </div>
      <p className="flex items-start gap-2 px-4 py-2 font-sans text-xs leading-snug text-slate-300">
        <span className="shrink-0" aria-hidden>
          📢
        </span>
        <span className="min-w-0 flex-1">{status}</span>
      </p>
    </nav>
  );
}
