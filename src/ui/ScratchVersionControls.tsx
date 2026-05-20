import {
  SCRATCH_VERSION_DRAFT_VALUE,
  type ScratchVersionMeta,
} from '../lib/scratch-version-storage';
import {
  GITHUB_BTN_CLASS,
  GITHUB_DIRTY_BADGE_CLASS,
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

export function ScratchVersionControls({
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

  return (
    <div
      className={GITHUB_TOOLBAR_GROUP_CLASS}
      role="group"
      aria-label="버전"
    >
      {dirty ? (
        <span
          className={GITHUB_DIRTY_BADGE_CLASS}
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
        className={`${GITHUB_BTN_CLASS} ${dirty ? 'border-l border-[#30363d]' : ''}`}
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

      <div className={GITHUB_SELECT_WRAP_CLASS}>
        <label className="sr-only" htmlFor="scratch-version-select">
          버전
        </label>
        <select
          id="scratch-version-select"
          className={GITHUB_SELECT_CLASS}
          disabled={!selectEnabled}
          value={selectValue}
          onChange={(event) => {
            onSelectValue(event.target.value);
          }}
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
          {versionLine.map((entry) => (
            <option
              key={entry.entryId}
              value={entry.entryId}
              className="bg-[#161b22] text-[#e6edf3]"
            >
              {entry.label}
            </option>
          ))}
        </select>
        <SelectChevron />
      </div>
    </div>
  );
}
