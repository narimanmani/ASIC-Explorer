import { EXAMPLES } from '../lib/examples.ts';
import { compileSource } from '../lib/compile.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/examples', { recursive: true });
for (const example of EXAMPLES) {
  const result = await compileSource(example.source, example.top);
  await writeFile(`public/examples/${example.id}.json`, JSON.stringify(result));
  console.log(`${example.id}: ${result.stats.behavior.cells} word-level cells, ${result.stats.gates.cells} generic mapped cells`);
}
