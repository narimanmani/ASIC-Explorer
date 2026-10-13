'use client';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, ArrowLeft, ArrowRight, BookOpen, Check, ChevronDown, Code2, Cpu, Download, FileText, FlaskConical, Layers, Maximize2, Minimize2, Play, RotateCcw, Settings2, SkipForward, Square, Timer, TriangleAlert, X, Zap } from 'lucide-react';
import baseline from '@/public/examples/counter.json';
import { COUNTER_SOURCE, EXAMPLES, LESSONS, type LessonId } from '@/lib/examples';
import type { Compilation, Device } from '@/lib/types';
import { useSimulation } from '@/lib/use-simulation';
import { CircuitView } from './circuit-view';
import { Waveforms } from './waveforms';
import { TimingLab } from './timing-lab';
import { PhysicalLab } from './physical-lab';
import { SignoffLab } from './signoff-lab';
import { DesignIntent } from './design-intent';
import { TeachingNotes } from './teaching-notes';
import { PracticeGuide } from './practice-guide';

const Editor = dynamic(() => import('./hdl-editor').then((m) => m.HdlEditor), { ssr: false, loading: () => <div className="empty-state">Loading local HDL editor…</div> });
const emptySelection = { id: '', name: '', detail: 'Select an adder, flip-flop, or gate to inspect what it does and where it came from.', lines: undefined as [number, number] | undefined };
const DEVICE_INFO: Record<string, string> = {
  Addition: 'An adder computes a new value continuously. A register stores that value when the clock and control inputs permit.',
  Dff: 'A D flip-flop stores state. The triangle marks an edge-sensitive clock input. This synthesized device may also include reset and enable controls.',
  Mux: 'A multiplexer selects one of its data inputs. The selection input controls which value reaches the output.',
  And: 'AND produces 1 when all its input bits are 1.', Or: 'OR produces 1 when at least one input bit is 1.', Xor: 'XOR produces 1 when its two input bits differ.', Not: 'An inverter changes 0 to 1 and 1 to 0.',
  Constant: 'A constant is a fixed logic value. It does not imply stored state.', Input: 'A module input receives a value from outside this circuit.', Output: 'A module output exposes a circuit value to the outside world.',
};
const ICONS = [FileText, Code2, Cpu, Timer, Layers, Activity, Zap, Check];

