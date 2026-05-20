import type { ScratchProjectRegistry } from '../lib/scratch-project-registry';
import {
  GITHUB_BTN_CLASS,
  GITHUB_SELECT_CLASS,
  GITHUB_SELECT_WRAP_CLASS,
  GITHUB_TOOLBAR_GROUP_CLASS,
} from './scratch-github-ui';

function SelectChevron() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute top-1/2 right-2 size-3 -translate-y-1/2 text-[#8b949e]"
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M4.427 6.427l3.396 3.396a.25.25 0 00.354 0l3.396-3.396A.25.25 0 0011.396 6H4.604a.25.25 0 00-.177.427z" />
    </svg>
  );
}

export function ScratchProjectControls({
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
  const { projects, activeProjectId } = registry;

  return (
    <div
      className={GITHUB_TOOLBAR_GROUP_CLASS}
      role="group"
      aria-label="프로젝트"
    >
      <div className={GITHUB_SELECT_WRAP_CLASS}>
        <label className="sr-only" htmlFor="scratch-project-select">
          프로젝트
        </label>
        <select
          id="scratch-project-select"
          className={`${GITHUB_SELECT_CLASS} max-w-[11rem]`}
          disabled={disabled}
          value={activeProjectId}
          onChange={(event) => {
            onSelectProject(event.target.value);
          }}
        >
          {projects.map((project) => (
            <option
              key={project.id}
              value={project.id}
              className="bg-[#161b22] text-[#e6edf3]"
            >
              {project.name}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>

      <button
        type="button"
        className={`${GITHUB_BTN_CLASS} border-l border-[#30363d]`}
        disabled={disabled}
        title="새 프로젝트 (이름 비우면 자동 번호)"
        onClick={onCreateProject}
      >
        + 새 프로젝트
      </button>
    </div>
  );
}
