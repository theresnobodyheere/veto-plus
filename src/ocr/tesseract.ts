// Lecture de texte hors ligne avec Tesseract (moteur et langues hébergés avec l'appli).
import type { Worker } from 'tesseract.js';

let workerPromise: Promise<Worker> | null = null;

const asset = (p: string) => new URL(p, document.baseURI).href;

let progressCb: ((p: number) => void) | undefined;

async function getWorker(onProgress?: (p: number) => void): Promise<Worker> {
  progressCb = onProgress;
  if (!workerPromise) {
    workerPromise = (async () => {
      const { createWorker } = await import('tesseract.js');
      // Version SIMD (iOS ≥ 16.4), sinon version de base ; les deux sont en cache hors ligne
      const make = (core: string) => createWorker(['fra', 'eng'], 1, {
        workerPath: asset('tesseract/worker.min.js'),
        corePath: asset(`tesseract/core/${core}`),
        langPath: asset('tesseract/lang'),
        workerBlobURL: false,
        logger: (m) => { if (m.status === 'recognizing text') progressCb?.(m.progress); },
      });
      try {
        return await make('tesseract-core-simd-lstm.wasm.js');
      } catch {
        return await make('tesseract-core-lstm.wasm.js');
      }
    })().catch((e) => { workerPromise = null; throw e; });
  }
  return workerPromise;
}

/** Prépare l'image pour l'OCR : niveaux de gris, contraste, taille raisonnable */
async function preprocess(blob: Blob): Promise<HTMLCanvasElement> {
  const bmp = await createImageBitmap(blob);
  const scale = Math.min(1, 2200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas');
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  ctx.filter = 'grayscale(1) contrast(1.35)';
  ctx.drawImage(bmp, 0, 0, c.width, c.height);
  bmp.close?.();
  return c;
}

export async function ocrImage(blob: Blob, onProgress?: (p: number) => void): Promise<string> {
  const worker = await getWorker(onProgress);
  const canvas = await preprocess(blob);
  const { data } = await worker.recognize(canvas);
  return data.text;
}
