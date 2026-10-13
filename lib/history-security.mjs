import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { isIP } from 'node:net';

const derive = promisify(scrypt);
export const HISTORY_COOKIE = 'asic_history_session';
export const VISITOR_COOKIE = 'asic_visitor';
export const LESSON_IDS = ['intent', 'rtl', 'synthesis', 'timing', 'floorplan', 'clock', 'routing', 'signoff'];
export const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store, max-age=0', 'X-Robots-Tag': 'noindex, nofollow, noarchive', 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY' };

export function historyConfig(env = process.env) {
  let origin;
  try { origin = new URL(env.HISTORY_SITE_ORIGIN || 'http://127.0.0.1:4175').origin; } catch { return null; }
  if (env.DYNO && !origin.startsWith('https://')) return null;
  if (!/^[a-f0-9]{64,128}$/.test(env.HISTORY_SECRET || '') || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(env.HISTORY_PASSWORD_HASH || '')) return null;
  return { secret: env.HISTORY_SECRET, passwordHash: env.HISTORY_PASSWORD_HASH, origin, secure: origin.startsWith('https://') };
}

export async function hashPassword(password) {
  if (typeof password !== 'string' || password.length < 16 || Buffer.byteLength(password) > 256) throw new Error('Use a password of 16 to 256 bytes.');
  const salt = randomBytes(16).toString('hex');
  const key = await derive(password, salt, 64);
  return `scrypt:${salt}:${key.toString('hex')}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== 'string' || Buffer.byteLength(password) > 256 || !/^scrypt:[a-f0-9]{32}:[a-f0-9]{128}$/.test(stored || '')) return false;
  const [, salt, expected] = stored.split(':');
  const actual = await derive(password, salt, 64);
  return timingSafeEqual(actual, Buffer.from(expected, 'hex'));
}
const mac = (value, config, purpose) => createHmac('sha256', config.secret).update(`${purpose}:${config.passwordHash}:${value}`).digest('base64url');
export function issueToken(config, purpose = 'admin', now = Date.now()) {
  const lifetime = purpose === 'admin' ? 4 * 3600000 : 30 * 86400000;
  const value = `${randomUUID()}.${now + lifetime}`;
  return `${value}.${mac(value, config, purpose)}`;
}
export function validToken(token, config, purpose = 'admin', now = Date.now()) {
  if (!config || typeof token !== 'string' || token.length > 180) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^[a-f0-9-]{36}$/.test(parts[0]) || !/^\d{13}$/.test(parts[1]) || !/^[A-Za-z0-9_-]{43}$/.test(parts[2])) return false;
  const expires = Number(parts[1]), maxLife = purpose === 'admin' ? 4 * 3600000 : 30 * 86400000;
  if (expires <= now || expires > now + maxLife) return false;
  const expected = mac(parts.slice(0, 2).join('.'), config, purpose);
  return timingSafeEqual(Buffer.from(parts[2]), Buffer.from(expected));
}
export function visitorId(token, config) {
  return createHmac('sha256', config.secret).update(`visitor-id:${token.split('.')[0]}`).digest('hex').slice(0, 24);
}
export function sameOrigin(request, config) {
  return Boolean(config && request.headers.get('origin') === config.origin && !['cross-site', 'none'].includes(request.headers.get('sec-fetch-site') || ''));
}
export function proxyAddress(headers, hosted = Boolean(process.env.DYNO)) {
  if (!hosted) return null; // Local requests never trust visitor-supplied forwarding headers.
  const header = headers.get('x-forwarded-for') || '';
  if (header.length > 2048) return null;
  const last = header.split(',').at(-1)?.trim(); // Heroku appends its peer on the right.
  if (!last || !isIP(last)) return null;
  if (last.toLowerCase().startsWith('::ffff:') && isIP(last.slice(7)) === 4) return last.slice(7);
  return isIP(last) === 6 ? new URL(`http://[${last}]`).hostname.slice(1, -1) : last;
}
export function publicAddress(ip) {
  if (isIP(ip || '') === 4) {
    const [a, b, c] = ip.split('.').map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 192 && b === 0 && [0, 2].includes(c)) || (a === 198 && [18, 19].includes(b)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (isIP(ip || '') === 6) return /^[23]/i.test(ip) && !/^2001:(db8|0:|2:)/i.test(ip);
  return false;
}
export function browserLabel(ua = '') {
  const text = ua.slice(0, 512);
  if (/bot|crawl|spider|headless/i.test(text)) return 'Automated';
  if (/Edg\//.test(text)) return 'Edge';
  if (/Firefox\//.test(text)) return 'Firefox';
  if (/Chrome\//.test(text)) return 'Chrome';
  if (/Safari\//.test(text)) return 'Safari';
  return 'Other';
}
export function createAttemptLimiter(maxPerKey = 5, maxTotal = 50, windowMs = 15 * 60000, now = Date.now) {
  let start = now(), total = 0;
  const keys = new Map();
  return (key) => {
    const time = now();
    if (time - start >= windowMs) { start = time; total = 0; keys.clear(); }
    const count = keys.get(key) || 0;
    if (total >= maxTotal || count >= maxPerKey) return Math.max(1, Math.ceil((windowMs - (time - start)) / 1000));
    total++; keys.set(key, count + 1);
    return 0;
  };
}
export function loginKey(request, config) {
  return createHmac('sha256', config.secret).update(proxyAddress(request.headers) || 'local').digest('hex');
}