export function Explorer() {
  const [lesson, setLesson] = useState<LessonId>('intent');
  const [example, setExample] = useState('counter');
  const [source, setSource] = useState(COUNTER_SOURCE);
  const [top, setTop] = useState('event_counter');
  const [compilation, setCompilation] = useState<Compilation>(baseline as Compilation);
  const [gateMode, setGateMode] = useState(false);
  const [selection, setSelection] = useState(emptySelection);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [running, setRunning] = useState(false);
  const [guided, setGuided] = useState(true);
  const [presentation, setPresentation] = useState(false);
  const [notes, setNotes] = useState(false);
  const [answer, setAnswer] = useState(false);
  const [log, setLog] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [inputError, setInputError] = useState('');
  const requestId = useRef(0);
  const abort = useRef<AbortController | null>(null);
  const controls = useRef<HTMLDivElement>(null);
  const notesTrigger = useRef<HTMLButtonElement>(null);
  const behavior = useSimulation(compilation.behavior);
  const gates = useSimulation(compilation.gates);
  const dirty = source.trim() !== compilation.source.trim() || top !== compilation.top;
  const ready = behavior.ready && gates.ready && !dirty && !busy && !behavior.error && !gates.error;
  const hasClock = compilation.ports.some((p) => p.name === 'clk' && p.direction === 'input');
  const isCircuitLesson = lesson === 'rtl' || lesson === 'synthesis';
  const item = LESSONS.find((l) => l.id === lesson)!;
  const index = LESSONS.findIndex((l) => l.id === lesson);
  const currentSim = gateMode ? gates : behavior;
  const preparedExample = EXAMPLES.find((e) => e.id === example)!;
  const customSource = source.trim() !== preparedExample.source.trim() || top !== preparedExample.top;
  const goal = customSource ? 'Custom RTL · synthesize, predict the outputs, then inspect the circuit.' : preparedExample.goal;
  const exampleQuestion = isCircuitLesson && customSource ? { question: 'What does your edited RTL predict for the next input change or clock edge?', answer: 'Read the assignments and control priorities in your source first. Synthesize it, change the inputs, and compare the resulting circuit and waveforms with that prediction.' } : lesson === 'rtl' ? ({
    mux: { question: 'With a = 0, b = 1, and sel = 1, what should y be?', answer: 'The select input chooses b, so y becomes 1. A multiplexer does not need a clock to make this selection.' },
    gates: { question: 'With a = 1, b = 1, and c = 1, what should y be?', answer: 'The AND gate produces 1. XOR with c = 1 then produces 0, because its inputs are equal.' },
    async: { question: 'Will asserting reset change count before the next clock edge?', answer: 'Yes. This example includes posedge rst in the event control. Asserting reset updates the state immediately in the functional simulator.' },
    'step-two': { question: 'Which counter bit stays 0 when we repeatedly add 2 after reset?', answer: 'The least significant bit stays 0. Starting at 0, every value in the modulo-16 sequence is even.' },
  } as Record<string, { question: string; answer: string }>)[example] : undefined;

  const go = useCallback((id: LessonId) => { setLesson(id); setAnswer(false); setRunning(false); window.scrollTo({ top: 0 }); }, []);
  const step = useCallback(() => { if (ready && hasClock) { behavior.step(); gates.step(); } }, [ready, hasClock, behavior.step, gates.step]);
  const reset = useCallback(() => { setRunning(false); behavior.reset(); gates.reset(); setSelection(emptySelection); }, [behavior.reset, gates.reset]);
  const setInput = (name: string, binary: string) => { setInputError(''); behavior.input(name, binary); gates.input(name, binary); };
  const showNotes = useCallback(() => { setNotes(true); setRunning(false); }, []);
  const closeNotes = useCallback(() => { setNotes(false); notesTrigger.current?.focus(); }, []);

  async function synthesize() {
    const id = ++requestId.current;
    abort.current?.abort(); abort.current = new AbortController();
    setBusy(true); setRunning(false); setError(''); setSelection(emptySelection);
    try {
      const response = await fetch('/api/synthesize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ source, top }), signal: abort.current.signal });
      const result = await response.json();
      if (id !== requestId.current) return;
      if (!response.ok) throw new Error(result.error);
      setCompilation(result); setLog(false);
    } catch (e) { if (id === requestId.current && (e as Error).name !== 'AbortError') setError((e as Error).message); }
    finally { if (id === requestId.current) setBusy(false); }
  }
  async function loadExample(id: string) {
    const item = EXAMPLES.find((e) => e.id === id)!;
    const req = ++requestId.current;
    abort.current?.abort();
    setExample(id); setSource(item.source); setTop(item.top); setRunning(false); setAnswer(false); setError(''); setInputError(''); setSelection(emptySelection); setBusy(true);
    try {
      const response = await fetch(`/examples/${id}.json`);
      if (!response.ok) throw new Error('The prepared example could not load. Use Synthesize to compile it locally.');
      const result = await response.json();
      if (req === requestId.current) setCompilation(result);
    } catch (e) { if (req === requestId.current) setError((e as Error).message); }
    finally { if (req === requestId.current) setBusy(false); }
  }
  function selectDevice(id: string, device: Device) {
    const positions = device.source_positions?.filter((p) => p.name === 'design.sv');
    const lines: [number, number] | undefined = positions?.length ? [Math.min(...positions.map((p) => p.from.line)), Math.max(...positions.map((p) => p.to.line))] : undefined;
    setSelection({ id, name: device.net ?? device.type, detail: DEVICE_INFO[device.type] ?? `${device.type} is a synthesized circuit component. Inspect its ports and related RTL to understand its role.`, lines });
  }
  function saveSource() {
    const url = URL.createObjectURL(new Blob([source], { type: 'text/plain' }));
    const link = document.createElement('a'); link.href = url; link.download = `${/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(top) ? top : 'design'}.sv`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  useEffect(() => { if (dirty || busy || !isCircuitLesson) setRunning(false); }, [dirty, busy, isCircuitLesson]);
  useEffect(() => { if (!running || !ready) return; const timer = setInterval(step, speed); return () => clearInterval(timer); }, [running, ready, step, speed]);
  useEffect(() => {
    const followHash = () => { const hash = location.hash.slice(1); if (LESSONS.some((l) => l.id === hash)) go(hash as LessonId); };
    followHash();
    window.addEventListener('hashchange', followHash);
    return () => window.removeEventListener('hashchange', followHash);
  }, []);
  useEffect(() => { history.replaceState(null, '', `#${lesson}`); }, [lesson]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement;
      if (target.closest('input,select,textarea,[contenteditable=true],[role=textbox],.monaco-editor')) return;
      if (notes) {
        if (e.key === 'Escape') closeNotes();
        if (e.key === 'Tab') { const dialog = document.querySelector('.notes-modal'); const focusable = Array.from(dialog?.querySelectorAll<HTMLElement>('button,a[href]') ?? []); const first = focusable[0], last = focusable.at(-1); if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); } }
        return;
      }
      const canStepHere = isCircuitLesson || (lesson === 'intent' && example === 'counter' && !customSource);
      if (e.key === ' ' && canStepHere && !target.closest('button,a,[role=switch]')) { e.preventDefault(); step(); }
      if (e.key.toLowerCase() === 'p') setPresentation((p) => !p);
      if (e.key.toLowerCase() === 'r' && ready) reset();
      if (e.key.toLowerCase() === 'n') showNotes();
      if (e.key === 'ArrowRight' && index < LESSONS.length - 1) go(LESSONS[index + 1].id);
      if (e.key === 'ArrowLeft' && index > 0) go(LESSONS[index - 1].id);
      if (/^[1-8]$/.test(e.key)) go(LESSONS[Number(e.key) - 1].id);
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [notes, step, index, go, ready, reset, showNotes, closeNotes, isCircuitLesson, lesson, example, customSource]);

  return <div className={`app-shell ${guided ? 'guided' : 'full-lab'} ${presentation ? 'presenting' : ''}`}>
    <a className="skip-link" href="#lesson-content">Skip to lesson</a>
    <aside className="sidebar"><a className="brand" href="#intent" aria-label="ASIC Explorer home" onClick={() => go('intent')}><span className="brand-icon"><Cpu size={22} /></span><div><strong>ASIC<span>Explorer</span></strong><small>RTL TO PHYSICAL DESIGN</small></div></a><div className="sidebar-label">The design journey</div><nav aria-label="Lesson navigation">{LESSONS.map((l, i) => { const Icon = ICONS[i]; return <button key={l.id} aria-label={`${l.short} ${String(i + 1).padStart(2, '0')}`} title={l.short} aria-current={lesson === l.id ? 'step' : undefined} className={lesson === l.id ? 'selected' : ''} onClick={() => go(l.id)}><Icon size={17} /><span>{l.short}</span><small>{String(i + 1).padStart(2, '0')}</small></button>; })}</nav><div className="sidebar-bottom"><div className="lecture-card"><BookOpen size={18} /><strong>A lecture, made tangible.</strong><p>A counter, then cells and wires.<br />One small experiment at a time.</p></div><a className="tutorial-link" href="/tutorial/ASIC_Design_Flow_Tutorial.pdf" target="_blank" rel="noreferrer"><FileText size={16} />Tutorial & diagrams<ArrowRight size={14} /></a><span className="sidebar-footnote">Slide companion · 40-minute lecture</span></div></aside>
    <div className="main-shell"><header className="topbar"><div className="breadcrumbs"><span>ASIC design flow</span><span>/</span><strong>{item.short}</strong></div><div className="header-actions"><div className="segmented view-switch" aria-label="Learning view"><button aria-pressed={guided} className={guided ? 'active' : ''} onClick={() => setGuided(true)}>Guided view</button><button aria-pressed={!guided} className={!guided ? 'active' : ''} onClick={() => setGuided(false)}>Full lab</button></div><button className="secondary" ref={notesTrigger} onClick={showNotes}><BookOpen size={16} /><span>Teaching notes</span><kbd>N</kbd></button><button className={presentation ? 'secondary active' : 'secondary'} onClick={() => { setPresentation(!presentation); setRunning(false); }}>{presentation ? <Minimize2 size={16} /> : <Maximize2 size={16} />}<span>{presentation ? 'Exit presentation' : 'Present'}</span><kbd>P</kbd></button></div></header>
      <main id="lesson-content"><div className="lesson-header"><div><div className="eyebrow">Lesson {String(index + 1).padStart(2, '0')} / 08 <span>· {isCircuitLesson ? 'Interactive HDL lab' : lesson === 'timing' ? 'Timing experiment' : 'Guided exploration'}</span></div><h1>{item.label}</h1><p>{item.subtitle}</p></div><div className="lesson-arrows"><button className="icon-button" aria-label="Previous lesson" disabled={index === 0} onClick={() => go(LESSONS[index - 1].id)}><ArrowLeft size={18} /></button><button className="icon-button" aria-label="Next lesson" disabled={index === LESSONS.length - 1} onClick={() => go(LESSONS[index + 1].id)}><ArrowRight size={18} /></button></div></div>
        {guided && <PracticeGuide key={lesson} lesson={lesson} preparedCounter={example === 'counter' && !customSource} />}
        {isCircuitLesson ? <>
          <div className="example-toolbar"><div className="example-select"><FlaskConical size={17} /><label htmlFor="example-select">Example</label><select id="example-select" value={example} onChange={(e) => loadExample(e.target.value)}>{EXAMPLES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}</select><ChevronDown size={14} /></div><span className={`badge ${dirty ? 'amber' : 'green'}`}>{busy ? 'Synthesizing…' : dirty ? 'Edited · synthesize to update' : 'Compiled with Yosys'}</span><span className="example-goal">{goal}</span></div>
          <div className="circuit-reading-key"><span><b>Register / DFF</b> stores the number</span><span><b>Adder / +</b> calculates the next number</span><span><b>Clock triangle</b> marks the update input</span></div><div className="workspace-grid"><section className="panel code-panel"><div className="panel-heading"><div className="panel-title"><Code2 size={16} /><h2>Hardware rules (SystemVerilog)</h2></div><div className="panel-actions"><span className="file-tab">design.sv</span><button className="icon-button" aria-label="Restore example source" title="Restore this prepared example" disabled={busy} onClick={() => loadExample(example)}><RotateCcw size={13} /></button><button className="icon-button" aria-label="Download HDL source" title="Save HDL source" onClick={saveSource}><Download size={13} /></button></div></div><div className="code-content"><Editor value={source} onChange={(v) => { setSource(v); setError(''); }} lines={dirty ? undefined : selection.lines} fontSize={presentation ? 18 : guided ? 16 : 14} error={error} /></div><div className="compile-bar"><label>Top module<input aria-label="Top module" value={top} onChange={(e) => setTop(e.target.value)} spellCheck={false} /></label><button className="primary" disabled={busy || !source.trim()} onClick={synthesize}><Cpu size={16} />{busy ? 'Compiling…' : 'Synthesize'}</button></div><div className="code-status"><span>{dirty ? 'Circuit shows the last compiled source.' : <><Check size={12} />Source and circuit are synchronized</>}</span><button onClick={() => setLog(!log)}>Synthesis report</button></div></section>
          <section className="panel circuit-panel"><div className="panel-heading"><div className="panel-title"><Cpu size={16} /><h2>Live circuit</h2><span className="muted">{gateMode ? compilation.stats.gates.cells : compilation.stats.behavior.cells} cells</span></div><div className="segmented" aria-label="Circuit abstraction"><button aria-pressed={!gateMode} className={!gateMode ? 'active' : ''} onClick={() => { setGateMode(false); setSelection(emptySelection); }}>Word level</button><button aria-pressed={gateMode} className={gateMode ? 'active' : ''} onClick={() => { setGateMode(true); setSelection(emptySelection); }}>Gate level</button></div></div>
            <div className="output-strip"><span className="output-label">Outputs</span>{compilation.ports.filter((p) => p.direction === 'output').slice(0, 4).map((p) => { const value = behavior.values[p.name] ?? 'x'.repeat(p.width); return <div className="output-value" key={p.name}><span>{p.name}</span><strong data-testid={`output-${p.name}`}>{/^[01]+$/.test(value) ? String(BigInt(`0b${value}`)) : 'X'}</strong><code>{value.toUpperCase()}</code></div>; })}<span className="cycles-value">{behavior.cycles}<small>clock edges</small></span></div>
            <CircuitView netlist={gateMode ? compilation.gates : compilation.behavior} signals={currentSim.signals} selected={selection.id} onSelect={selectDevice} gateMode={gateMode} />
            <div className="component-inspector"><span className="inspector-icon"><Settings2 size={16} /></span><div><strong>{selection.name || 'Explore the hardware'}</strong><p>{selection.detail}</p>{selection.lines && <small>RTL lines {selection.lines[0]}–{selection.lines[1]} · source association may cover several components</small>}</div>{selection.id && <button className="icon-button" aria-label="Clear selected component" onClick={() => setSelection(emptySelection)}><X size={14} /></button>}</div>
          </section></div>
          {(error || behavior.error || gates.error || inputError) && <div className="error-message" role="alert"><TriangleAlert size={18} /><pre>{error || behavior.error || gates.error || inputError}</pre><button className="icon-button" aria-label="Dismiss error" onClick={() => { setError(''); setInputError(''); }}><X size={16} /></button></div>}
          <div className="simulation-bar" ref={controls}><div className="clock-controls"><button className="primary" disabled={!ready || !hasClock} onClick={step}><SkipForward size={16} />Step clock<kbd>Space</kbd></button><button className="secondary square-control" disabled={!ready || !hasClock} aria-label={running ? 'Pause simulation' : 'Run simulation'} title={running ? 'Pause' : 'Run'} onClick={() => setRunning(!running)}>{running ? <Square size={16} /> : <Play size={16} />}</button><button className="secondary square-control" disabled={!ready} aria-label="Restart simulation" title="Restart with an initialization reset edge" onClick={reset}><RotateCcw size={16} /></button><label className="speed-control"><span>Demo pace</span><select aria-label="Simulation pace" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}><option value={1400}>Slow</option><option value={900}>Normal</option><option value={400}>Fast</option></select></label></div><div className="input-controls">{compilation.ports.filter((p) => p.direction === 'input' && p.name !== 'clk').slice(0, 7).map((p) => p.width === 1 ? <button key={p.name} className={`input-toggle ${behavior.values[p.name] === '1' ? 'on' : ''}`} role="switch" aria-checked={behavior.values[p.name] === '1'} aria-label={p.name === 'rst' ? 'Reset input' : p.name === 'en' ? 'Enable input' : `${p.name} input`} disabled={!ready} onClick={() => setInput(p.name, behavior.values[p.name] === '1' ? '0' : '1')}><span>{p.name === 'rst' ? 'Reset' : p.name === 'en' ? 'Enable' : p.name}</span><i /><code>{behavior.values[p.name] ?? '0'}</code></button> : <label key={p.name} className="bus-input">{p.name} [{p.width}]<input aria-label={`${p.name} binary input`} disabled={!ready} defaultValue={'0'.repeat(p.width)} key={compilation.top + p.name} onBlur={(e) => { const value = e.target.value.trim(); if (/^[01]+$/.test(value) && value.length <= p.width) setInput(p.name, value.padStart(p.width, '0')); else setInputError(`Enter up to ${p.width} binary digits for ${p.name}.`); }} /></label>)}</div></div>
          <Waveforms ports={compilation.ports} values={behavior.values} samples={behavior.samples} cycles={behavior.cycles} />
          {log && <section className="panel synthesis-report"><div className="panel-heading"><h2>Synthesis report</h2><button className="icon-button" aria-label="Close synthesis report" onClick={() => setLog(false)}><X size={16} /></button></div><div className="report-summary"><span>Word-level cells <strong>{compilation.stats.behavior.cells}</strong></span><span>Generic mapped cells <strong>{compilation.stats.gates.cells}</strong></span><span>Tool <strong>Yosys {compilation.version}</strong></span></div><pre>{compilation.log}</pre></section>}
        </> : lesson === 'intent' ? <DesignIntent go={go} counter={{ prepared: example === 'counter' && !customSource, ready, value: behavior.values.count ?? 'xxxx', cycles: behavior.cycles, enabled: behavior.values.en === '1', resetRequested: behavior.values.rst === '1', onStep: step, onEnable: () => setInput('en', behavior.values.en === '1' ? '0' : '1'), onReset: () => setInput('rst', behavior.values.rst === '1' ? '0' : '1'), onRestart: reset, onLoad: () => { setGateMode(false); loadExample('counter'); } }} /> : lesson === 'timing' ? <TimingLab guided={guided} /> : lesson === 'signoff' ? <SignoffLab /> : <PhysicalLab key={lesson} stage={lesson} />}
        {!guided && <section className="question-card"><div className="question-icon">?</div><div><span className="eyebrow">Pause & predict</span><h2>{exampleQuestion?.question ?? item.question}</h2>{answer && <p className="answer-text">{exampleQuestion?.answer ?? item.answer}</p>}</div><button className="secondary" aria-expanded={answer} onClick={() => setAnswer(!answer)}>{answer ? 'Hide explanation' : 'Reveal explanation'}<ChevronDown size={15} /></button></section>}
        <footer className="lesson-footer"><span><kbd>←</kbd><kbd>→</kbd> lessons <span className="footer-divider">·</span><kbd>Space</kbd> step clock <span className="footer-divider">·</span><kbd>P</kbd> present</span><span>HDL simulation · conceptual physical models</span></footer>
      </main>
    </div>
    {notes && <TeachingNotes lesson={lesson} guided={guided} onClose={closeNotes} />}
  </div>;
}
