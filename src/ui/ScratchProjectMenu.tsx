import type { ScratchProjectRegistry } from '../lib/scratch-project-registry';
import { ScratchPanelSelect } from './ScratchPanelSelect';
import { NavMenuChevron, ScratchNavPopover } from './ScratchNavPopover';
import { NAV_MENU_ITEM_CLASS, NAV_MENU_TRIGGER_CLASS } from './scratch-github-ui';

const PANEL_CLASS = 'min-w-[14rem] px-3 py-2.5 font-sans';

function projectTriggerLabel(registry: ScratchProjectRegistry): string {
  const active = registry.projects.find((p) => p.id === registry.activeProjectId);
  return active?.name ?? '프로젝트';
}

export function ScratchProjectMenu({
  registry,
  disabled,
  onSelectProject,
  onCreateProject,
}: {
  registry: ScratchProjectRegistry;
  disabled?: boolean;
  onSelectProject: (projectId: string) => void;
  onCreateProject: () => void;
}) {
  const label = projectTriggerLabel(registry);

  return (
    <ScratchNavPopover
      align="start"
      panelClassName={PANEL_CLASS}
      trigger={({ open, toggle, triggerId, panelId }) => (
        <button
          id={triggerId}
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-controls={open ? panelId : undefined}
          className={`${NAV_MENU_TRIGGER_CLASS} max-w-[12rem]`}
          title={`프로젝트: ${label}`}
        >
          <span className="min-w-0 truncate">{label}</span>
          <NavMenuChevron open={open} />
        </button>
      )}
    >
      <div className="flex flex-col gap-2">
        <ScratchPanelSelect
          id="scratch-project-select-menu"
          label="프로젝트"
          disabled={disabled}
          value={registry.activeProjectId}
          onChange={onSelectProject}
        >
          {registry.projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
              className="bg-[#161b22] text-[#e6edf3]"
            >
              {project.name}
            </option>
          ))}
        </ScratchPanelSelect>
        <button
          type="button"
          className={`${NAV_MENU_ITEM_CLASS} justify-center rounded-md border border-[#30363d] bg-[#21262d]`}
          disabled={disabled}
          title="새 프로젝트 (이름 비우면 자동 번호)"
          onClick={onCreateProject}
        >
          + 새 프로젝트
        </button>
      </div>
    </ScratchNavPopover>
  );
}
