// Recherche tolérante de signes et d'expressions (champ de recherche des signes, noms de races) :
// accords (couché / couchée), formes dérivées (apathique / apathie), fautes de frappe, petits mots intercalés.
import { SIGNS, type Sign } from '../data/signs';
import { speciesById, type SpeciesId } from '../data/species';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

// « mort-aux-rats » est un toxique, pas une mortalité
const tokens = (s: string) => norm(s).replace(/mort[\s-]+aux[\s-]+rats?/g, 'raticide').replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);

/** Racine : sans marques de pluriel / féminin / conjugaison ni suffixe -ique / -ie / -ement (gardée si au moins 5 lettres) */
function root(w: string): string {
  for (const suf of ['issements', 'issement', 'ements', 'ement', 'aient', 'ait', 'ent', 'iques', 'ique', 'ies', 'ie', 'ees', 'ee', 'es', 'e', 's', 'x']) {
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
  // « anormal » n'est pas une faute de frappe de « normal »
  if (text === `a${want}` || want === `a${text}`) return false;
  // Faute de frappe sur un mot assez long
  return want.length >= 7 && nearlyEqual(text, want);
}

/** Petits mots ignorés entre deux mots d'une expression (« ventre très gonflé », « perte de poids ») */
const FILLER = new Set(['de', 'du', 'des', 'd', 'le', 'la', 'les', 'l', 'un', 'une', 'tres', 'bien', 'peu', 'assez', 'trop', 'plus', 'tout', 'il', 'elle', 'est', 'a', 'se', 's', 'en']);

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

/** L'expression figure-t-elle dans le texte ? */
export function hasPhrase(text: string, phrase: string): boolean {
  const words = tokens(phrase);
  return words.length > 0 && find(tokens(text), words) != null;
}

export function signsForSpecies(species: SpeciesId): Sign[] {
  const fam = new Set<SpeciesId>([species, ...speciesById(species).ddx]);
  return SIGNS.filter((s) => !s.species || s.species.some((x) => fam.has(x)));
}

export function searchSigns(q: string, species: SpeciesId): Sign[] {
  const n = norm(q).trim();
  if (!n) return [];
  const qs = tokens(q);
  return signsForSpecies(species).filter((s) => norm(s.label).includes(n) || (s.kw ?? []).some((k) => norm(k).includes(n))
    || [s.label, ...(s.kw ?? [])].some((k) => { const w = tokens(k); return qs.every((x) => w.some((y) => same(x, y) || (x.length >= 3 && y.startsWith(x)))); }));
}
