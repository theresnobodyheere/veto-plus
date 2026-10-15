// Base des médicaments vétérinaires autorisés en France (ANMV), chargée à la demande et gardée en cache.
import type { SpeciesId } from './species';
import { norm } from '../engine/textSigns';

export interface DrugProduct {
  n: string; amm: string; t: number; nat: string; fp: number; atc: string[];
  sa: [string, string, string][];
  ta: [number, number, number, string, number][];
  esp?: string; poso?: string; ci?: string; tat?: string; ind?: string; sur?: string; gest?: string; url?: string;
}
export interface DrugDb {
  date: string; source: string;
  tables: { voie: string[]; esp: string[]; denr: string[]; unite: string[]; tit: string[]; fp: string[] };
  products: DrugProduct[];
  /** index de recherche, catégorie, forme et substance principale (calculés au chargement) */
  idx: string[];
  cat: string[];
  form: string[];
  sub: string[];
}

let cache: Promise<DrugDb> | null = null;

export function loadDrugs(): Promise<DrugDb> {
  if (!cache) {
    cache = fetch(new URL('data/drugs.json', document.baseURI).href)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((db: DrugDb) => {
        db.idx = db.products.map((p) => norm(`${p.n} ${p.sa.map((s) => s[0]).join(' ')} ${p.atc.join(' ')}`));
        indexDrugs(db);
        return db;
      })
      .catch((e) => { cache = null; throw e; });
  }
  return cache;
}

export const SPECIES_FILTERS: { id: SpeciesId; label: string; re: RegExp }[] = [
  { id: 'bovin', label: 'Bovins', re: /bovin|vache|veau|g[ée]nisse|taurillon|ruminant/i },
  { id: 'ovin', label: 'Ovins', re: /\bovins?\b|brebis|agneau|mouton|b[ée]lier|ruminant/i },
  { id: 'caprin', label: 'Caprins', re: /caprin|ch[èe]vre|chevreau|bouc|ruminant/i },
  { id: 'cheval', label: 'Équidés', re: /cheval|chevaux|[ée]qui|jument|poulain|[âa]ne/i },
  { id: 'porc', label: 'Porcins', re: /porc|truie|porcelet|cochette/i },
  { id: 'chien', label: 'Chiens', re: /chien|carnivore|animaux de compagnie/i },
  { id: 'chat', label: 'Chats', re: /\bchats?\b|chatte|chaton|f[ée]lin|carnivore|animaux de compagnie/i },
];

export function matchesSpecies(db: DrugDb, p: DrugProduct, sp: SpeciesId): boolean {
  const f = SPECIES_FILTERS.find((x) => x.id === sp);
  if (!f) return true;
  if (p.esp && f.re.test(p.esp)) return true;
  return p.ta.some((t) => f.re.test(db.tables.esp[t[1]] ?? ''));
}

export interface DrugFilter { q?: string; sp?: SpeciesId; cat?: string; form?: string; sub?: string }

