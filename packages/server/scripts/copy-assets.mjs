// Copy non-TypeScript runtime assets that `tsc` does not emit into dist/.
// Currently: the SQL migration files, which the compiled server reads at boot.
import { cpSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverRoot = dirname(dirname(fileURLToPath(import.meta.url))); // packages/server
const from = join(serverRoot, 'src', 'db', 'migrations');
const to = join(serverRoot, 'dist', 'db', 'migrations');

mkdirSync(to, { recursive: true });
cpSync(from, to, { recursive: true });
console.log(`Copied SQL migrations -> ${to}`);
