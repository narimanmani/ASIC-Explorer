import { NextRequest, NextResponse } from 'next/server';
import { HISTORY_COOKIE, PRIVATE_HEADERS, historyConfig, sameOrigin } from '@/lib/history-security.mjs';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  const config = historyConfig();
  if (!config || !sameOrigin(request, config)) return new NextResponse('Request rejected.', { status: 403, headers: PRIVATE_HEADERS });
  const result = request.headers.get('accept')?.includes('application/json') ? NextResponse.json({ ok: true }, { headers: PRIVATE_HEADERS }) : NextResponse.redirect(new URL('/history', config.origin), { status: 303, headers: PRIVATE_HEADERS });
  result.cookies.set(HISTORY_COOKIE, '', { httpOnly: true, secure: config.secure, sameSite: 'strict', path: '/history', maxAge: 0 });
  return result;
}
