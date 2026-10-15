// Repère les signes cliniques mentionnés dans un texte libre (notes, dictée).
import { SIGNS, type Sign } from '../data/signs';
import { speciesById, type SpeciesId } from '../data/species';

export const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, ' ');

export function signsForSpecies(species: SpeciesId): Sign[] {
  const fam = new Set<SpeciesId>([species, ...speciesById(species).ddx]);
  return SIGNS.filter((s) => !s.species || s.species.some((x) => fam.has(x)));
}

export function matchSigns(text: string, species: SpeciesId): string[] {
  const t = ` ${norm(text).replace(/[^a-z0-9]+/g, ' ')} `;
  const hits: string[] = [];
  for (const s of signsForSpecies(species)) {
    // Libellé principal (avant « / » ou « ( »), puis mots-clés
    const main = norm(s.label.split(/[/(]/)[0]).replace(/[^a-z0-9]+/g, ' ').trim();
    const keys = [main, ...(s.kw ?? []).map((k) => norm(k).replace(/[^a-z0-9]+/g, ' ').trim())].filter((k) => k.length >= 3);
    if (keys.some((k) => t.includes(` ${k} `) || (k.length > 6 && t.includes(` ${k}`)))) hits.push(s.id);
  }
  return hits;
}

export function searchSigns(q: string, species: SpeciesId): Sign[] {
  const n = norm(q).trim();
  if (!n) return [];
  return signsForSpecies(species).filter((s) => norm(s.label).includes(n) || (s.kw ?? []).some((k) => norm(k).includes(n)));
}
