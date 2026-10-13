import { spawn } from 'node:child_process';
import path from 'node:path';
import { publicAddress } from './history-security.mjs';

let active = false;
const empty = (status) => ({ country: '', region: '', city: '', locationStatus: status });
export async function approximateLocation(ip) {
  if (!publicAddress(ip)) return empty(ip ? 'Private network' : 'Unavailable');
  if (active) return empty('Lookup busy');
  active = true;
  try {
    return await new Promise((resolve) => {
      const child = spawn(process.execPath, ['--max-old-space-size=96', path.resolve('scripts/geoip-worker.mjs')], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
      let output = '', done = false;
      const finish = (value) => { if (done) return; done = true; clearTimeout(timer); child.kill(); resolve(value); };
      const timer = setTimeout(() => finish(empty('Unavailable')), 5000);
      child.on('error', () => finish(empty('Unavailable')));
      child.stdin.on('error', () => {});
      child.stdout.on('data', (data) => { output += data; if (output.length > 2048) finish(empty('Unavailable')); });
      child.on('close', (code) => {
        try { const result = JSON.parse(output); finish(code === 0 && /^[A-Z]{2}$/.test(result.country || '') ? { country: result.country, region: result.region, city: result.city, locationStatus: 'IP estimate' } : empty('Unavailable')); }
        catch { finish(empty('Unavailable')); }
      });
      child.stdin.end(JSON.stringify({ ip, file: path.resolve(process.env.HISTORY_GEOIP_FILE || '.data/dbip-city.mmdb') }));
    });
  } finally { active = false; }
}
