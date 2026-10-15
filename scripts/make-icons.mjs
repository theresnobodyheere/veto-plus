// Génère les icônes PNG de l'appli (croix blanche + empreinte sur fond vert), sans dépendance.
import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
mkdirSync(OUT, { recursive: true });

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function png(size, { maskable }) {
  const s = size;
  const raw = Buffer.alloc((s * 4 + 1) * s);
  const radius = maskable ? 0 : s * 0.22;
  const inset = maskable ? s * 0.18 : s * 0.1; // zone de sécurité pour les icônes maskable
  const c = s / 2;
  const arm = (s - 2 * inset) * 0.17;  // demi-largeur des bras de la croix
  const len = (s - 2 * inset) * 0.40;  // demi-longueur
  for (let y = 0; y < s; y++) {
    raw[y * (s * 4 + 1)] = 0;
    for (let x = 0; x < s; x++) {
      const i = y * (s * 4 + 1) + 1 + x * 4;
      // coins arrondis
      const dx = Math.max(radius - x, x - (s - 1 - radius), 0);
      const dy = Math.max(radius - y, y - (s - 1 - radius), 0);
      const inside = radius === 0 || dx * dx + dy * dy <= radius * radius;
      if (!inside) { raw[i + 3] = 0; continue; }
      // dégradé vert
      const t = y / s;
      let r = Math.round(13 + 10 * t), g = Math.round(148 - 40 * t), b = Math.round(136 - 30 * t);
      const ax = Math.abs(x - c), ay = Math.abs(y - c);
      const cross = (ax <= arm && ay <= len) || (ay <= arm && ax <= len);
      if (cross) { r = 255; g = 255; b = 255; }
      // petite empreinte (coussinet) au centre de la croix
      const pd = Math.hypot(x - c, (y - c - arm * 0.25) * 1.15);
      if (pd < arm * 0.62) { r = 13; g = 128; b = 120; }
      for (const [ox, oy] of [[-0.55, -0.75], [0, -0.95], [0.55, -0.75]]) {
        if (Math.hypot(x - (c + ox * arm), y - (c + oy * arm)) < arm * 0.2) { r = 13; g = 128; b = 120; }
      }
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s, 0); ihdr.writeUInt32BE(s, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(join(OUT, 'apple-touch-icon.png'), png(180, { maskable: true }));
writeFileSync(join(OUT, 'icon-192.png'), png(192, { maskable: false }));
writeFileSync(join(OUT, 'icon-512.png'), png(512, { maskable: false }));
writeFileSync(join(OUT, 'icon-maskable-512.png'), png(512, { maskable: true }));
console.log('Icônes générées dans public/icons');
