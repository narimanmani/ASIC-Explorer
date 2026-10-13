import { NextRequest, NextResponse } from 'next/server';
import { HISTORY_COOKIE, PRIVATE_HEADERS, historyConfig, validToken } from '@/lib/history-security.mjs';
import { historyStore } from '@/lib/history-store.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  if (!validToken(request.cookies.get(HISTORY_COOKIE)?.value, historyConfig())) return NextResponse.json({ error: 'Sign in to view history.' }, { status: 401, headers: PRIVATE_HEADERS });
  try {
    const data = await (await historyStore()).list(Object.fromEntries(request.nextUrl.searchParams));
    return NextResponse.json(data, { headers: PRIVATE_HEADERS });
  } catch { return NextResponse.json({ error: 'History storage is unavailable.' }, { status: 503, headers: PRIVATE_HEADERS }); }
}
