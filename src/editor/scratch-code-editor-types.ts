import type { ComponentType } from 'react';

export type ScratchCodeEditorLanguage = 'html' | 'plain';

export type ScratchCodeEditorProps = {
  value: string;
  onChange: (value: string) => void;
  language?: ScratchCodeEditorLanguage;
  readOnly?: boolean;
  /** true면 편집·스크롤·포커스 모두 차단 (로딩 오버레이 등) */
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** head = 짧은 상한, body = 본문(기본) */
  sizeRole?: 'head' | 'body';
  fillHeight?: boolean;
  onFormatRequest?: () => void;
};

export type ScratchCodeEditorComponent = ComponentType<ScratchCodeEditorProps>;

export type ScratchCodeEditorImplementationId = 'codemirror' | 'textarea';
