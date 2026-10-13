import { open } from 'maxmind';
import { publicAddress } from '../lib/history-security.mjs';

let input = '';
for await (const chunk of process.stdin) { input += chunk; if (input.length > 1024) throw new Error('Invalid lookup.'); }
const { ip, file } = JSON.parse(input);
if (!publicAddress(ip)) process.stdout.write('{}');
else {
  const reader = await open(file, { cache: { max: 100 } });
  const match = reader.get(ip);
  const text = (value) => typeof value === 'string' ? value.replace(/[\x00-\x1f\x7f]/g, '').slice(0, 100) : '';
  process.stdout.write(JSON.stringify({ country: text(match?.country?.iso_code), region: text(match?.subdivisions?.[0]?.names?.en), city: text(match?.city?.names?.en) }));
}
