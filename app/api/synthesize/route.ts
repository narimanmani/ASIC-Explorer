import { spawn } from 'node:child_process';
import path from 'node:path';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

let active = 0;
export async function POST(request: Request) {
  if (active >= 2) return NextResponse.json({ error: 'The synthesis engine is busy. Please try again in a moment.' }, { status: 429 });
  const text = await request.text();
  if (text.length > 24000) return NextResponse.json({ error: 'Keep teaching examples under 24,000 characters.' }, { status: 413 });
  let body: { source?: unknown; top?: unknown };
  try { body = JSON.parse(text); } catch { return NextResponse.json({ error: 'Invalid synthesis request.' }, { status: 400 }); }
  if (typeof body.source !== 'string' || typeof body.top !== 'string' || !/^[a-zA-Z_][a-zA-Z0-9_]{0,63}$/.test(body.top)) {
    return NextResponse.json({ error: 'Provide HDL source and a valid top-module name.' }, { status: 400 });
  }
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
      const timeout = setTimeout(() => finish(new Error('This example exceeded the 30-second synthesis limit. Try a smaller design.')), 30000);
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
