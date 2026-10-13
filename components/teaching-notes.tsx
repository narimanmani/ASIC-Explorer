'use client';
import { Download, ExternalLink, X } from 'lucide-react';
import { LESSONS, type LessonId } from '@/lib/examples';
const CUES: Record<LessonId, { minutes: string; demo: string; say: string; bridge: string }> = {
  "intent": {
    "minutes": "0–2 min introduction; then 2–7 min foundations",
    "demo": "Use the counter contract to explain store, calculate, and update. No app switch is required before 7:00.",
    "say": "A register remembers the number. Logic calculates what comes next. A rising clock edge updates the stored value according to the rules.",
    "bridge": "Read the short RTL rule, then predict its values in the app."
  },
  "rtl": {
    "minutes": "Live app: 7:00–9:00",
    "demo": "Guided view, 4-bit event counter, Word level, Restart. Step twice to 2. Disable and step: stays 2. Assert Reset between edges: stays 2; step: 0.",
    "say": "The clock tells us when an update can happen. Enable controls whether the register accepts an increment. This reset is sampled at the edge.",
    "bridge": "Return to slides at 9:00 for behavior checks and synthesis."
  },
  "synthesis": {
    "minutes": "Live app: 11:30–12:30",
    "demo": "Prepared counter, Restart, Word level. Click the adder. Step twice, switch to Gate level, then step once: 3. Leave HDL editing for optional practice.",
    "say": "Synthesis compiles hardware rules into components and connections. More detailed components can implement the same rule.",
    "bridge": "Return to slides at 12:30 for the flow map and timing path."
  },
  "timing": {
    "minutes": "Live app: 18:00–20:00",
    "demo": "Before routing: arrival 1.25, deadline 1.55, setup +0.30 ns. After routing: arrival 1.60, setup −0.05 ns. Slower clock: hold −0.04 ns. Repair hold: hold +0.02, setup +0.24 ns. Each preset is a fresh case.",
    "say": "Setup means ready before the next sample. Hold means preserve the value just sampled. This model is separate from the editable counter.",
    "bridge": "Return to slides at 20:00 for constraints and physical design."
  },
  "floorplan": {
    "minutes": "Live app: 22:30–23:30",
    "demo": "Reset layout: 1020 teaching units. Predict, then Compact placement: 455. Keep connections fixed while changing positions.",
    "say": "Locations affect wire distance. This six-cell drawing illustrates the relationship; its length is not a silicon timing result.",
    "bridge": "Return to slides at 23:30 for the clock and signal wires."
  },
  "clock": {
    "minutes": "Live app: 26:00–26:40",
    "demo": "Reset layout, read four arrival labels, then Build balanced clock tree. Example arrival spread changes 0.30 to 0.00 ns.",
    "say": "The clock also travels along wires. The assigned arrival labels illustrate distribution rather than a computed clock-tree result.",
    "bridge": "At 26:40 open Routing & RC, staying in the app."
  },
  "routing": {
    "minutes": "Live app: 26:40–27:30",
    "demo": "Toggle M2 off and on, point to a via square, then Reveal parasitic RC.",
    "say": "Routing specifies metal geometry. A via connects layers. The R and C overlay illustrates electrical effects; it does not extract them.",
    "bridge": "Return to slides at 27:30 for power, test access, and signoff."
  },
  "signoff": {
    "minutes": "Live app: 30:00–31:00",
    "demo": "Predict, then Spacing violation: DRC fails. Broken connection: LVS fails. Finish Clean layout.",
    "say": "DRC checks geometry. LVS compares devices and connections against the reference circuit. These are prepared teaching cases.",
    "bridge": "Return to slides at 31:00 for repairs, tapeout, and the closing question."
  }
};
export function TeachingNotes({ lesson, guided = false, onClose }: { lesson: LessonId; guided?: boolean; onClose: () => void }) {
  const item = LESSONS.find((l) => l.id === lesson)!;
  const cue = CUES[lesson];
  const figure = guided && lesson === 'timing' ? 'beginner-01-data-journey' : item.figure;
  return <div className="modal-backdrop" onClick={onClose}><section className="notes-modal" role="dialog" aria-modal="true" aria-labelledby="notes-title" onClick={(e) => e.stopPropagation()}><div className="panel-heading"><div><span className="eyebrow">Slide companion</span><h2 id="notes-title">{item.short} · teaching notes</h2></div><button className="icon-button" aria-label="Close teaching notes" onClick={onClose} autoFocus><X size={20} /></button></div><div className="notes-body"><span className="badge subtle">Lecture route: {cue.minutes}</span><h3>Demonstrate</h3><p>{cue.demo}</p><h3>Explain</h3><p>{cue.say}</p><h3>Bridge to the next slide</h3><p>{cue.bridge}</p><div className="note-figure"><img src={`/tutorial/figures/${figure}.png`} alt={`Original tutorial diagram for ${item.short}`} /></div><div className="notes-links"><a className="secondary" href={`/tutorial/figures/${figure}.pdf`} download><Download size={16} />Download figure PDF</a><a className="secondary" href="/tutorial/ASIC_Design_Flow_Tutorial.pdf" target="_blank" rel="noreferrer"><ExternalLink size={16} />Open full tutorial</a></div><p className="small muted">The tutorial's original TikZ source remains in the Overleaf project. Use these figures in your slides, then switch to the app for a short experiment.</p></div></section></div>;
}
