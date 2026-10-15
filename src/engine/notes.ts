// Lecture du commentaire libre (saisi ou dicté) : poids, âge, sexe, effectifs, température, fréquence cardiaque,
// signes cliniques et valeurs d'analyses. Les éléments niés (« pas de fièvre », « sans diarrhée ») ne sont pas retenus.
import type { SpeciesId } from '../data/species';
import type { Herd } from '../db/db';
import type { LabValue } from './interpret';
import { parseLabText } from '../ocr/parse';
import { matchSigns, norm } from './textSigns';
import { vitalsFor } from '../data/vitals';
import { findBreed } from '../data/breeds';

export interface NotesFacts {
  weight?: number;
  age?: string;
  sex?: string;
  breed?: string;
  herd?: Herd;
  /** Température rectale (°C) et fréquence cardiaque (/min) lues dans le texte */
  temp?: number;
  hr?: number;
  signs: string[];
  labs: LabValue[];
}

const NUM = '(\\d+(?:[.,]\\d+)?)';
const toNum = (s: string) => parseFloat(s.replace(',', '.'));

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

  // Sexe : « non stérilisé(e) », « entier / entière » désignent un animal non opéré
  const entire = /\b(?:non|pas)\s+(?:sterilisee?|castree?|operee?)\b|\bentiere?\b/.test(t);
  const female = /\b(femelle|chienne|chatte|vache|genisse|brebis|agnelle|chevre|chevrette|jument|pouliche|ponette|truie|cochette|anesse|entiere)\b/.test(t)
    || /\b(?:non|pas)\s+(?:sterilisee|castree|operee)\b/.test(t);
  const male = /\b(male|taureau|taurillon|belier|bouc|etalon|verrat|baudet|matou|entier)\b/.test(t) || /\b(?:non|pas)\s+(?:sterilise|castre|opere)\b/.test(t);
  if (!entire && /\b(sterilisee|ovariectomisee|ovariohysterectomisee)\b/.test(t)) facts.sex = 'Femelle stérilisée';
  else if (!entire && /\b(castre|hongre|sterilise)\b/.test(t)) facts.sex = 'Mâle castré';
  else if (female) facts.sex = 'Femelle';
  else if (male) facts.sex = 'Mâle';

  facts.breed = findBreed(text, species);

  // Température : « T 39,8 », « 39,8 °C », « 38,5 de température », « température à 40 »
  const temp = t.match(/\b(?:temperature|temp|t)\s*°?\s*(?:rectale\s*)?(?:de|a|:|=)?\s*(\d{2}(?:[.,]\d{1,2})?)\b/)
    ?? t.match(/\b(\d{2}(?:[.,]\d{1,2})?)\s*(?:°\s*c?|degres?(?:\s*c\b)?)?\s*(?:de\s*)?(?:temperature|temp\b|t\b|rectale)/)
    ?? t.match(/\b(\d{2}(?:[.,]\d{1,2})?)\s*(?:°|degres?\b)/);
  if (temp && toNum(temp[1]) >= 30 && toNum(temp[1]) <= 45) facts.temp = toNum(temp[1]);

  // Fréquence cardiaque : « FC 180 », « pouls à 60 », « 120 bpm »
  const hr = t.match(/\b(?:fc|frequence cardiaque|pouls|coeur|rythme cardiaque)\s*(?:a|de|:|=)?\s*(\d{2,3})\b/) ?? t.match(/\b(\d{2,3})\s*(?:bpm|battements)\b/);
  if (hr) facts.hr = parseInt(hr[1]);

  // Cas collectif : « 12 malades », « 3 morts », « troupeau de 80 », « sur 120 »
  const herd: Herd = {};
  const sick = t.match(new RegExp(`${NUM}\\s*(?:animaux\\s*|bovins\\s*|veaux\\s*|brebis\\s*|agneaux\\s*|chevres\\s*|porcs\\s*)?(?:malades|atteints?e?s?|touches|toussent|boitent)\\b`));
  const dead = t.match(new RegExp(`${NUM}\\s*(?:animaux\\s*|veaux\\s*|agneaux\\s*)?(?:morts?|mortes?|deces|decedes?)\\b`));
  const size = t.match(new RegExp(`(?:effectif|troupeau|cheptel|lot|elevage)\\s*(?:de|:)?\\s*${NUM}\\b`)) ?? t.match(new RegExp(`\\bsur\\s*${NUM}\\b`));
  if (sick) herd.malades = Math.round(toNum(sick[1]));
  if (dead) herd.morts = Math.round(toNum(dead[1]));
  if (size) herd.effectif = Math.round(toNum(size[1]));
  if (Object.keys(herd).length) facts.herd = herd;

  // Signes et valeurs, proposition par proposition (les négations sont écartées par matchSigns)
  const signs = new Set<string>();
  const labs = new Map<string, LabValue>();
  for (const c of clauses(text)) {
    for (const s of matchSigns(c, species)) signs.add(s);
    for (const v of parseLabText(c, species)) {
      if (labs.has(v.analyte)) continue;
      // Sans unité écrite, la valeur est prise dans l'unité de l'appli (SI) : « glycémie 2,1 » = 2,1 mmol/L, jamais 2,1 g/L
      const noUnit = !v.rawUnit && v.rawValue != null;
      labs.set(v.analyte, { ...v, ...(noUnit ? { value: v.rawValue!, unitGuessed: true } : {}), source: 'texte' });
    }
  }
  // Mesures et signalement : la valeur chiffrée prime sur les mots
  const v = vitalsFor(species);
  // Température chiffrée : elle remplit le champ Température, qui décide seul de la fièvre (voir l'analyse)
  if (facts.temp != null) { signs.delete('fievre'); signs.delete('hypothermie'); }
  if (v && facts.hr != null) {
    if (facts.hr > v.hr[1]) signs.add('tachycardie');
    else if (facts.hr < v.hr[0]) signs.add('bradycardie');
  }
  const months = facts.age ? ageInMonths(facts.age) : undefined;
  if (v && months != null) {
    if (v.senior && months >= v.senior * 12) signs.add('age');
    if (months < v.young) signs.add('jeune');
  }
  if (facts.sex?.startsWith('Mâle')) signs.add('male');
  // « non stérilisé » (mâle) ressemble à « non stérilisée » : le sexe lu tranche
  if (facts.sex && facts.sex !== 'Femelle') signs.delete('femelle_entiere');

  facts.signs = [...signs];
  facts.labs = [...labs.values()];
  return facts;
}

/** « 8 ans », « 3 mois », « 2 sem. », « 10 j » → mois */
function ageInMonths(age: string): number | undefined {
  const m = age.match(/^([\d.,]+)\s*(ans?|mois|sem|j)/);
  if (!m) return undefined;
  const n = toNum(m[1]);
  return m[2].startsWith('an') ? n * 12 : m[2] === 'mois' ? n : m[2] === 'sem' ? n / 4.3 : n / 30;
}
