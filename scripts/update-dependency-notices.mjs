import { readFile, writeFile, readdir, mkdir, cp } from 'node:fs/promises';
import path from 'node:path';
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'));
const inventory = JSON.parse(await readFile('docs/dependency-licenses.json', 'utf8'));
const previous = new Map(inventory.packages.map((item) => [`${item.name}@${item.version}`, item]));
const direct = { ...lock.packages[''].dependencies, ...lock.packages[''].devDependencies };
const packages = [];
for (const [directory, entry] of Object.entries(lock.packages)) {
  if (!directory) continue;
  const name = directory.split('node_modules/').at(-1);
  const old = previous.get(`${name}@${entry.version}`);
  if (old) { packages.push(old); continue; }
  let meta = {};
  try { meta = JSON.parse(await readFile(path.join(directory, 'package.json'), 'utf8')); } catch {}
  const output = `licenses/dependencies/${name.replace(/^@/, '').replaceAll('/', '-')}-${entry.version}`;
  const licenseFiles = [];
  try {
    for (const file of await readdir(directory, { withFileTypes: true })) {
      if (!file.isFile() || !/^(license|licence|copying|notice)(\.|$)/i.test(file.name)) continue;
      await mkdir(output, { recursive: true });
      const target = `${output}/${file.name}`;
      await cp(path.join(directory, file.name), target);
      licenseFiles.push(target);
    }
  } catch {}
  const repository = typeof meta.repository === 'string' ? meta.repository : meta.repository?.url || '';
  packages.push({ name, version: entry.version, license: entry.license || meta.license || 'See upstream notices', direct: Boolean(direct[name]), dev: Boolean(entry.dev), optional: Boolean(entry.optional), source: repository.replace(/^git\+/, '').replace(/^git:\/\//, 'https://').replace(/\.git$/, ''), npm: `https://www.npmjs.com/package/${name}`, licenseFiles });
}
packages.sort((a, b) => a.name.localeCompare(b.name));
await writeFile('docs/dependency-licenses.json', `${JSON.stringify({ ...inventory, checked: '2026-10-12', packages }, null, 2)}\n`);
console.log(`Dependency inventory: ${packages.length} locked entries; new installed notices copied.`);
