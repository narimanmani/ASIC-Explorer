import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TeachingSimulator } from '../lib/simulation.mjs';
import { compileSource } from '../lib/compile.mjs';
import { timing, START_CELLS, COMPACT_CELLS, wireLength } from '../lib/physics.mjs';

const example = async (id) => JSON.parse(await readFile(new URL(`../public/examples/${id}.json`, import.meta.url), 'utf8'));
const decimal = (state, name = 'count') => parseInt(state.values[name], 2);

test('counter reset priority, enable hold, and modulo wrap are correct in both abstractions', async () => {
  const compiled = await example('counter');
  for (const mode of ['behavior', 'gates']) {
    const sim = new TeachingSimulator(compiled[mode]);
    try {
      assert.equal(decimal(await sim.initialize()), 0);
      for (let n = 1; n <= 17; n++) assert.equal(decimal(await sim.step()), n % 16);
      await sim.input('en', '0');
      assert.equal(decimal(await sim.step()), 1);
      assert.equal(decimal(await sim.input('rst', '1')), 1, 'synchronous reset must wait for the edge');
      assert.equal(decimal(await sim.step()), 0, 'reset must win even while enable is low');
    } finally { sim.shutdown(); }
  }
});
test('asynchronous reset changes state between clock edges', async () => {
  const compiled = await example('async');
  for (const mode of ['behavior', 'gates']) {
    const sim = new TeachingSimulator(compiled[mode]);
    try { await sim.initialize(); assert.equal(decimal(await sim.step()), 1); assert.equal(decimal(await sim.input('rst', '1')), 0); }
    finally { sim.shutdown(); }
  }
});
test('increment-by-two circuit changes behavior and mapped structure', async () => {
  const counter = await example('counter'), changed = await example('step-two');
  assert.notDeepEqual(changed.stats.gates.types, counter.stats.gates.types);
  for (const mode of ['behavior', 'gates']) {
    const sim = new TeachingSimulator(changed[mode]);
    try { await sim.initialize(); for (let n = 1; n <= 9; n++) assert.equal(decimal(await sim.step()), (2 * n) % 16); }
    finally { sim.shutdown(); }
  }
});
test('combinational examples satisfy complete truth tables in both abstractions', async () => {
  for (const id of ['mux', 'gates']) {
    const compiled = await example(id);
    for (const mode of ['behavior', 'gates']) {
      const sim = new TeachingSimulator(compiled[mode]);
      try {
        await sim.initialize();
        for (let n = 0; n < 8; n++) {
          const a = n & 1, b = (n >> 1) & 1, c = (n >> 2) & 1;
          await sim.input('a', String(a)); await sim.input('b', String(b));
          const result = await sim.input(id === 'mux' ? 'sel' : 'c', String(c));
          assert.equal(decimal(result, 'y'), id === 'mux' ? (c ? b : a) : ((a & b) ^ c));
        }
      } finally { sim.shutdown(); }
    }
  }
});
test('waveforms retain settled rising and falling samples and bound history', async () => {
  const sim = new TeachingSimulator((await example('counter')).behavior);
  try {
    await sim.initialize(); const first = await sim.step();
    assert.equal(first.samples[1].values.clk, '1'); assert.equal(first.samples[1].values.count, '0001');
    assert.equal(first.samples[2].values.clk, '0'); assert.equal(first.samples[2].values.count, '0001');
    for (let i = 0; i < 40; i++) await sim.step();
    assert.equal(sim.snapshot().samples.length, 32); assert.equal(sim.snapshot().cycles, 41);
  } finally { sim.shutdown(); }
});
test('timing examples match the tutorial; a slower clock does not fix hold', () => {
  const base = { period: 2, clockToQMax: .15, logicMax: .85, wireMax: .25, setup: .15, uncertainty: .30, clockToQMin: .06, logicMin: .03, wireMin: .01, hold: .12, holdUncertainty: .02 };
  const before = timing(base), after = timing({ ...base, wireMax: .60 }), slow = timing({ ...base, period: 3 });
  assert.ok(Math.abs(before.setupSlack - .30) < 1e-9);
  assert.ok(Math.abs(after.setupSlack + .05) < 1e-9);
  assert.ok(Math.abs(before.holdSlack + .04) < 1e-9);
  assert.equal(slow.holdSlack, before.holdSlack);
  const skew = timing({ ...base, skew: .15 });
  assert.ok(skew.setupSlack > before.setupSlack && skew.holdSlack < before.holdSlack);
  const fix = timing({ ...base, holdBuffer: .06 });
  assert.ok(fix.holdSlack > 0 && fix.setupSlack < before.setupSlack);
});
test('placement metric responds to actual cell movement', () => {
  assert.equal(wireLength(START_CELLS), 1020);
  assert.ok(wireLength(COMPACT_CELLS) < wireLength(START_CELLS));
  const translated = START_CELLS.map((c) => ({ ...c, x: c.x + 50, y: c.y + 50 }));
  assert.equal(wireLength(translated), wireLength(START_CELLS));
});
test('new HDL is genuinely synthesized and carries source provenance', async () => {
  const original = await example('counter');
  const compiled = await compileSource(original.source.replace("count + 4'd1", "count + 4'd3"));
  assert.ok(Object.values(compiled.behavior.devices).some((d) => d.source_positions?.some((p) => p.from.line === 11)));
  const sim = new TeachingSimulator(compiled.gates);
  try { await sim.initialize(); assert.equal(decimal(await sim.step()), 3); assert.equal(decimal(await sim.step()), 6); }
  finally { sim.shutdown(); }
});
test('invalid HDL produces a source diagnostic instead of a fake circuit', async () => {
  await assert.rejects(() => compileSource('module event_counter( input logic clk; endmodule'), /ERROR|syntax error/i);
});
