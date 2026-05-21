import { getScratchCodeEditorImplementation } from './scratch-editor-registry';
import type { ScratchCodeEditorProps } from './scratch-code-editor-types';

export type {
  ScratchCodeEditorImplementationId,
  ScratchCodeEditorLanguage,
  ScratchCodeEditorProps,
} from './scratch-code-editor-types';

export function ScratchCodeEditor(props: ScratchCodeEditorProps) {
  const Implementation = getScratchCodeEditorImplementation();
  return <Implementation {...props} />;
}
