import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const hosted = Boolean(process.env.DYNO);
const port = process.env.PORT || '4175';
if (!/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error('PORT must be a valid TCP port.');
}
const server = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start',
  '-H', hosted ? '0.0.0.0' : '127.0.0.1', '-p', port], {
  stdio: 'inherit', windowsHide: true,
});
for (const signal of ['SIGTERM', 'SIGINT']) {
  process.on(signal, () => server.kill(signal));
}
server.on('error', (error) => { console.error(error.message); process.exitCode = 1; });
server.on('exit', (code) => { process.exitCode = code ?? 1; });
