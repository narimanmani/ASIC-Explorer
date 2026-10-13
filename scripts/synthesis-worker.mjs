import { compileSource } from '../lib/compile.mjs';

let input = '';
for await (const chunk of process.stdin) input += chunk;
try {
  const { source, top } = JSON.parse(input);
  const result = await compileSource(source, top);
  process.stdout.write(JSON.stringify(result));
} catch (error) {
  process.stderr.write(error.message ?? String(error));
  process.exitCode = 1;
}
