// Hand-in program: copies the frontend and its screenshots into the output
// directory and writes the dossier the judge reads. Run it with Node 22,
// standard library only, no network:
//
//   MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside local testing the output directory is /output. The program runs
// twice and both runs must write the same bytes, so it rebuilds
// deterministically from the repository: it only creates the output
// directory (never deletes it — in the grader /output is a mount point,
// and deleting a mount point fails) and copies the same files over it.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function copyTree(name) {
  const from = join(repoRoot, name);
  const to = join(outDir, name);
  if (!existsSync(from)) throw new Error(`missing ${name}/ in the repository`);
  cpSync(from, to, { recursive: true });
}

mkdirSync(outDir, { recursive: true });
copyTree('app');
copyTree('screenshots');

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

const dossierText = Buffer.from(dossier).toString('utf8');
const totals = JSON.parse(dossierText).text.split('\n').find((line) => line.startsWith('Totals:')) || '';
console.log(`Wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
console.log(totals);
