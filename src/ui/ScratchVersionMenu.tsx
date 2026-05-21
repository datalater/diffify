import {
  SCRATCH_VERSION_DRAFT_VALUE,
  type ScratchVersionMeta,
} from '../lib/scratch-version-storage';
import { ScratchPanelSelect } from './ScratchPanelSelect';
import { NavMenuChevron, ScratchNavPopover } from './ScratchNavPopover';
import {
  GITHUB_DIRTY_BADGE_CLASS,
  NAV_MENU_ITEM_CLASS,
  NAV_MENU_TRIGGER_CLASS,
} from './scratch-github-ui';

const PANEL_CLASS = 'min-w-[14rem] px-3 py-2.5 font-sans';

function versionTriggerLabel(meta: ScratchVersionMeta, dirty: boolean): string {
  if (dirty) return 'draft';
  if (!meta.currentEntryId) {
    return meta.versionLine.length > 0 ? '버전' : '버전 없음';
  }
  const entry = meta.versionLine.find(
    (e) => e.entryId === meta.currentEntryId,
  );
  return entry?.label ?? '버전';
}

export function ScratchVersionMenu({
  meta,
  dirty,
  disabled,
  onCreateVersion,
  onSelectValue,
}: {
  meta: ScratchVersionMeta;
  dirty: boolean;
  disabled?: boolean;
  onCreateVersion: () => void;
  onSelectValue: (value: string) => void;
}) {
  const { versionLine } = meta;
  const hasVersions = versionLine.length > 0;
  const selectValue = dirty
    ? SCRATCH_VERSION_DRAFT_VALUE
    : (meta.currentEntryId ?? '');
  const selectEnabled = !disabled && (dirty || hasVersions);
  const triggerLabel = versionTriggerLabel(meta, dirty);
  const versionLineNewestFirst = [...versionLine].reverse();

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
          className={`${NAV_MENU_TRIGGER_CLASS} max-w-[10rem]`}
          title={
            dirty
              ? '편집 중(draft) — 확정 버전과 내용이 다름'
              : `버전: ${triggerLabel}`
          }
        >
          {dirty ? (
            <span
              className="size-1.5 shrink-0 rounded-full bg-[#d29922]"
              aria-hidden
            />
          ) : null}
          <span
            className={`min-w-0 truncate ${dirty ? 'text-[#d29922]' : ''}`}
          >
            {triggerLabel}
          </span>
          <NavMenuChevron open={open} />
        </button>
      )}
    >
      <div className="flex flex-col gap-2">
        {dirty ? (
          <span
            className={`${GITHUB_DIRTY_BADGE_CLASS} rounded-md border border-[#30363d]`}
            title="확정된 버전과 편집 내용이 다름"
          >
            <span
              className="size-1.5 shrink-0 rounded-full bg-[#d29922]"
              aria-hidden
            />
            변경됨
          </span>
        ) : null}

        <button
          type="button"
          className={`${NAV_MENU_ITEM_CLASS} justify-center rounded-md border border-[#30363d] bg-[#21262d] !px-3`}
          disabled={disabled || !dirty}
          title={
            dirty
              ? '현재 편집 내용을 새 버전으로 저장 (IndexedDB)'
              : '확정 버전과 동일하면 생성할 수 없음'
          }
          onClick={onCreateVersion}
        >
          버전 생성
        </button>

        <ScratchPanelSelect
          id="scratch-version-select-menu"
          label="버전"
          disabled={!selectEnabled}
          value={selectValue}
          onChange={onSelectValue}
        >
          {dirty ? (
            <option
              value={SCRATCH_VERSION_DRAFT_VALUE}
              className="bg-[#161b22] text-[#d29922]"
            >
              draft
            </option>
          ) : null}
          {!dirty && !hasVersions ? (
            <option value="">버전 없음</option>
          ) : null}
          {versionLineNewestFirst.map((entry) => (
            <option
              key={entry.entryId}
              value={entry.entryId}
              className="bg-[#161b22] text-[#e6edf3]"
            >
              {entry.label}
            </option>
          ))}
        </ScratchPanelSelect>
      </div>
    </ScratchNavPopover>
  );
}
