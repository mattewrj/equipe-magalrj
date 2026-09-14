import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
await build({
  absWorkingDir: fileURLToPath(new URL('.', import.meta.url)),
  entryPoints: ['./src/effects.jsx'],
  tsconfigRaw: {},
  bundle: true,
  outfile: 'dist/effects.js',
  minify: true,
  sourcemap: false,
  format: 'esm',
  target: ['es2020'],
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'linked',
});
console.log('React Bits effects built in dist/effects.js and dist/effects.css');
