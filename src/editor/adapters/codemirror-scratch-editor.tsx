import { html } from '@codemirror/lang-html';
import { defaultKeymap, indentWithTab } from '@codemirror/commands';
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from '@codemirror/language';
import { Compartment, EditorState, type Extension } from '@codemirror/state';
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from '@codemirror/view';
import { useEffect, useRef } from 'react';
import { codeMirrorHostClass } from '../scratch-editor-chrome';
import type { ScratchCodeEditorProps } from '../scratch-code-editor-types';

const scratchEditorTheme = EditorView.theme(
  {
    '&': {
      fontSize: '11px',
      lineHeight: '1.375',
      fontFamily:
        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      height: '100%',
      maxHeight: '100%',
    },
    '&.cm-focused': {
      outline: '2px solid #0ea5e9',
      outlineOffset: '-1px',
    },
    '.cm-scroller': {
      fontFamily: 'inherit',
      lineHeight: 'inherit',
      overflow: 'auto',
      maxHeight: '100%',
    },
    '.cm-content': {
      padding: '8px',
      caretColor: '#0f172a',
    },
    '.cm-gutters': {
      display: 'none',
    },
    '&.cm-editor': {
      backgroundColor: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '0.25rem',
    },
    '&.cm-editor.cm-readonly': {
      opacity: 0.6,
    },
  },
  { dark: false },
);

function languageExtension(language: ScratchCodeEditorProps['language']): Extension {
  if (language !== 'html') return [];
  return html({
    matchClosingTags: false,
    autoCloseTags: true,
  });
}

function readOnlyExtension(readOnly: boolean | undefined): Extension {
  if (!readOnly) return [];
  return [EditorState.readOnly.of(true), EditorView.editable.of(false)];
}

function createCompartments() {
  return {
    language: new Compartment(),
    readOnly: new Compartment(),
    placeholder: new Compartment(),
  };
}

export function CodeMirrorScratchEditor({
  value,
  onChange,
  language = 'html',
  readOnly,
  placeholder,
  className,
  fillHeight,
  onFormatRequest,
}: ScratchCodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const compartmentsRef = useRef(createCompartments());
  const onChangeRef = useRef(onChange);
  const onFormatRef = useRef(onFormatRequest);
  const lastExternalValueRef = useRef(value);

  onChangeRef.current = onChange;
  onFormatRef.current = onFormatRequest;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const compartments = compartmentsRef.current;

    const state = EditorState.create({
      doc: value,
      extensions: [
        scratchEditorTheme,
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        EditorView.lineWrapping,
        keymap.of([
          ...defaultKeymap,
          indentWithTab,
          {
            key: 'Mod-s',
            run: () => {
              onFormatRef.current?.();
              return true;
            },
          },
        ]),
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const next = update.state.doc.toString();
          lastExternalValueRef.current = next;
          onChangeRef.current(next);
        }),
        compartments.language.of(languageExtension(language)),
        compartments.readOnly.of(readOnlyExtension(readOnly)),
        compartments.placeholder.of(
          placeholder ? placeholderExt(placeholder) : [],
        ),
      ],
    });

    const view = new EditorView({ state, parent: host });
    viewRef.current = view;
    lastExternalValueRef.current = value;

    const resizeObserver = new ResizeObserver(() => {
      view.requestMeasure();
    });
    resizeObserver.observe(host);

    return () => {
      resizeObserver.disconnect();
      view.destroy();
      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    if (value === lastExternalValueRef.current) return;

    const current = view.state.doc.toString();
    if (current === value) {
      lastExternalValueRef.current = value;
      return;
    }

    if (view.hasFocus) {
      lastExternalValueRef.current = current;
      return;
    }

    view.dispatch({
      changes: { from: 0, to: current.length, insert: value },
    });
    lastExternalValueRef.current = value;
  }, [value]);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({
      effects: compartmentsRef.current.readOnly.reconfigure(
        readOnlyExtension(readOnly),
      ),
    });
  }, [readOnly]);

  return (
    <div
      ref={hostRef}
      className={`${codeMirrorHostClass(fillHeight)} ${readOnly ? 'pointer-events-none' : ''} ${className ?? ''}`}
    />
  );
}
