// Lecture du commentaire libre (saisi ou dicté) : poids, âge, sexe, effectifs, signes cliniques et valeurs d'analyses.
// Les éléments niés (« pas de fièvre », « sans diarrhée ») ne sont pas retenus.
import type { SpeciesId } from '../data/species';
import type { Herd } from '../db/db';
import type { LabValue } from './interpret';
import { parseLabText } from '../ocr/parse';
import { matchSigns, norm } from './textSigns';

export interface NotesFacts {
  weight?: number;
  age?: string;
  sex?: string;
  herd?: Herd;
  signs: string[];
  labs: LabValue[];
}

const NUM = '(\\d+(?:[.,]\\d+)?)';
const toNum = (s: string) => parseFloat(s.replace(',', '.'));
const NEGATION = /\b(pas d|pas de|plus de|sans|absence d|aucune?|ni|non|ne [a-z]+ pas|n [a-z]+ pas|ne [a-z]+ plus|n [a-z]+ plus|rien)\b/;

/** Propositions du texte : phrases, puis morceaux séparés par « ; », « , » ou « et » */
function clauses(text: string): string[] {
  return text.split(/\n|[;:]|\.\s+|,\s+(?=\D)|\s+(?:et|mais|puis)\s+/i).map((c) => c.trim()).filter(Boolean);
}

export function parseNotes(text: string, species: SpeciesId): NotesFacts {
  const facts: NotesFacts = { signs: [], labs: [] };
  if (!text.trim()) return facts;
  const t = norm(text);

  // Poids : « 32 kg », « pèse 32 kilos », « poids 450 » (pas « 1 mL / 50 kg »)
  const w = t.match(new RegExp(`(?:poids|pese|pesant)\\s*(?:de|:)?\\s*${NUM}\\s*(?:kg|kilos?)?\\b`))
    ?? t.match(new RegExp(`(?<![/\\d]\\s*|par\\s)${NUM}\\s*(?:kg|kilos?)\\b(?!\\s*\\/)`));
  if (w) facts.weight = toNum(w[1]);

  // Âge : « 8 ans », « âgée de 3 semaines » ; « depuis 2 mois » est une durée, pas un âge
  for (const m of t.matchAll(new RegExp(`${NUM}\\s*(ans?|mois|semaines?|sem\\b|jours?|j\\b)`, 'g'))) {
    const before = t.slice(Math.max(0, (m.index ?? 0) - 18), m.index);
    if (/(depuis|il y a|pendant|durant|en|dans|tous les|toutes les|apres|avant)\s*(environ|plus de|moins de)?\s*$/.test(before)) continue;
    const unit = m[2].startsWith('an') ? (toNum(m[1]) > 1 ? 'ans' : 'an') : m[2].startsWith('mois') ? 'mois' : m[2].startsWith('s') ? 'sem.' : 'j';
    if (unit === 'j' && !/(age|agee|ne|nee|de)\s*$/.test(before)) continue;
    facts.age = `${m[1]} ${unit}`;
    break;
  }

  // Sexe
  if (/\b(sterilisee|ovariectomisee|ovariohysterectomisee)\b/.test(t)) facts.sex = 'Femelle stérilisée';
  else if (/\b(castre|hongre)\b/.test(t)) facts.sex = 'Mâle castré';
  else if (/\b(femelle|chienne|chatte|vache|genisse|brebis|agnelle|chevre|chevrette|jument|pouliche|ponette|truie|cochette|anesse)\b/.test(t)) facts.sex = 'Femelle';
  else if (/\b(male|taureau|taurillon|belier|bouc|etalon|verrat|baudet)\b/.test(t)) facts.sex = 'Mâle';

  // Cas collectif : « 12 malades », « 3 morts », « troupeau de 80 », « sur 120 »
  const herd: Herd = {};
  const sick = t.match(new RegExp(`${NUM}\\s*(?:animaux\\s*|bovins\\s*|veaux\\s*|brebis\\s*|agneaux\\s*|chevres\\s*|porcs\\s*)?(?:malades|atteints?e?s?|touches|toussent|boitent)\\b`));
  const dead = t.match(new RegExp(`${NUM}\\s*(?:animaux\\s*|veaux\\s*|agneaux\\s*)?(?:morts?|mortes?|deces|decedes?)\\b`));
  const size = t.match(new RegExp(`(?:effectif|troupeau|cheptel|lot|elevage)\\s*(?:de|:)?\\s*${NUM}\\b`)) ?? t.match(new RegExp(`\\bsur\\s*${NUM}\\b`));
  if (sick) herd.malades = Math.round(toNum(sick[1]));
  if (dead) herd.morts = Math.round(toNum(dead[1]));
  if (size) herd.effectif = Math.round(toNum(size[1]));
  if (Object.keys(herd).length) facts.herd = herd;

  // Signes et valeurs, proposition par proposition, en écartant les négations
  const signs = new Set<string>();
  const labs = new Map<string, LabValue>();
  for (const c of clauses(text)) {
    if (!NEGATION.test(` ${norm(c).replace(/[^a-z0-9]+/g, ' ')} `)) for (const s of matchSigns(c, species)) signs.add(s);
    for (const v of parseLabText(c, species)) {
      if (labs.has(v.analyte)) continue;
      // Sans unité écrite, la valeur est prise dans l'unité de l'appli (SI) : « glycémie 2,1 » = 2,1 mmol/L, jamais 2,1 g/L
      const noUnit = !v.rawUnit && v.rawValue != null;
      labs.set(v.analyte, { ...v, ...(noUnit ? { value: v.rawValue!, unitGuessed: true } : {}), source: 'texte' });
    }
  }
  facts.signs = [...signs];
  facts.labs = [...labs.values()];
  return facts;
}
