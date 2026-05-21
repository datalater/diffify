import type { KeyboardEvent } from 'react';
import { textareaEditorClass } from '../scratch-editor-chrome';
import type { ScratchCodeEditorProps } from '../scratch-code-editor-types';

function isFormatShortcut(event: KeyboardEvent): boolean {
  return (event.metaKey || event.ctrlKey) && event.key === 's';
}

export function TextareaScratchEditor({
  value,
  onChange,
  readOnly,
  placeholder,
  className,
  fillHeight,
  onFormatRequest,
}: ScratchCodeEditorProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (!onFormatRequest || !isFormatShortcut(event)) return;
        event.preventDefault();
        onFormatRequest();
      }}
      spellCheck={false}
      readOnly={readOnly}
      disabled={readOnly}
      placeholder={placeholder}
      className={`${textareaEditorClass(fillHeight)} ${className ?? ''}`}
    />
  );
}
