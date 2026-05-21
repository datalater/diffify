import type { ReactNode } from 'react';
import type { ScratchHtmlLayer } from '../lib/scratch-html-io';
import type {
  ScratchEditors,
  ScratchPersistedContent,
} from '../lib/scratch-persist';
import type { ScratchProjectRegistry } from '../lib/scratch-project-registry';
import { ScratchLocalStorageMenu } from './ScratchLocalStorageMenu';
import { ScratchProjectControls } from './ScratchProjectControls';
import { ScratchShareMenu } from './ScratchShareMenu';
import { ScratchVersionControls } from './ScratchVersionControls';
import type { ScratchVersionMeta } from '../lib/scratch-version-storage';

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
  versionMeta: ScratchVersionMeta;
  versionDirty: boolean;
  versionControlsDisabled?: boolean;
  onCreateVersion: () => void;
  onSelectVersionValue: (value: string) => void;
  projectRegistry: ScratchProjectRegistry | null;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
  workspaceStorageDisabled?: boolean;
  onWorkspaceStorageCleared: () => void | Promise<void>;
  trailing?: ReactNode;
};

export function ScratchTopBar({
  status,
  persistContent,
  editors,
  onCopyShareUrl,
  onImportLayer,
  onNotify,
  versionMeta,
  versionDirty,
  versionControlsDisabled,
  onCreateVersion,
  onSelectVersionValue,
  projectRegistry,
  onSelectProject,
  onCreateProject,
  workspaceStorageDisabled,
  onWorkspaceStorageCleared,
  trailing,
}: ScratchTopBarProps) {
  return (
    <nav className="border-b border-[#30363d] bg-[#161b22] font-sans text-[13px] text-[#e6edf3]">
      <div className="flex w-full flex-wrap items-center gap-x-2 gap-y-2 px-4 py-2 min-h-[2.75rem]">
        <span className="mr-1 shrink-0 text-sm font-semibold tracking-tight text-[#e6edf3]">
          diffify scratch
        </span>

        {projectRegistry ? (
          <div
            className="flex shrink-0 items-center gap-1"
            role="group"
            aria-label="워크스페이스"
          >
            <ScratchProjectControls
              registry={projectRegistry}
              disabled={versionControlsDisabled}
              onSelectProject={onSelectProject}
              onCreateProject={onCreateProject}
            />
            <ScratchVersionControls
              meta={versionMeta}
              dirty={versionDirty}
              disabled={versionControlsDisabled}
              onCreateVersion={onCreateVersion}
              onSelectValue={onSelectVersionValue}
            />
          </div>
        ) : null}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ScratchShareMenu
            persistContent={persistContent}
            editors={editors}
            onCopyShareUrl={onCopyShareUrl}
            onImportLayer={onImportLayer}
            onNotify={onNotify}
          />
          <ScratchLocalStorageMenu
            disabled={workspaceStorageDisabled}
            onNotify={onNotify}
            onCleared={onWorkspaceStorageCleared}
          />
          {trailing}
        </div>
      </div>
      <p className="flex items-start gap-2 border-t border-[#30363d] bg-[#0d1117] px-4 py-2 text-xs leading-snug text-[#8b949e]">
        <span className="shrink-0" aria-hidden>
          📢
        </span>
        <span className="min-w-0 flex-1">{status}</span>
      </p>
    </nav>
  );
}
