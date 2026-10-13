import { createHash } from 'node:crypto';
import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, rename, stat, readFile, writeFile, unlink } from 'node:fs/promises';
import { pipeline } from 'node:stream/promises';
import { Readable, Transform } from 'node:stream';
import { createGunzip } from 'node:zlib';
import path from 'node:path';

// Licensed DB-IP City Lite snapshot. Update URL/checksum together from its download page.
const source = 'https://download.db-ip.com/free/dbip-city-lite-2026-10.mmdb.gz';
const expectedSha1 = 'df17bd24390108ed1d24dcb7718dc60f6b9abd4f';
const destination = path.resolve('.data/dbip-city.mmdb');
await mkdir(path.dirname(destination), { recursive: true });
try {
  const metadata = JSON.parse(await readFile(`${destination}.json`, 'utf8'));
  if (metadata.source === source && metadata.sha1 === expectedSha1 && (await stat(destination)).size > 1000000) { console.log('Local geolocation database already prepared.'); process.exit(0); }
} catch {}
console.log('Preparing DB-IP City Lite October 2026 (CC BY 4.0). No visitor data is sent.');
const response = await fetch(source, { signal: AbortSignal.timeout(180000) });
if (!response.ok || !response.body) throw new Error('Could not download the location database.');
const compressed = `${destination}.gz`, temporary = `${destination}.part`;
let total = 0;
const bound = new Transform({ transform(chunk, encoding, callback) { total += chunk.length; callback(total > 150000000 ? new Error('Download exceeds expected size.') : null, chunk); } });
await pipeline(Readable.fromWeb(response.body), bound, createWriteStream(compressed));
await pipeline(createReadStream(compressed), createGunzip(), createWriteStream(temporary));
const hash = createHash('sha1');
for await (const chunk of createReadStream(temporary)) hash.update(chunk);
// DB-IP publishes its checksum for the uncompressed MMDB, not the gzip archive.
if (hash.digest('hex') !== expectedSha1) throw new Error('DB-IP database did not match its published checksum.');
await rename(temporary, destination);
await unlink(compressed);
await writeFile(`${destination}.json`, JSON.stringify({ source, sha1: expectedSha1, release: '2026-10', license: 'CC-BY-4.0', attribution: 'https://db-ip.com' }, null, 2));
console.log('Local geolocation database verified and ready.');
