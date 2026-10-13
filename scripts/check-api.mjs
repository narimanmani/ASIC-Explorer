import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const base = (process.env.ASIC_EXPLORER_URL || 'http://127.0.0.1:4175').replace(/\/$/, '');
const example = JSON.parse(await readFile(new URL('../public/examples/counter.json', import.meta.url), 'utf8'));
const send = (body) => fetch(`${base}/api/synthesize`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) });
let response = await send({ source: example.source.replace("count + 4'd1", "count + 4'd3"), top: 'event_counter' });
assert.equal(response.status, 200);
const result = await response.json();
assert.ok(result.source.includes("4'd3")); assert.equal(result.ports[3].width, 4);
response = await send({ source: 'module event_counter (input logic clk; endmodule', top: 'event_counter' });
assert.equal(response.status, 422); assert.match((await response.json()).error, /ERROR|syntax error/i);
response = await send({ source: example.source, top: 'event_counter; shell' }); assert.equal(response.status, 400);
response = await send('{ invalid json'); assert.equal(response.status, 400);
response = await send({ source: ' '.repeat(25000), top: 'event_counter' }); assert.equal(response.status, 413);
response = await fetch(`${base}/api/synthesize`); assert.equal(response.status, 405);
response = await fetch(`${base}/tutorial/ASIC_Design_Flow_Tutorial.pdf`); assert.equal(response.status, 200); assert.ok((await response.arrayBuffer()).byteLength > 100000);
for (const id of ['counter', 'step-two', 'async', 'mux', 'gates']) {
  const asset = await fetch(`${base}/examples/${id}.json`); assert.equal(asset.status, 200);
}
console.log('API checks passed: edited synthesis, syntax diagnostics, input limits, methods, tutorial PDF, and all five prepared examples.');
