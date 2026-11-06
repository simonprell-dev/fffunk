// TypeScript-Module der App in Node-Skripten nutzen (esbuild kommt mit Vite).
import { build } from 'esbuild';

export async function loadTs(entry) {
  const out = await build({ entryPoints: [entry], bundle: true, write: false, platform: 'node', format: 'esm', logLevel: 'silent' });
  const code = out.outputFiles[0].text;
  return import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
}
