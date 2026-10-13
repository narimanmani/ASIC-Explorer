// The published CommonJS headless entry also works under Node for model tests.
import digitaljs from '../node_modules/digitaljs/lib/circuit.js';
import { Vector3vl } from '3vl';
const { HeadlessCircuit } = digitaljs;

// DigitalJS's real event-driven logic engine is shared by the UI and model tests.
export class TeachingSimulator {
  constructor(netlist) {
    this.circuit = new HeadlessCircuit(netlist);
    this.netlist = netlist;
    this.inputs = Object.entries(netlist.devices).filter(([, d]) => d.type === 'Input');
    this.outputs = Object.entries(netlist.devices).filter(([, d]) => d.type === 'Output');
    this.samples = []; this.cycles = 0; this.index = 0;
  }
  async settle() {
    let events = 0;
    while (this.circuit.hasPendingEvents) {
      if (++events > 2000) throw new Error('The circuit did not settle. Check for combinational feedback.');
      await this.circuit.updateGatesNext();
    }
  }
  write(name, binary) {
    const entry = this.inputs.find(([, d]) => d.net === name);
    if (!entry) return;
    const [id, dev] = entry;
    this.circuit.setInput(id, Vector3vl.fromBin(binary, dev.bits));
  }
  async initialize() {
    for (const [, dev] of this.inputs) this.write(dev.net, '0'.repeat(dev.bits));
    await this.settle();
    const hasClock = this.inputs.some(([, d]) => d.net === 'clk');
    const hasReset = this.inputs.some(([, d]) => d.net === 'rst');
    if (hasReset) {
      this.write('rst', '1'); await this.settle();
      if (hasClock) { this.write('clk', '1'); await this.settle(); this.write('clk', '0'); await this.settle(); }
      this.write('rst', '0'); await this.settle();
    }
    this.write('en', '1'); await this.settle();
    this.record(false);
    return this.snapshot();
  }
  read() {
    /** @type {Record<string, string>} */
    const values = {};
    /** @type {Record<string, string>} */
    const signals = {};
    const graph = this.circuit.getLabelIndex().graph;
    for (const [id, dev] of Object.entries(this.netlist.devices)) {
      const cell = graph.getCell(id);
      if (!cell) continue;
      for (const [port, vec] of Object.entries(cell.get('outputSignals') ?? {})) signals[`${id}:${port}`] = vec.toBin();
      if (dev.type === 'Input') values[dev.net] = cell.get('outputSignals').out.toBin();
      if (dev.type === 'Output') values[dev.net] = this.circuit.getOutput(id).toBin();
    }
    return { values, signals };
  }
  record(edge) {
    this.samples.push({ index: this.index++, edge, values: this.read().values });
    this.samples = this.samples.slice(-32);
  }
  /** @returns {import('./types').SimSnapshot} */
  snapshot() { return { ...this.read(), samples: [...this.samples], cycles: this.cycles }; }
  async input(name, binary) {
    this.write(name, binary); await this.settle(); this.record(false);
    return this.snapshot();
  }
  async step() {
    this.write('clk', '0'); await this.settle();
    this.write('clk', '1'); await this.settle(); this.cycles++; this.record(true);
    this.write('clk', '0'); await this.settle(); this.record(false);
    return this.snapshot();
  }
  shutdown() { this.circuit.shutdown(); }
}
