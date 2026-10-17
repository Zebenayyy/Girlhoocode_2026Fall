// Copies MediaPipe's wasm runtime into public/ so the page works without a CDN.
// Runs automatically before `npm run dev` and `npm run build`.
import { cpSync, mkdirSync } from 'node:fs';

const from = 'node_modules/@mediapipe/tasks-vision/wasm';
const to = 'public/mediapipe/wasm';
const files = [
  'vision_wasm_internal.js',
  'vision_wasm_internal.wasm',
  'vision_wasm_nosimd_internal.js',
  'vision_wasm_nosimd_internal.wasm',
];

mkdirSync(to, { recursive: true });
for (const f of files) cpSync(`${from}/${f}`, `${to}/${f}`);
console.log(`Copied MediaPipe wasm to ${to}`);
