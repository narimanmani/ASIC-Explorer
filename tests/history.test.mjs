import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { hashPassword, verifyPassword, historyConfig, issueToken, validToken, sameOrigin, proxyAddress, publicAddress, visitorId, browserLabel, createAttemptLimiter } from '../lib/history-security.mjs';
import { openHistoryStore, historyEnabled } from '../lib/history-store.mjs';

test('password hashes, signed session expiry, tampering, purpose separation, and rotation', async () => {
  const password = 'example-test-password-only', hash = await hashPassword(password);
  assert.equal(await verifyPassword(password, hash), true);
  assert.equal(await verifyPassword('wrong', hash), false);
  assert.equal(await verifyPassword('x'.repeat(257), hash), false);
  const config = historyConfig({ HISTORY_SECRET: 'a'.repeat(64), HISTORY_PASSWORD_HASH: hash, HISTORY_SITE_ORIGIN: 'https://example.test', DYNO: 'web.1' });
  assert.ok(config);
  const now = 1791838800000, token = issueToken(config, 'admin', now);
  assert.equal(validToken(token, config, 'admin', now), true);
  assert.equal(validToken(token, config, 'admin', now + 4 * 3600000), false);
  assert.equal(validToken(token.slice(0, -1) + (token.endsWith('a') ? 'b' : 'a'), config, 'admin', now), false);
  assert.equal(validToken(issueToken(config, 'visitor', now), config, 'admin', now), false);
  assert.equal(validToken(token, { ...config, secret: 'b'.repeat(64) }, 'admin', now), false);
  assert.equal(validToken(token, { ...config, passwordHash: await hashPassword('different-long-password') }, 'admin', now), false);
  assert.equal(validToken(token, null), false);
  assert.equal(historyConfig({ HISTORY_SECRET: 'weak' }), null);
});
test('origin and Heroku proxy boundary reject forged locations and raw-IP identities', async () => {
  const config = { origin: 'https://example.test', secret: 'a'.repeat(64), passwordHash: 'test' };
  assert.equal(sameOrigin(new Request('https://example.test/history/login', { headers: { origin: 'https://evil.test' } }), config), false);
  assert.equal(sameOrigin(new Request('https://example.test/history/login', { headers: { origin: config.origin } }), config), true);
  assert.equal(proxyAddress(new Headers({ 'x-forwarded-for': '8.8.8.8, 1.1.1.1' }), true), '1.1.1.1');
  assert.equal(proxyAddress(new Headers({ 'x-forwarded-for': '8.8.8.8, invalid' }), true), null);
  assert.equal(proxyAddress(new Headers({ 'x-forwarded-for': '8.8.8.8' }), false), null);
  assert.equal(proxyAddress(new Headers({ 'x-forwarded-for': '::ffff:8.8.8.8' }), true), '8.8.8.8');
  for (const ip of ['127.0.0.1', '10.1.2.3', '192.168.1.1', '100.64.0.1', '::1', 'fc00::1', '2001:db8::1']) assert.equal(publicAddress(ip), false);
  for (const ip of ['8.8.8.8', '1.1.1.1', '2606:4700:4700::1111']) assert.equal(publicAddress(ip), true);
  assert.match(visitorId(issueToken(config, 'visitor'), config), /^[a-f0-9]{24}$/);
  assert.equal(browserLabel('Mozilla Chrome/120.0 Edg/120.0'), 'Edge');
  assert.equal(browserLabel('Googlebot'), 'Automated');
});
test('login limiter bounds attempts across changing visitors and recovers after the window', () => {
  let now = 0;
  const limit = createAttemptLimiter(2, 3, 60000, () => now);
  assert.equal(limit('a'), 0); assert.equal(limit('a'), 0);
  assert.equal(limit('a'), 60); assert.equal(limit('b'), 0);
  assert.equal(limit('c'), 60);
  now = 60000; assert.equal(limit('a'), 0);
});
test('history persists across reopening, samples lesson visits, filters, and expires old records', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'asic-history-test-'));
  const localFile = path.join(directory, 'history.sqlite');
  const now = 1791838800000;
  let store;
  const record = (lesson, visitor = 'anonymous-test') => ({ id: randomUUID(), visitorId: visitor, lesson, country: 'CA', region: 'British Columbia', city: 'Vancouver', browser: 'Chrome', locationStatus: 'IP estimate' });
  try {
    store = await openHistoryStore({ localFile });
    await store.record(record('intent'), now - 31 * 86400000);
    assert.equal(await store.record(record('rtl'), now), true);
    assert.equal(await store.record(record('rtl'), now + 1), false);
    await store.record(record('timing'), now + 2);
    await store.close();
    store = await openHistoryStore({ localFile });
    const data = await store.list({}, now + 3);
    assert.equal(data.summary.visits, 2); assert.equal(data.summary.visitors, 1); assert.equal(data.summary.countries, 1);
    assert.equal(data.rows[0].city, 'Vancouver');
    assert.equal('ip' in data.rows[0], false);
    assert.equal((await store.list({ lesson: 'rtl' }, now + 3)).summary.visits, 1);
    assert.equal((await store.list({ lesson: "rtl' OR 1=1 --", days: '999', page: '-8' }, now + 3)).days, 30);
    assert.equal((await store.list({}, now + 31 * 86400000)).summary.visits, 0);
  } finally { await store?.close(); await rm(directory, { recursive: true, force: true }); }
});
test('capture defaults off and Heroku cannot silently fall back to ephemeral local storage', async () => {
  const base = { HISTORY_ENABLED: 'true', HISTORY_SECRET: 'a'.repeat(64), HISTORY_PASSWORD_HASH: await hashPassword('test-password-over-sixteen'), HISTORY_SITE_ORIGIN: 'https://example.test', HISTORY_LOCAL: 'true' };
  assert.equal(historyEnabled({}), false);
  assert.equal(historyEnabled(base), true);
  assert.equal(historyEnabled({ ...base, DYNO: 'web.1' }), false);
  assert.equal(historyEnabled({ ...base, DYNO: 'web.1', DATABASE_URL: 'postgres://example' }), true);
});
