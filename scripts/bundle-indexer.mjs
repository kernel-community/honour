import { build } from 'esbuild';
import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const outfile = `${root}packages/indexer/dist/indexer.mjs`;
await mkdir(`${root}packages/indexer/dist`, { recursive: true });
await build({ absWorkingDir: root, entryPoints: ['packages/indexer/src/server.ts'], bundle: true, platform: 'node', format: 'esm', target: 'node22', outfile, minify: true,
  banner: { js: "import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" } });
console.log(`Indexer bundle: packages/indexer/dist/indexer.mjs (${Math.ceil((await stat(outfile)).size / 1024)} KiB). Requires Node 22.13+ (22.x), no npm install on the host.`);
