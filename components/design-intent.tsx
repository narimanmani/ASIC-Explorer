import { ArrowRight, Code2, Cpu, Layers, RotateCcw, SkipForward, Timer } from 'lucide-react';
import type { LessonId } from '@/lib/examples';
type IntroCounter = {
  prepared: boolean; ready: boolean; value: string; cycles: number; enabled: boolean; resetRequested: boolean;
  onStep: () => void; onEnable: () => void; onReset: () => void; onRestart: () => void; onLoad: () => void;
};

export function DesignIntent({ go, counter }: { go: (id: LessonId) => void; counter: IntroCounter }) {
  const steps: { id: LessonId; name: string; detail: string }[] = [{ id: 'rtl', name: 'RTL', detail: 'Describe behavior' }, { id: 'synthesis', name: 'Synthesis', detail: 'Build the netlist' }, { id: 'timing', name: 'Constraints', detail: 'Define timing goals' }, { id: 'floorplan', name: 'Placement', detail: 'Arrange the cells' }, { id: 'clock', name: 'Clock tree', detail: 'Distribute the clock' }, { id: 'routing', name: 'Routing', detail: 'Connect in metal' }, { id: 'signoff', name: 'Signoff', detail: 'Check the result' }];
  const binary = counter.value.padStart(4, 'x');
  const number = /^[01]{4}$/.test(binary) ? parseInt(binary, 2) : null;
  const next = number === null ? null : counter.resetRequested ? 0 : counter.enabled ? (number + 1) % 16 : number;
  return <div className="intent-view">
    <section className="panel design-brief">
      <div className="brief-label">Our running example · try it here</div>
      <h2>A four-bit event counter</h2>
      <p>Imagine a scoreboard that remembers a number from 0 to 15. Use the controls here before looking at the code.</p>
      {counter.prepared ? <section className="intro-counter" aria-label="Try the counter">
        <div className="intro-number"><span>Current number</span><output data-testid="intent-count" aria-live="polite">{number ?? '—'}</output><small>{counter.cycles} clock edges tried</small></div>
        <div className="brief-bits" aria-label={`Four binary digits: ${binary.toUpperCase()}`}>{['3', '2', '1', '0'].map((bit, i) => <div key={bit}><strong>{binary[i].toUpperCase()}</strong><span>bit {bit}</span></div>)}</div>
        <div className="intro-counter-controls">
          <button className="primary" disabled={!counter.ready} onClick={counter.onStep}><SkipForward size={17} />Step clock</button>
          <button className="secondary" disabled={!counter.ready} onClick={counter.onRestart}><RotateCcw size={17} />Start over</button>
        </div>
        <div className="intro-switches">
          <button className={`input-toggle ${counter.enabled ? 'on' : ''}`} role="switch" aria-checked={counter.enabled} aria-label="Enable counting" aria-describedby="intent-enable-help" disabled={!counter.ready} onClick={counter.onEnable}><span>Enable</span><i /><b>{counter.enabled ? 'On' : 'Off'}</b></button>
          <button className={`input-toggle ${counter.resetRequested ? 'on' : ''}`} role="switch" aria-checked={counter.resetRequested} aria-label="Reset at next edge" aria-describedby="intent-reset-help" disabled={!counter.ready} onClick={counter.onReset}><span>Reset</span><i /><b>{counter.resetRequested ? 'On' : 'Off'}</b></button>
        </div>
        <div className="intro-control-key">
          <p><b>Step clock</b> creates one update event: a rising clock edge, when the signal goes from 0 to 1.</p>
          <p id="intent-enable-help"><b>Enable</b> means permission to count. On: add one at the next edge. Off: keep the number even when the clock steps.</p>
          <p id="intent-reset-help"><b>Reset</b> requests zero at the next edge. It takes priority over Enable. Switching it on alone does not clear the number.</p>
          <p><b>Start over</b> restarts the experiment at zero, with Enable on and Reset off.</p>
        </div>
        <p className="intro-next" role="status">{!counter.ready ? 'Preparing the counter…' : number === null ? 'Start over to begin at a known value.' : counter.resetRequested ? `Next edge: set the number to 0. Reset has priority.` : counter.enabled ? `Next edge: ${number} → ${next}. Counting is allowed.` : `Next edge: keep ${number}. The clock advances, but counting is paused.`}</p>
      </section> : <div className="intro-counter"><p>Your workspace contains another example or edited code. Load the teaching counter to try these rules.</p><button className="primary" onClick={counter.onLoad}>Load four-bit counter</button></div>}
      <div className="three-jobs"><div><b>Store</b><p>A register remembers the current number.</p></div><div><b>Calculate</b><p>Logic works out the next number.</p></div><div><b>Update</b><p>A rising clock edge lets the register accept it.</p></div></div>
      <div className="contract-grid"><div><Code2 size={20} /><h3>Behavior</h3><p>Enable on: count once per rising edge. Enable off: keep the number. After 15 comes 0.</p></div><div><Cpu size={20} /><h3>State</h3><p>Four bits store the number. Reset sets it to zero at the next edge, regardless of Enable.</p></div><div><Timer size={20} /><h3>Timing goal</h3><p>The later timing model allows 2 nanoseconds between edges. A nanosecond is one billionth of a second.</p></div><div><Layers size={20} /><h3>Implementation</h3><p>Choose physical components (cells), give them locations, then build the clock and signal wires.</p></div></div>
      <button className="secondary intro-rtl-link" onClick={() => go('rtl')}>Explore the RTL and circuit<ArrowRight size={16} /></button><p className="intro-bridge">{counter.prepared ? 'The RTL view shows the code and circuit for the same live counter state.' : 'Your selected design and code are still available in the RTL view.'}</p>
    </section>
    <section className="panel flow-panel"><div className="panel-heading"><h2>The path to a physical chip</h2><span className="badge subtle">Iterate to close constraints</span></div><div className="flow-list">{steps.map((step, i) => <button key={step.id} onClick={() => go(step.id)}><span>{String(i + 1).padStart(2, '0')}</span><div><strong>{step.name}</strong><small>{step.detail}</small></div><ArrowRight size={16} /></button>)}</div><p className="flow-note">Verification accompanies the flow. Failed timing, geometry, or connectivity checks can send us back to an earlier stage.</p></section>
  </div>;
}
