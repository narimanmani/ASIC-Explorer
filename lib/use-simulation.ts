'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { Netlist, SimSnapshot } from './types';
import type { TeachingSimulator } from './simulation.mjs';

const EMPTY: SimSnapshot = { values: {}, signals: {}, samples: [], cycles: 0 };
export function useSimulation(netlist?: Netlist) {
  const [snapshot, setSnapshot] = useState<SimSnapshot>(EMPTY);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const simulator = useRef<TeachingSimulator | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  useEffect(() => {
    if (!netlist) return;
    let cancelled = false;
    setReady(false); setError(''); setSnapshot(EMPTY);
    let instance: TeachingSimulator | null = null;
    import('./simulation.mjs').then(async ({ TeachingSimulator }) => {
      instance = new TeachingSimulator(netlist);
      const state = await instance.initialize();
      if (cancelled) { instance.shutdown(); return; }
      simulator.current = instance; setSnapshot(state); setReady(true);
    }).catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; if (instance) instance.shutdown(); simulator.current = null; };
  }, [netlist]);
  const act = useCallback((fn: (sim: TeachingSimulator) => Promise<SimSnapshot>) => {
    const instance = simulator.current;
    if (!instance) return;
    queue.current = queue.current.then(async () => {
      if (instance !== simulator.current) return;
      try { const state = await fn(instance); if (instance === simulator.current) setSnapshot(state); }
      catch (e) { if (instance === simulator.current) setError((e as Error).message); }
    });
  }, []);
  const step = useCallback(() => act((s) => s.step()), [act]);
  const input = useCallback((name: string, binary: string) => act((s) => s.input(name, binary)), [act]);
  const reset = useCallback(() => act(async (s) => { s.samples = []; s.cycles = 0; s.index = 0; return s.initialize(); }), [act]);
  return { ...snapshot, error, ready, step, input, reset };
}
