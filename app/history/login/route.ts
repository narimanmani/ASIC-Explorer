import { NextRequest, NextResponse } from 'next/server';
import { HISTORY_COOKIE, PRIVATE_HEADERS, historyConfig, sameOrigin, verifyPassword, issueToken, loginKey, createAttemptLimiter } from '@/lib/history-security.mjs';
import { readBoundedBody } from '@/lib/synthesis-guards.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const attempts = createAttemptLimiter();
let verifying = false;
export async function POST(request: NextRequest) {
  const config = historyConfig();
  if (!config) return new NextResponse('History access is not configured.', { status: 503, headers: PRIVATE_HEADERS });
  if (!sameOrigin(request, config)) return new NextResponse('Request rejected.', { status: 403, headers: PRIVATE_HEADERS });
  const retry = attempts(loginKey(request, config));
  if (retry) return new NextResponse('Too many sign-in attempts. Try again in 15 minutes.', { status: 429, headers: { ...PRIVATE_HEADERS, 'Retry-After': String(retry) } });
  let password;
  try { password = new URLSearchParams(await readBoundedBody(request, 1024, 3000)).get('password'); }
  catch { return new NextResponse('Invalid request.', { status: 400, headers: PRIVATE_HEADERS }); }
  if (verifying) return new NextResponse('Sign-in is busy. Try again shortly.', { status: 429, headers: { ...PRIVATE_HEADERS, 'Retry-After': '5' } });
  let accepted = false;
  verifying = true;
  try { accepted = await verifyPassword(password, config.passwordHash); }
  finally { verifying = false; }
  const json = request.headers.get('accept')?.includes('application/json');
  if (!accepted) return json ? NextResponse.json({ error: 'Password not accepted.' }, { status: 401, headers: PRIVATE_HEADERS }) : NextResponse.redirect(new URL('/history?error=signin', config.origin), { status: 303, headers: PRIVATE_HEADERS });
  const result = json ? NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS }) : NextResponse.redirect(new URL('/history', config.origin), { status: 303, headers: PRIVATE_HEADERS });
  result.cookies.set(HISTORY_COOKIE, issueToken(config), { httpOnly: true, secure: config.secure, sameSite: 'strict', path: '/history', maxAge: 4 * 3600 });
  return result;
}
