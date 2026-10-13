'use client';
import Editor, { loader, type OnMount } from '@monaco-editor/react';
import { useEffect, useRef } from 'react';
import type * as Monaco from 'monaco-editor';

loader.config({ paths: { vs: '/monaco/vs' } });
export function HdlEditor({ value, onChange, lines, fontSize, error }: { value: string; onChange: (value: string) => void; lines?: [number, number]; fontSize: number; error: string }) {
  const editor = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const decorations = useRef<Monaco.editor.IEditorDecorationsCollection | null>(null);
  const monaco = useRef<typeof Monaco | null>(null);
  const highlight = () => {
    if (!editor.current || !monaco.current) return;
    decorations.current?.clear();
    if (lines) {
      decorations.current = editor.current.createDecorationsCollection([{ range: new monaco.current.Range(lines[0], 1, lines[1], 1), options: { isWholeLine: true, className: 'rtl-highlight', linesDecorationsClassName: 'rtl-margin-highlight' } }]);
      editor.current.revealLinesInCenter(lines[0], lines[1]);
    }
  };
  useEffect(highlight, [lines]);
  useEffect(() => {
    if (!editor.current || !monaco.current) return;
    const model = editor.current.getModel(); if (!model) return;
    const line = Number(error.match(/(?:design\.sv:|line\s+)(\d+)/i)?.[1] ?? 1);
    monaco.current.editor.setModelMarkers(model, 'synthesis', error ? [{ startLineNumber: line, endLineNumber: line, startColumn: 1, endColumn: 100, severity: monaco.current.MarkerSeverity.Error, message: error }] : []);
  }, [error]);
  const onMount: OnMount = (instance, api) => {
    editor.current = instance; monaco.current = api;
    if (!api.languages.getLanguages().some((l: { id: string }) => l.id === 'systemverilog')) {
      api.languages.register({ id: 'systemverilog' });
      api.languages.setMonarchTokensProvider('systemverilog', { tokenizer: { root: [[/\/\/.*$/, 'comment'], [/\b(module|endmodule|input|output|logic|wire|reg|always_ff|always_comb|begin|end|if|else|assign|posedge|negedge|parameter|case|endcase|default)\b/, 'keyword'], [/\d+'[sS]?[bBoOdDhH][0-9a-fA-F_xXzZ]+/, 'number'], [/\d+/, 'number'], [/[<>=?:+\-&|^~!]+/, 'operator']] } });
    }
    api.editor.defineTheme('asic-light', { base: 'vs', inherit: true, rules: [{ token: 'keyword', foreground: '7956A0', fontStyle: 'bold' }, { token: 'number', foreground: '087969' }, { token: 'comment', foreground: '7A8796' }], colors: { 'editor.background': '#FFFFFF', 'editorLineNumber.foreground': '#A1ACBA', 'editor.lineHighlightBackground': '#F8FAFC', 'editor.selectionBackground': '#D9F2EC' } });
    api.editor.setTheme('asic-light'); api.editor.setModelLanguage(instance.getModel()!, 'systemverilog');
    highlight();
  };
  return <Editor height="100%" value={value} onChange={(v) => onChange(v ?? '')} language="systemverilog" theme="asic-light" onMount={onMount} loading={<div className="empty-state">Loading local HDL editor…</div>} options={{ fontSize, fontFamily: 'Cascadia Code, Consolas, monospace', minimap: { enabled: false }, lineNumbersMinChars: 2, padding: { top: 18, bottom: 18 }, scrollBeyondLastLine: false, automaticLayout: true, tabSize: 2, wordWrap: 'on', renderLineHighlight: 'line', glyphMargin: false, folding: false, overviewRulerLanes: 0, scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }, editContext: false, accessibilitySupport: 'on', ariaLabel: 'SystemVerilog source editor', quickSuggestions: false }} />;
}
