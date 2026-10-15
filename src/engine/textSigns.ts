// Repère les signes cliniques mentionnés dans un texte libre (notes, dictée).
// Tolérant : accords (couché / couchée), formes dérivées (apathique / apathie), fautes de frappe,
// mots intercalés (« ventre très gonflé »). Un signe précédé d'une négation (« pas de », « sans »…) est écarté.
import { SIGNS, type Sign } from '../data/signs';
import { speciesById, type SpeciesId } from '../data/species';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

// « mort-aux-rats » est un toxique, pas une mortalité
const tokens = (s: string) => norm(s).replace(/mort[\s-]+aux[\s-]+rats?/g, 'raticide').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

/** Racine : sans marques de pluriel / féminin ni suffixe -ique / -ie / -ement (gardée si au moins 5 lettres) */
function root(w: string): string {
  for (const suf of ['issements', 'issement', 'ements', 'ement', 'iques', 'ique', 'ies', 'ie', 'ees', 'ee', 'es', 'e', 's', 'x']) {
    if (w.endsWith(suf) && w.length - suf.length >= 5) return w.slice(0, -suf.length);
  }
  return w;
}

/** Au plus une lettre de différence (substitution, ajout, retrait ou inversion) */
function nearlyEqual(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  if (i === a.length && i === b.length) return true;
  const ra = a.slice(i + 1), rb = b.slice(i + 1);
  return ra === rb || a.slice(i) === b.slice(i + 1) || a.slice(i + 1) === b.slice(i)
    || (a[i] === b[i + 1] && a[i + 1] === b[i] && a.slice(i + 2) === b.slice(i + 2));
}

/** Mot du texte équivalent au mot attendu */
function same(text: string, want: string): boolean {
  if (text === want || text === `${want}s` || text === `${want}x` || want === `${text}s`) return true;
  // Mots courts : forme exacte ou pluriel seulement (« boit » ≠ « boite », « sang » ≠ « sanglier »)
  if (want.length < 5 || text.length < 5) return false;
  if (root(text) === root(want)) return true;
  // Faute de frappe sur un mot assez long
  return want.length >= 7 && nearlyEqual(text, want);
}

/** Mots qui annulent un signe placé juste après : « pas de fièvre », « sans diarrhée », « ne vomit pas », « ni toux » */
const NEG_BEFORE = new Set(['pas', 'sans', 'aucun', 'aucune', 'ni', 'absence', 'non', 'ne', 'n', 'jamais', 'rien']);
const NEG_AFTER = new Set(['pas', 'jamais']);
/** Petits mots ignorés entre deux mots d'une expression (« ventre très gonflé », « perte de poids ») */
const FILLER = new Set(['de', 'du', 'des', 'd', 'le', 'la', 'les', 'l', 'un', 'une', 'tres', 'bien', 'peu', 'assez', 'trop', 'plus', 'tout', 'il', 'elle', 'est', 'a', 'se', 's', 'en']);

interface Phrase { sign: string; words: string[] }

const phraseCache = new Map<string, Phrase[]>();
function phrases(species: SpeciesId): Phrase[] {
  let p = phraseCache.get(species);
  if (p) return p;
  p = [];
  for (const s of signsForSpecies(species)) {
    // Libellé principal (avant « / » ou « ( »), chaque partie après « / », puis mots-clés
    const labels = s.label.split('(')[0].split('/');
    for (const k of [...labels, ...(s.kw ?? [])]) {
      const words = tokens(k);
      if (words.join('').length >= 3) p.push({ sign: s.id, words });
    }
  }
  phraseCache.set(species, p);
  return p;
}

/** Position de l'expression dans le texte : chaque mot attendu, avec au plus un petit mot intercalé */
function find(t: string[], words: string[]): { start: number; end: number } | null {
  for (let i = 0; i < t.length; i++) {
    if (!same(t[i], words[0])) continue;
    let j = i, ok = true;
    for (const w of words.slice(1)) {
      let k = j + 1;
      while (k < t.length && k - j <= 2 && !same(t[k], w) && FILLER.has(t[k])) k++;
      if (k < t.length && same(t[k], w)) j = k;
      else { ok = false; break; }
    }
    if (ok) return { start: i, end: j };
  }
  return null;
}

function negated(t: string[], start: number, end: number, words: string[]): boolean {
  // La négation fait partie de l'expression (« ne mange pas », « non stérilisée ») : rien à écarter
  if (words.some((w) => NEG_BEFORE.has(w) || NEG_AFTER.has(w))) return false;
  for (let k = Math.max(0, start - 3); k < start; k++) if (NEG_BEFORE.has(t[k])) return true;
  return NEG_AFTER.has(t[end + 1] ?? '');
}

/** L'expression figure-t-elle dans le texte (mêmes tolérances que pour les signes, sans négation) ? */
export function hasPhrase(text: string, phrase: string): boolean {
  const words = tokens(phrase);
  return words.length > 0 && find(tokens(text), words) != null;
}

export function signsForSpecies(species: SpeciesId): Sign[] {
  const fam = new Set<SpeciesId>([species, ...speciesById(species).ddx]);
  return SIGNS.filter((s) => !s.species || s.species.some((x) => fam.has(x)));
}

/** Signes affirmés dans un texte (une proposition, de préférence : la négation porte sur les mots voisins) */
export function matchSigns(text: string, species: SpeciesId): string[] {
  const t = tokens(text);
  const hits = new Set<string>();
  for (const p of phrases(species)) {
    if (hits.has(p.sign)) continue;
    const at = find(t, p.words);
    if (at && !negated(t, at.start, at.end, p.words)) hits.add(p.sign);
  }
  return [...hits];
}

export function searchSigns(q: string, species: SpeciesId): Sign[] {
  const n = norm(q).trim();
  if (!n) return [];
  const qs = tokens(q);
  return signsForSpecies(species).filter((s) => norm(s.label).includes(n) || (s.kw ?? []).some((k) => norm(k).includes(n))
    || [s.label, ...(s.kw ?? [])].some((k) => { const w = tokens(k); return qs.every((x) => w.some((y) => same(x, y) || (x.length >= 3 && y.startsWith(x)))); }));
}
