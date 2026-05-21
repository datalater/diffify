import type { ComponentType } from 'react';

export type ScratchCodeEditorLanguage = 'html' | 'plain';

export type ScratchCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: ScratchCodeEditorLanguage;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  /** head = 짧은 상한, body = 본문(기본) */
  sizeRole?: 'head' | 'body';
  fillHeight?: boolean;
  onFormatRequest?: () => void;
};

export type ScratchCodeEditorComponent = ComponentType<ScratchCodeEditorProps>;

export type ScratchCodeEditorImplementationId = 'codemirror' | 'textarea';
