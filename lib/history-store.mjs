import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { historyConfig, LESSON_IDS } from './history-security.mjs';

export const RETENTION_DAYS = 30;
export const MAX_RECORDS = 20000;
let storePromise;
export function historyEnabled(env = process.env) {
  return env.HISTORY_ENABLED === 'true' && Boolean(historyConfig(env)) && Boolean(env.DATABASE_URL || (!env.DYNO && env.HISTORY_LOCAL === 'true'));
}
export async function openHistoryStore(options = {}) {
  if (options.localFile) {
    const { DatabaseSync } = await import('node:sqlite');
    await mkdir(path.dirname(options.localFile), { recursive: true });
    const db = new DatabaseSync(options.localFile);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=2000;');
    return makeStore({
      run: async (sql, args = []) => db.prepare(sql.replace(/\$\d+/g, '?')).run(...args),
      all: async (sql, args = []) => db.prepare(sql.replace(/\$\d+/g, '?')).all(...args),
      exec: async (sql) => db.exec(sql), close: async () => db.close(), local: true,
    });
  }
  const { Pool } = await import('pg');
  const connection = new URL(options.url);
  for (const key of ['sslmode', 'sslcert', 'sslkey', 'sslrootcert']) connection.searchParams.delete(key);
  // Heroku requires encrypted TLS and documents its self-signed server certificate.
  // Other providers retain certificate validation; supply their CA through config.
  const ssl = options.heroku ? { rejectUnauthorized: false } : { rejectUnauthorized: true, ...(options.ca ? { ca: options.ca } : {}) };
  const pool = new Pool({ connectionString: connection.toString(), ssl, max: 3, idleTimeoutMillis: 10000, connectionTimeoutMillis: 3000, query_timeout: 5000, statement_timeout: 5000 });
  pool.on('error', () => console.warn('Visitor history database connection unavailable.'));
  return makeStore({ run: async (sql, args = []) => pool.query(sql, args), all: async (sql, args = []) => (await pool.query(sql, args)).rows, exec: async (sql) => pool.query(sql), close: async () => pool.end(), local: false });
}
async function makeStore(adapter) {
  await adapter.exec(`CREATE TABLE IF NOT EXISTS asic_visitor_history (
    id TEXT PRIMARY KEY, visited_at BIGINT NOT NULL, observation_bucket BIGINT NOT NULL, visitor_id TEXT NOT NULL,
    lesson TEXT NOT NULL, country TEXT NOT NULL, region TEXT NOT NULL,
    city TEXT NOT NULL, browser TEXT NOT NULL, location_status TEXT NOT NULL,
    UNIQUE(visitor_id, lesson, observation_bucket)
  ); CREATE INDEX IF NOT EXISTS asic_history_time ON asic_visitor_history(visited_at DESC);`);
  const prune = async (now) => {
    await adapter.run('DELETE FROM asic_visitor_history WHERE visited_at < $1', [now - RETENTION_DAYS * 86400000]);
    await adapter.run(`DELETE FROM asic_visitor_history WHERE id IN (SELECT id FROM asic_visitor_history ORDER BY visited_at DESC LIMIT ${adapter.local ? '-1' : 'ALL'} OFFSET ${MAX_RECORDS})`);
  };
  return {
    local: adapter.local, close: adapter.close,
    async record(record, now = Date.now()) {
      await prune(now);
      const bucket = Math.floor(now / (15 * 60000)) * 15 * 60000;
      // One observation per visitor/lesson/15-minute bucket. No raw IP, URL, or source.
      const existing = await adapter.all('SELECT id FROM asic_visitor_history WHERE visitor_id = $1 AND lesson = $2 AND visited_at >= $3 LIMIT 1', [record.visitorId, record.lesson, bucket]);
      if (existing.length) return false;
      await adapter.run('INSERT INTO asic_visitor_history (id, visited_at, observation_bucket, visitor_id, lesson, country, region, city, browser, location_status) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING', [record.id, now, bucket, record.visitorId, record.lesson, record.country, record.region, record.city, record.browser, record.locationStatus]);
      await prune(now);
      return true;
    },
    async list(filters = {}, now = Date.now()) {
      await prune(now);
      const days = [1, 7, 30].includes(Number(filters.days)) ? Number(filters.days) : 30;
      const page = Math.max(1, Math.min(200, Number.parseInt(filters.page, 10) || 1));
      const lesson = LESSON_IDS.includes(filters.lesson) ? filters.lesson : '';
      const args = [now - days * 86400000];
      let where = 'visited_at >= $1';
      if (lesson) { args.push(lesson); where += ' AND lesson = $2'; }
      const summary = (await adapter.all(`SELECT COUNT(*) AS visits, COUNT(DISTINCT visitor_id) AS visitors, COUNT(DISTINCT CASE WHEN country != '' THEN country END) AS countries FROM asic_visitor_history WHERE ${where}`, args))[0];
      const rows = await adapter.all(`SELECT * FROM asic_visitor_history WHERE ${where} ORDER BY visited_at DESC, id DESC LIMIT 100 OFFSET ${(page - 1) * 100}`, args);
      return { rows, summary: { visits: Number(summary.visits), visitors: Number(summary.visitors), countries: Number(summary.countries) }, page, days, lesson, local: adapter.local };
    },
  };
}
export async function historyStore() {
  if (!historyEnabled()) throw new Error('History storage is not configured.');
  if (!storePromise) storePromise = openHistoryStore(process.env.DATABASE_URL ? { url: process.env.DATABASE_URL, heroku: Boolean(process.env.DYNO) && process.env.HISTORY_DATABASE_PROVIDER === 'heroku', ca: process.env.HISTORY_DATABASE_CA } : { localFile: path.resolve(process.env.HISTORY_LOCAL_FILE || '.data/visitor-history.sqlite') }).catch((error) => { storePromise = undefined; throw error; });
  return storePromise;
}
