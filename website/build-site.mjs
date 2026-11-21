import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { build } from 'esbuild';

const out = 'site-dist';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
cpSync('website/index.html', out + '/index.html');
cpSync('website/styles.css', out + '/styles.css');
await build({
  entryPoints: ['website/app.js'],
  outfile: out + '/app.js',
  bundle: true,
  format: 'esm',
  target: ['es2022'],
  minify: true,
  sourcemap: false
});

// Reuse the upstream project's maintained video processing page and its runtime assets.
for (const file of ['video-preview.html', 'video-app.js']) {
  const source = 'dist/' + file;
  if (existsSync(source)) cpSync(source, out + '/' + file);
}
for (const folder of ['models', 'onnxruntime']) {
  const source = 'dist/' + folder;
  if (existsSync(source)) cpSync(source, out + '/' + folder, { recursive: true });
}
writeFileSync(out + '/_headers', `/*\n  Cross-Origin-Opener-Policy: same-origin\n  Cross-Origin-Embedder-Policy: require-corp\n  Cross-Origin-Resource-Policy: same-origin\n`);
console.log('Website built into site-dist/');
