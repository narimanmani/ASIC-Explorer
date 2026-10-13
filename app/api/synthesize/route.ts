import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { createSynthesisBudget, readBoundedBody, RequestBodyError } from '../../../lib/synthesis-guards.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let active = 0;
const hosted = Boolean(process.env.DYNO);
const maxActive = hosted ? 1 : 2;
const budget = createSynthesisBudget(hosted ? 6 : 0);
export async function POST(request: Request) {
  if (active >= maxActive) return NextResponse.json({ error: 'The synthesis engine is busy. Please try again in a moment.' }, { status: 429, headers: { 'Retry-After': '5' } });
  let text: string;
  try { text = await readBoundedBody(request); }
  catch (error) {
    if (error instanceof RequestBodyError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Could not read the synthesis request.' }, { status: 400 });
  }
  let body: { source?: unknown; top?: unknown };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid synthesis request.' }, { status: 400 }); }
  if (typeof body.source !== 'string' || typeof body.top !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(body.top)) {
    return NextResponse.json({ error: 'Provide HDL source and a valid top-module name.' }, { status: 400 });
  }
  if (active >= maxActive) return NextResponse.json({ error: 'The synthesis engine is busy. Please try again in a moment.' }, { status: 429, headers: { 'Retry-After': '5' } });
  const retryAfter = budget();
  if (retryAfter) return NextResponse.json({ error: `The shared demo has reached its compilation limit. Please try again in ${retryAfter} seconds. Prepared examples still work.` }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  active++;
  try {
    const result = await new Promise<string>((resolve, reject) => {
      const child = spawn(process.execPath, [path.join(process.cwd(), 'scripts/synthesis-worker.mjs')], { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
      let output = '', error = '', settled = false;
      const finish = (failure?: Error) => {
        if (settled) return;
        settled = true; clearTimeout(timeout);
        if (failure) { child.kill(); reject(failure); } else resolve(output);
      };
      const timeoutMs = hosted ? 20000 : 30000;
      const timeout = setTimeout(() => finish(new Error(`This example exceeded the ${timeoutMs / 1000}-second synthesis limit. Try a smaller design.`)), timeoutMs);
      child.stdout.on('data', (bytes) => { output += bytes; if (output.length > 5_000_000) finish(new Error('The generated design is too large for this teaching view.')); });
      child.stderr.on('data', (bytes) => { error = (error + bytes).slice(-12000); });
      child.on('error', (e) => finish(e));
      child.on('close', (code) => finish(code === 0 ? undefined : new Error(error || 'Synthesis could not complete. Check the HDL syntax.')));
      child.stdin.on('error', () => {});
      child.stdin.end(JSON.stringify({ source: body.source, top: body.top }));
    });
    return new Response(result, { headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 422 });
  } finally { active--; }
}
