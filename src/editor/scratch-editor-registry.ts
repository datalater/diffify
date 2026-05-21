import type {
  ScratchCodeEditorComponent,
  ScratchCodeEditorImplementationId,
} from './scratch-code-editor-types';
import { CodeMirrorScratchEditor } from './adapters/codemirror-scratch-editor';
import { TextareaScratchEditor } from './adapters/textarea-scratch-editor';

const IMPLEMENTATIONS: Record<
  ScratchCodeEditorImplementationId,
  ScratchCodeEditorComponent
> = {
  codemirror: CodeMirrorScratchEditor,
  textarea: TextareaScratchEditor,
};

function resolveImplementationId(): ScratchCodeEditorImplementationId {
  const raw = import.meta.env.VITE_SCRATCH_EDITOR;
  if (raw === 'textarea') return 'textarea';
  return 'codemirror';
}

export function getScratchCodeEditorImplementation(): ScratchCodeEditorComponent {
  return IMPLEMENTATIONS[resolveImplementationId()];
}
