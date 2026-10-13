import { runYosys, version } from '@yowasp/yosys';
import { createRequire } from 'node:module';
const converter = createRequire(import.meta.url)('yosys2digitaljs/core');
const plainLog = (value) => value.replace(/\u001b\[[0-?]*[ -/]*[@-~]/g, '');

export async function compileSource(source, top = 'event_counter') {
  let log = '';
  const decoder = new TextDecoder();
  const output = (bytes) => { if (bytes) log += decoder.decode(bytes); };
  let files;
  try { files = await runYosys(['-Q', '-T', '-p',
    `read_verilog -sv design.sv; hierarchy -check -top ${top}; proc; flatten; opt; check -assert; write_json behavior.json; techmap; opt; abc -g AND,OR,XOR,MUX; clean; check -assert; write_json gates.json; stat`,
  ], { 'design.sv': source }, { stdout: output, stderr: output, fetchProgress: () => {} }); }
  catch (error) { throw new Error(plainLog(log).slice(-6000) || error.message); }
  const parse = (name) => JSON.parse(typeof files[name] === 'string' ? files[name] : decoder.decode(files[name]));
  const behavior = parse('behavior.json');
  const gates = parse('gates.json');
  const convert = converter.yosys2digitaljs ?? converter;
  const [behaviorCircuit, gateCircuit] = await Promise.all([
    convert(behavior, { layout: false }), convert(gates, { layout: false }),
  ]);
  const module = behavior.modules[top];
  const ports = Object.entries(module.ports).map(([name, p]) => ({ name, direction: p.direction, width: p.bits.length }));
  const stats = (netlist) => {
    const counts = {};
    for (const cell of Object.values(netlist.modules[top].cells)) counts[cell.type] = (counts[cell.type] ?? 0) + 1;
    return { cells: Object.values(counts).reduce((a, b) => a + b, 0), types: counts };
  };
  return { source, top, version, ports, behavior: behaviorCircuit, gates: gateCircuit, stats: { behavior: stats(behavior), gates: stats(gates) }, log: plainLog(log) };
}
