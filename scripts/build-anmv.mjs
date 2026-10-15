// Convertit la base publique ANMV (data.gouv.fr, XML V2) en JSON compact pour l'appli.
// Usage : node scripts/build-anmv.mjs            (télécharge l'export du jour)
//         ANMV_DIR=/chemin node scripts/build-anmv.mjs   (utilise des XML déjà extraits)
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'data', 'drugs.json');
const URL_V = 'https://pro.anses.fr/RCP/amm-vet-fr-v2-v.7z';
const URL_D = 'https://pro.anses.fr/RCP/amm-vet-fr-v2-d.xml';

// Statuts conservés : médicaments utilisables
const ACTIVE = new Set(['1', '3', '4', '13', '14', '21', '23']);

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function getFiles() {
  if (process.env.ANMV_DIR) {
    const dir = process.env.ANMV_DIR;
    const files = readdirSync(dir);
    return {
      v: join(dir, files.find((f) => /v2-v\.xml$/.test(f))),
      d: join(dir, files.find((f) => /v2-d\.xml$/.test(f))),
    };
  }
  const dir = mkdtempSync(join(tmpdir(), 'anmv-'));
  console.log('Téléchargement ANMV…');
  await download(URL_V, join(dir, 'v.7z'));
  await download(URL_D, join(dir, 'd.xml'));
  execFileSync('7z', ['x', '-y', `-o${dir}`, join(dir, 'v.7z')], { stdio: 'ignore' });
  const v = readdirSync(dir).find((f) => /v2-v\.xml$/.test(f));
  return { v: join(dir, v), d: join(dir, 'd.xml') };
}

const arr = (x) => (x == null ? [] : Array.isArray(x) ? x : [x]);
const clean = (s, max) => {
  if (s == null) return undefined;
  let t = String(s).replace(/\\n/g, '\n').replace(/\r/g, '').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  if (!t) return undefined;
  if (max && t.length > max) t = t.slice(0, max).replace(/\s+\S*$/, '') + ' […]';
  return t;
};

function sectionKey(title) {
  const t = title.toLowerCase();
  if (/espèces cibles/.test(t)) return 'esp';
  if (/posologie/.test(t)) return 'poso';
  if (/^\d[\d.]*\s*contre-indications/.test(t)) return 'ci';
  if (/temps d.attente/.test(t)) return 'tat';
  if (/^\d[\d.]*\s*indications/.test(t)) return 'ind';
  if (/surdosage/.test(t)) return 'sur';
  if (/gestation/.test(t)) return 'gest';
  return null;
}
const MAX = { esp: 300, poso: 2500, ci: 900, tat: 900, ind: 900, sur: 600, gest: 600 };

const { v, d } = await getFiles();
const parser = new XMLParser({ ignoreComments: true, parseTagValue: false, trimValues: true, cdataPropName: false });

const ref = parser.parse(readFileSync(d, 'utf8'))['donnees-reference-group'];
const dict = (tag) => Object.fromEntries(arr(ref[tag]?.entry).map((e) => [String(e['source-code']), String(e['source-desc'])]));
const SA = dict('term-sa'), UNIT = dict('term-unite'), VA = dict('term-va'), ESP = dict('term-esp'),
  DENR = dict('term-denr'), TIT = dict('term-tit'), NAT = dict('term-nat'), FP = dict('term-fp'), TITRE = dict('term-titre');

// Tables d'index partagées pour réduire la taille du JSON
const tables = { voie: [], esp: [], denr: [], unite: [], tit: [], fp: [] };
const idx = (table, label) => {
  if (!label) return -1;
  let i = tables[table].indexOf(label);
  if (i < 0) { tables[table].push(label); i = tables[table].length - 1; }
  return i;
};

const root = parser.parse(readFileSync(v, 'utf8'))['medicinal-product-group'];
const date = root.Informations?.['date-jeu-de-donnees'];
const products = [];
for (const p of arr(root['medicinal-product'])) {
  if (!ACTIVE.has(String(p['term-stat-auto']))) continue;
  const sa = [];
  for (const c of arr(p.composition?.compo)) {
    for (const s of arr(c.sa)) {
      const name = SA[String(s['term-sa'])];
      if (name) sa.push([name, s.quantite ?? '', UNIT[String(s['term-unite'])] ?? '']);
    }
  }
  const ta = [];
  for (const va of arr(p['voie-administration']?.['voie-admin'])) {
    ta.push([
      idx('voie', VA[String(va['term-va'])]),
      idx('esp', ESP[String(va['term-esp'])]),
      idx('denr', DENR[String(va['term-denr'])]),
      va['qte-ta'] ?? '',
      idx('unite', UNIT[String(va['term-unite'])]),
    ]);
  }
  const rcp = {};
  for (const para of arr(p['paragraphes-rcp']?.['para-rcp'])) {
    const key = sectionKey(TITRE[String(para['term-titre'])] ?? '');
    if (key && !rcp[key]) rcp[key] = clean(para.contenu, MAX[key]);
  }
  products.push({
    n: clean(p.nom),
    amm: p['num-amm'],
    t: idx('tit', TIT[String(p['term-tit'])]),
    nat: NAT[String(p['term-nat'])]?.[0] ?? '',
    fp: idx('fp', FP[String(p['term-fp'])]),
    atc: arr(p['atcvet-code']?.['code-atcvet']).map(String),
    sa,
    ta,
    ...rcp,
    url: p['lien-rcp'],
  });
}
products.sort((a, b) => a.n.localeCompare(b.n, 'fr'));
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify({ date, source: 'ANMV / Anses — data.gouv.fr (XML V2)', tables, products }));
const size = readFileSync(OUT).length;
console.log(`${products.length} médicaments, ${(size / 1e6).toFixed(1)} Mo -> ${OUT}`);