/** Toutes les correspondances (indices dans db.products), dans l'ordre alphabétique de la base */
export function filterDrugs(db: DrugDb, f: DrugFilter): number[] {
  const terms = norm(f.q ?? '').split(/\s+/).filter(Boolean);
  const out: number[] = [];
  for (let i = 0; i < db.products.length; i++) {
    if (terms.length && !terms.every((t) => db.idx[i].includes(t))) continue;
    if (f.cat && db.cat[i] !== f.cat) continue;
    if (f.form && db.form[i] !== f.form) continue;
    if (f.sub && db.sub[i] !== f.sub) continue;
    if (f.sp && !matchesSpecies(db, db.products[i], f.sp)) continue;
    out.push(i);
  }
  if (!terms.length) return out;
  // Avec une recherche : nom commençant par le texte, puis nom le contenant, puis correspondance par substance ou code
  const rank = (i: number) => {
    const name = norm(db.products[i].n);
    if (name.startsWith(terms[0])) return 0;
    if (terms.every((t) => name.includes(t))) return 1;
    return 2;
  };
  return out.map((i) => [rank(i), i]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(([, i]) => i);
}

export function searchDrugs(db: DrugDb, q: string, sp?: SpeciesId, limit = 60): DrugProduct[] {
  return filterDrugs(db, { q, sp }).slice(0, limit).map((i) => db.products[i]);
}

// ——— Filtres successifs : espèce → classe thérapeutique → forme → substance ———

/** Classes thérapeutiques d'après le code ATCvet (première correspondance retenue) */
export const CATEGORIES: { id: string; label: string; re: RegExp }[] = [
  { id: 'anti-infectieux', label: 'Antibiotiques, anti-infectieux', re: /^QJ/ },
  { id: 'antiparasitaires', label: 'Antiparasitaires', re: /^QP/ },
  { id: 'anti-inflammatoires', label: 'Anti-inflammatoires, corticoïdes', re: /^QM01|^QH02/ },
  { id: 'anesthesie', label: 'Anesthésie, sédation, douleur', re: /^QN0[125]|^QM03|^QN51/ },
  { id: 'vaccins', label: 'Vaccins, immunologie', re: /^QI/ },
  { id: 'reproduction', label: 'Reproduction, hormones', re: /^QG0[2-4]|^QG5|^QH0[13]/ },
  { id: 'solutes', label: 'Solutés, vitamines, minéraux', re: /^QB05|^QA1[126]/ },
  { id: 'digestif', label: 'Digestif, métabolisme', re: /^QA/ },
  { id: 'cardio', label: 'Cœur, rein, circulation', re: /^QC|^QB0[1-3]/ },
  { id: 'neuro', label: 'Neurologie, comportement', re: /^QN0[3-7]/ },
  { id: 'peau', label: 'Peau, yeux, oreilles', re: /^QD|^QS/ },
  { id: 'respiratoire', label: 'Respiratoire', re: /^QR/ },
  { id: 'autres', label: 'Autres (homéopathie, cancérologie…)', re: /./ },
];

/** Formes regroupées d'après la forme pharmaceutique de l'AMM (première correspondance retenue) */
export const FORMS: { id: string; label: string; re: RegExp }[] = [
  { id: 'intramammaire', label: 'Intramammaire', re: /intramammaire|mammaire/i },
  { id: 'injectable', label: 'Injectable', re: /inject|perfusion/i },
  { id: 'eau', label: 'Eau de boisson, aliment', re: /eau de boisson|pr[ée]m[ée]lange|aliment|le lait/i },
  { id: 'cutane', label: 'Pour-on, spot-on, collier, cutané', re: /spot-on|pour-on|collier|cutan|shampo|trempage|pommade$|gel$/i },
  { id: 'comprime', label: 'Comprimés, gélules', re: /comprim|g[ée]lule|capsule/i },
  { id: 'oral', label: 'Buvable, pâte orale', re: /buvable|oral|sirop|p[âa]te|granul/i },
  { id: 'local', label: 'Œil, oreille, nez', re: /collyre|ophtalm|auricul|nasal/i },
  { id: 'autre', label: 'Autres formes', re: /./ },
];

/** Molécule de la substance principale, sans le sel ni l'hydrate (« Phosphate sodique de dexaméthasone » → « Dexaméthasone ») */
export function mainSubstance(p: DrugProduct): string {
  // Solvant des vaccins et libellés provisoires de la base : pas une substance
  const sa = p.sa.find((x) => !/^eau |solvant|^a d[ée]finir/i.test(x[0]));
  let n = (sa?.[0] ?? '').replace(/\s*\(.*$/, '').trim();
  const SALT = '(?:phosphate|hydrog[ée]nofumarate|fumarate|ac[ée]tate|chlorhydrate|sulfate|hydrochlorure|bromhydrate|mal[ée]ate|tartrate|citrate|succinate|propionate|val[ée]rate|benzoate|m[ée]sylate|tosylate|lactate|gluconate|isonicotinate|dipropionate|palmitate|pamoate|embonate|hyclate)';
  n = n.replace(new RegExp(`^${SALT}(?:\\s+(?:di)?(?:sodique|potassique|de sodium|de potassium))?\\s+(?:de\\s+|d['’])`, 'i'), '');
  for (let k = 0; k < 3; k++) n = n.replace(/\s+(m[ée]glumine|(?:di)?sodique|potassique|(?:tri|mono|di|sesqui)?hydrat[ée]e?|base|anhydre|chlorhydrate|sulfate)$/i, '');
  return n ? n[0].toUpperCase() + n.slice(1) : n;
}

function indexDrugs(db: DrugDb) {
  db.cat = db.products.map((p) => (CATEGORIES.find((c) => c.re.test(p.atc[0] ?? '')) ?? CATEGORIES[CATEGORIES.length - 1]).id);
  db.form = db.products.map((p) => (FORMS.find((f) => f.re.test(db.tables.fp[p.fp] ?? '')) ?? FORMS[FORMS.length - 1]).id);
  db.sub = db.products.map(mainSubstance);
}

/** Valeurs présentes dans une sélection et nombre de médicaments pour chacune, des plus fréquentes aux plus rares */
export function facet(db: DrugDb, idx: number[], key: 'cat' | 'form' | 'sub'): { id: string; n: number }[] {
  const m = new Map<string, number>();
  for (const i of idx) { const v = db[key][i]; if (v) m.set(v, (m.get(v) ?? 0) + 1); }
  return [...m.entries()].map(([id, n]) => ({ id, n })).sort((a, b) => b.n - a.n || a.id.localeCompare(b.id, 'fr'));
}

// ——— Derniers médicaments consultés (sur l'iPhone uniquement) ———

const RECENT_KEY = 'vetoplus.recentDrugs.v1';
const drugKey = (p: DrugProduct) => `${p.amm}|${p.n}`;

export function recentDrugs(db: DrugDb): DrugProduct[] {
  let keys: string[] = [];
  try { keys = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]'); } catch { /* stockage indisponible */ }
  return keys.map((k) => db.products.find((p) => drugKey(p) === k)).filter((p): p is DrugProduct => !!p);
}

export function rememberDrug(p: DrugProduct) {
  try {
    const keys: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
    const next = [drugKey(p), ...keys.filter((k) => k !== drugKey(p))].slice(0, 10);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* stockage indisponible */ }
}

// ——— Dose usuelle lue dans la posologie du RCP ———

export interface DoseOption {
  /** dose de la substance principale en mg/kg, si calculable */
  mgkg?: number;
  /** volume de médicament en mL/kg, si le RCP l'exprime ainsi */
  mlkg?: number;
  /** extrait du RCP */
  text: string;
  /** nombre de mentions de cette dose pour l'espèce */
  count: number;
}

const DOSE_RE = /(\d+(?:[.,]\d+)?)(?:\s*(?:à|-|–)\s*(\d+(?:[.,]\d+)?))?\s*(mg|µg|μg|mcg|g|mL|ml)(?![a-zA-Z])((?:\s+(?:de|d’|d')\s*|\s*)[^.;:\n]{0,70}?)\s*(?:\/|par|pour)\s*(\d+(?:[.,]\d+)?\s*)?kg(?![a-zA-Z])/gi;
const PRODUCT_WORDS = /m[ée]dicament|produit|sp[ée]cialit[ée]|solution|suspension|[ée]mulsion|pr[ée]paration/i;

/**
 * Doses trouvées dans la posologie pour une espèce, de la plus citée à la moins citée.
 * Chaque dose est rattachée à la dernière espèce nommée avant elle dans le même paragraphe ;
 * sans espèce nommée, elle vaut pour toutes les espèces du médicament.
 */
export function doseOptions(p: DrugProduct, sp?: SpeciesId): DoseOption[] {
  const text = p.poso ?? '';
  if (!text) return [];
  const conc = concentration(p);
  const first = norm(mainSubstance(p)).split(/\s+/)[0] ?? '';
  const filters = SPECIES_FILTERS.map((f) => ({ id: f.id, re: new RegExp(f.re.source, 'gi') }));
  const out = new Map<string, DoseOption & { pos: number; last: number }>();
  let offset = 0;
  for (const para of text.split(/\n+/)) {
    const mentions: { id: SpeciesId; pos: number; end: number }[] = [];
    for (const f of filters) for (const m of para.matchAll(f.re)) mentions.push({ id: f.id, pos: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
    mentions.sort((a, b) => a.pos - b.pos);
    for (const m of para.matchAll(DOSE_RE)) {
      const pos = m.index ?? 0;
      // Espèce(s) de la dernière mention avant la dose, avec celles qui la précèdent directement (« bovins et porcins : »)
      const before = mentions.filter((x) => x.pos < pos);
      const species = new Set<SpeciesId>();
      for (let k = before.length - 1; k >= 0; k--) {
        if (species.size && !/^[\s,]*(?:et|ou)?[\s,]*$/i.test(para.slice(before[k].end, before[k + 1].pos))) break;
        species.add(before[k].id);
      }
      if (sp && species.size && !species.has(sp)) continue;
      const v = parseFloat(m[1].replace(',', '.'));
      const unit = m[3].toLowerCase();
      const what = m[4] ?? '';
      const perKg = m[5] ? parseFloat(m[5].replace(',', '.')) : 1;
      if (!Number.isFinite(v) || !(perKg > 0)) continue;
      const opt: DoseOption = { text: m[0].replace(/\s+/g, ' ').trim(), count: 1 };
      if (unit === 'ml') {
        opt.mlkg = v / perKg;
        if (conc) opt.mgkg = opt.mlkg * conc;
      } else {
        // Une dose en masse doit porter sur la substance principale, pas sur le médicament ni sur une autre substance
        if (PRODUCT_WORDS.test(what)) continue;
        const named = norm(what).replace(/[^a-z ]/g, ' ').trim();
        if (named && first && !named.includes(first)) continue;
        opt.mgkg = (unit === 'g' ? v * 1000 : unit === 'mg' ? v : v / 1000) / perKg;
      }
      // Doses à moins de 5 % l'une de l'autre (« 3 mg/kg » et « 1 mL / 16 kg ») : même dose
      const close = (a?: number, b?: number) => a != null && b != null && Math.abs(a - b) <= 0.05 * Math.max(a, b);
      const at = offset + pos;
      const prev = [...out.values()].find((o) => (opt.mgkg != null ? close(o.mgkg, opt.mgkg) : o.mgkg == null && close(o.mlkg, opt.mlkg)));
      const key = `${out.size}`;
      if (prev) {
        // « 2 mg/kg (1 mL / 50 kg) » : la même dose énoncée deux fois de suite ne compte qu'une fois
        if (at - prev.last > 120) prev.count++;
        prev.last = at;
        prev.mlkg ??= opt.mlkg;
      } else out.set(key, { ...opt, pos: at, last: at });
    }
    offset += para.length + 1;
  }
  return [...out.values()].sort((a, b) => b.count - a.count || a.pos - b.pos).map(({ pos: _pos, last: _last, ...o }) => o);
}

/** Temps d'attente structurés, regroupés par espèce et denrée, durées décroissantes */
export function withdrawal(db: DrugDb, p: DrugProduct): { esp: string; denr: string; values: string[] }[] {
  const VOIE: Record<string, string> = { Intramusculaire: 'IM', 'Sous-cutanée': 'SC', Intraveineuse: 'IV', Orale: 'VO', Intramammaire: 'IMam' };
  const groups = new Map<string, { esp: string; denr: string; byVal: Map<string, Set<string>> }>();
  for (const [v, e, d, q, u] of p.ta) {
    const denr = db.tables.denr[d];
    if (!denr || denr === 'non applicable' || q === '') continue;
    const esp = db.tables.esp[e] ?? '';
    const key = `${esp}|${denr}`;
    if (!groups.has(key)) groups.set(key, { esp, denr, byVal: new Map() });
    const unit = db.tables.unite[u] ?? '';
    const plural = ['jour', 'heure'].includes(unit) && !['0', '1'].includes(q) ? 's' : '';
    const label = `${q} ${unit}${plural}`;
    const voie = db.tables.voie[v] ?? '';
    const g = groups.get(key)!.byVal;
    if (!g.has(label)) g.set(label, new Set());
    g.get(label)!.add(VOIE[voie] ?? voie.toLowerCase());
  }
  const hours = (l: string) => parseFloat(l) * (/heure/.test(l) ? 1 : 24);
  return [...groups.values()].map((g) => ({
    esp: g.esp,
    denr: g.denr,
    values: [...g.byVal.entries()].sort((a, b) => hours(b[0]) - hours(a[0])).map(([l, vs]) => `${l} (${[...vs].join(', ')})`),
  }));
}

/** Concentration en mg/mL de la substance principale, lisible dans le nom (« 100 MG/ML », « 10/100 MG/ML » → 10) */
export function concentration(p: DrugProduct): number | null {
  const m = p.n.match(/(\d+(?:[.,]\d+)?)(?:\s*\/\s*\d+(?:[.,]\d+)?)*\s*MG\s*\/\s*ML/i);
  return m ? parseFloat(m[1].replace(',', '.')) : null;
}
