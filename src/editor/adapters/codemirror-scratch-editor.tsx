import { basicSetup } from "codemirror";
import { html } from "@codemirror/lang-html";
import { indentWithTab } from "@codemirror/commands";
import { Compartment, EditorState, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  placeholder as placeholderExt,
} from "@codemirror/view";
import { useEffect, useRef } from "react";
import { codeMirrorHostClass } from "../scratch-editor-chrome";
import type { ScratchCodeEditorProps } from "../scratch-code-editor-types";

const scratchEditorTheme = EditorView.theme(
  {
    "&": {
      fontSize: "11px",
      lineHeight: "1.375",
      fontFamily:
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      height: "100%",
      maxHeight: "100%",
    },
    "&.cm-focused": {
      outline: "2px solid #0ea5e9",
      outlineOffset: "-1px",
    },
    ".cm-scroller": {
      fontFamily: "inherit",
      lineHeight: "inherit",
      overflow: "auto",
      maxHeight: "100%",
    },
    ".cm-content": {
      padding: "8px",
      caretColor: "#0f172a",
    },
    ".cm-gutters": {
      backgroundColor: "#f8fafc",
      color: "#94a3b8",
      border: "none",
      borderRight: "1px solid #e2e8f0",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "#eef2f7",
    },
    "&.cm-editor": {
      backgroundColor: "#f8fafc",
      border: "1px solid #e2e8f0",
      borderRadius: "0.25rem",
    },
    "&.cm-editor.cm-readonly": {
      opacity: 0.6,
    },
  },
  { dark: false },
);

function languageExtension(
  language: ScratchCodeEditorProps["language"],
): Extension {
  if (language !== "html") return [];
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
  language = "html",
  readOnly,
  disabled,
  placeholder,
  className,
  fillHeight,
  onFormatRequest,
}: ScratchCodeEditorProps) {
  const locked = readOnly || disabled;
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const compartmentsRef = useRef(createCompartments());
  const onChangeRef = useRef(onChange);
  const onFormatRef = useRef(onFormatRequest);
  const lastExternalValueRef = useRef(value);

  useEffect(() => {
    onChangeRef.current = onChange;
    onFormatRef.current = onFormatRequest;
  });

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const compartments = compartmentsRef.current;

    const state = EditorState.create({
      doc: value,
      extensions: [
        // Mod-s는 basicSetup 키맵보다 먼저 등록해 우선권을 갖게 한다.
        keymap.of([
          {
            key: "Mod-s",
            run: () => {
              onFormatRef.current?.();
              return true;
            },
          },
          indentWithTab,
        ]),
        basicSetup,
        scratchEditorTheme,
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          const next = update.state.doc.toString();
          lastExternalValueRef.current = next;
          onChangeRef.current(next);
        }),
        compartments.language.of(languageExtension(language)),
        compartments.readOnly.of(readOnlyExtension(locked)),
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
    // EditorView는 마운트 시 1회만 생성/파괴한다. value·locked·콜백 등 변하는
    // 값은 별도 effect와 latest-ref로 반영하므로 여기서 의존성을 추가하면
    // 에디터가 통째로 재생성되어 포커스·커서·undo 히스토리가 날아간다.
    // language·placeholder는 런타임에 바뀌지 않는다는 전제로 생략한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        readOnlyExtension(locked),
      ),
    });
  }, [locked]);

  return (
    <div
      ref={hostRef}
      className={`${codeMirrorHostClass(fillHeight)} ${disabled ? "pointer-events-none" : ""} ${className ?? ""}`}
    />
  );
}
