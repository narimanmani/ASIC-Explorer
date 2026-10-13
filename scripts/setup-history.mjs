import { randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { hashPassword } from '../lib/history-security.mjs';

const destination = process.argv[2] || path.join(os.homedir(), '.codex', 'private', 'asic-explorer-history');
await mkdir(destination, { recursive: true, mode: 0o700 });
const password = randomBytes(24).toString('base64url');
const config = { HISTORY_ENABLED: 'true', HISTORY_SECRET: randomBytes(32).toString('hex'), HISTORY_PASSWORD_HASH: await hashPassword(password), HISTORY_SITE_ORIGIN: 'http://127.0.0.1:4177', HISTORY_LOCAL: 'true' };
await writeFile(path.join(destination, 'config.json'), JSON.stringify(config, null, 2), { mode: 0o600, flag: 'wx' });
await writeFile(path.join(destination, 'access.txt'), `ASIC Explorer private history\n\nPassword: ${password}\n\nKeep this file private. The password is not saved in the repository.\nLive path after activation: /history\nLocal review: http://127.0.0.1:4177/history\n`, { mode: 0o600, flag: 'wx' });
console.log(`Private history configuration created at ${destination}. Password not printed.`);
