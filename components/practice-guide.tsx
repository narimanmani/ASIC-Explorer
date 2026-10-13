'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { LEARNING_GUIDE } from '@/lib/learning-guide';
import type { LessonId } from '@/lib/examples';

export function PracticeGuide({ lesson, preparedCounter }: { lesson: LessonId; preparedCounter: boolean }) {
  const [step, setStep] = useState(0);
  const [explain, setExplain] = useState(false);
  const guide = LEARNING_GUIDE[lesson];
  const item = guide.steps[step];
  const circuit = lesson === 'intent' || lesson === 'rtl' || lesson === 'synthesis';
  if (circuit && !preparedCounter) return <section className="practice-guide" aria-label="Guided practice"><strong>Your own experiment</strong><p>Select the prepared 4-bit event counter to follow the beginner steps, or use Full lab to explore this example. Predict its output from the current source before changing inputs.</p></section>;
  return <section className="practice-guide" aria-label="Guided practice">
    <div className="practice-heading"><Lightbulb size={19} /><strong>{guide.idea}</strong><span>Practice {step + 1} / {guide.steps.length}</span></div>
    <p className="practice-purpose">{guide.purpose}</p>
    <div className="practice-step"><div><h2>{item.title}</h2><p><b>Predict:</b> {item.predict}</p><p><b>Try:</b> {item.action}</p>{explain && <div className="practice-answer" aria-live="polite"><p><b>Notice:</b> {item.observation}</p><p><b>Explain:</b> {item.why}</p></div>}</div>
      <div className="practice-actions"><button className="secondary" aria-expanded={explain} onClick={() => setExplain(!explain)}>{explain ? 'Hide explanation' : 'Show explanation'}</button><div><button className="icon-button" aria-label="Previous practice step" disabled={step === 0} onClick={() => { setStep(step - 1); setExplain(false); }}><ArrowLeft size={17} /></button><button className="secondary" disabled={step === guide.steps.length - 1} onClick={() => { setStep(step + 1); setExplain(false); }}>Next practice<ArrowRight size={17} /></button></div></div>
    </div>
  </section>;
}
