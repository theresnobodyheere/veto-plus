// Copie le moteur OCR Tesseract et les langues (fra, eng) dans public/ pour un fonctionnement hors ligne.
import { cpSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const NM = join(ROOT, 'node_modules');
const OUT = join(ROOT, 'public', 'tesseract');
mkdirSync(join(OUT, 'core'), { recursive: true });
mkdirSync(join(OUT, 'lang'), { recursive: true });
cpSync(join(NM, 'tesseract.js/dist/worker.min.js'), join(OUT, 'worker.min.js'));
for (const f of ['tesseract-core-lstm.wasm.js', 'tesseract-core-simd-lstm.wasm.js']) {
  cpSync(join(NM, 'tesseract.js-core', f), join(OUT, 'core', f));
}
for (const l of ['fra', 'eng']) {
  cpSync(join(NM, `@tesseract.js-data/${l}/4.0.0_best_int/${l}.traineddata.gz`), join(OUT, 'lang', `${l}.traineddata.gz`));
}
console.log('Tesseract copié dans public/tesseract');
