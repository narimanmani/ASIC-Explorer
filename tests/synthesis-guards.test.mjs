import test from 'node:test';
import assert from 'node:assert/strict';
import { createSynthesisBudget, readBoundedBody } from '../lib/synthesis-guards.mjs';

test('request limit checks actual streamed bytes and declared content length', async () => {
  assert.equal(await readBoundedBody(new Request('http://localhost', { method: 'POST', body: '{"top":"example"}' })), '{"top":"example"}');
  await assert.rejects(readBoundedBody(new Request('http://localhost', { method: 'POST', body: 'x', headers: { 'content-length': '25000' } })), { status: 413 });
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(12001)); controller.enqueue(new Uint8Array(12000)); controller.close(); } });
  await assert.rejects(readBoundedBody(new Request('http://localhost', { method: 'POST', body, duplex: 'half' })), { status: 413 });
  await assert.rejects(readBoundedBody(new Request('http://localhost', { method: 'POST', body: 'é'.repeat(12001) })), { status: 413 });
});

test('incomplete streamed body times out without waiting indefinitely', async () => {
  let cancelled = false;
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array([1])); }, cancel() { cancelled = true; } });
  await assert.rejects(readBoundedBody(new Request('http://localhost', { method: 'POST', body, duplex: 'half' }), 24000, 20), { status: 408 });
  assert.equal(cancelled, true);
});

test('shared synthesis budget rejects excess starts and recovers after the window', () => {
  let time = 0;
  const reserve = createSynthesisBudget(2, 60000, () => time);
  assert.equal(reserve(), 0);
  assert.equal(reserve(), 0);
  assert.equal(reserve(), 60);
  time = 59999;
  assert.equal(reserve(), 1);
  time = 60000;
  assert.equal(reserve(), 0);
  assert.equal(createSynthesisBudget()(), 0);
});
