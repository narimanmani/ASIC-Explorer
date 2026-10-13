import { randomUUID } from 'node:crypto';
import { after, NextRequest, NextResponse } from 'next/server';
import { historyConfig, LESSON_IDS, VISITOR_COOKIE, issueToken, validToken, visitorId, sameOrigin, proxyAddress, browserLabel, createAttemptLimiter, loginKey } from '@/lib/history-security.mjs';
import { historyEnabled, historyStore } from '@/lib/history-store.mjs';
import { approximateLocation } from '@/lib/history-geo.mjs';
import { readBoundedBody } from '@/lib/synthesis-guards.mjs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const budget = createAttemptLimiter(16, 120, 60000);
export async function POST(request: NextRequest) {
  const config = historyConfig();
  const response = () => new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  if (!config || !historyEnabled() || request.headers.get('dnt') === '1' || request.headers.get('sec-gpc') === '1') return response();
  if (!sameOrigin(request, config)) return new NextResponse(null, { status: 403 });
  const retry = budget(loginKey(request, config));
  if (retry) return new NextResponse(null, { status: 429, headers: { 'Retry-After': String(retry) } });
  let lesson: string;
  try {
    const body = JSON.parse(await readBoundedBody(request, 1024, 2000));
    if (Object.keys(body).length !== 1 || !LESSON_IDS.includes(body.lesson)) return new NextResponse(null, { status: 400 });
    lesson = body.lesson;
  } catch { return new NextResponse(null, { status: 400 }); }
  const supplied = request.cookies.get(VISITOR_COOKIE)?.value;
  const token = validToken(supplied, config, 'visitor') ? supplied! : issueToken(config, 'visitor');
  const id = visitorId(token, config);
  const ip = proxyAddress(request.headers);
  const browser = browserLabel(request.headers.get('user-agent') || '');
  after(async () => {
    try {
      const store = await historyStore();
      const location = await approximateLocation(ip);
      await store.record({ id: randomUUID(), visitorId: id, lesson, browser, ...location });
    } catch { console.warn('Visitor history capture unavailable; teaching continues.'); }
  });
  const result = response();
  if (!supplied || supplied !== token) result.cookies.set(VISITOR_COOKIE, token, { httpOnly: true, secure: config.secure, sameSite: 'lax', path: '/', maxAge: 30 * 86400 });
  return result;
}
