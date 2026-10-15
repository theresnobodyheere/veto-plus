// Valeurs usuelles chez l'adulte au repos : température, fréquences cardiaque et respiratoire.
// Source : Merck Veterinary Manual — « Normal Rectal Temperature Ranges », « Resting Heart Rates », « Resting Respiratory Rates ».
// Chien / chat : seuil de 40/min pour la fréquence respiratoire au repos (consensus ACVIM sur les cardiopathies).
import { speciesById, type SpeciesId } from './species';

export interface Vitals {
  /** Température rectale usuelle (°C) */
  temp: [number, number];
  /** Fréquence cardiaque au repos (battements/min) */
  hr: [number, number];
  /** Fréquence respiratoire au repos (mouvements/min) */
  rr: [number, number];
  /** Âge (en années) à partir duquel l'animal est considéré âgé */
  senior?: number;
  /** Âge (en mois) en dessous duquel l'animal est considéré jeune */
  young: number;
}

const VITALS: Partial<Record<SpeciesId, Vitals>> = {
  chien: { temp: [37.9, 39.9], hr: [60, 160], rr: [10, 40], senior: 8, young: 6 },
  chat: { temp: [38.1, 39.2], hr: [140, 220], rr: [20, 40], senior: 10, young: 6 },
  bovin: { temp: [38.0, 39.3], hr: [48, 84], rr: [26, 50], young: 3 },
  ovin: { temp: [38.3, 39.9], hr: [70, 80], rr: [16, 34], young: 3 },
  caprin: { temp: [38.5, 39.7], hr: [70, 90], rr: [15, 30], young: 3 },
  cheval: { temp: [37.2, 38.3], hr: [28, 44], rr: [8, 20], senior: 15, young: 6 },
  porc: { temp: [38.7, 39.8], hr: [70, 120], rr: [32, 58], young: 3 },
};

/** Fièvre ou hypothermie d'après la température rectale ; rien si normale ou si l'espèce n'a pas de référence */
export function tempFinding(species: SpeciesId, temp?: number): 'fievre' | 'hypothermie' | undefined {
  const v = vitalsFor(species);
  if (!v || temp == null || !Number.isFinite(temp)) return undefined;
  return temp > v.temp[1] ? 'fievre' : temp < v.temp[0] ? 'hypothermie' : undefined;
}

/** Tachycardie ou bradycardie d'après la fréquence cardiaque ; rien si normale */
export function hrFinding(species: SpeciesId, hr?: number): 'tachycardie' | 'bradycardie' | undefined {
  const v = vitalsFor(species);
  if (!v || hr == null || !Number.isFinite(hr)) return undefined;
  return hr > v.hr[1] ? 'tachycardie' : hr < v.hr[0] ? 'bradycardie' : undefined;
}

/** Fréquence respiratoire au repos au-dessus des valeurs usuelles : comptée comme dyspnée (tachypnée) */
export function rrFinding(species: SpeciesId, rr?: number): 'dyspnee' | undefined {
  const v = vitalsFor(species);
  if (!v || rr == null || !Number.isFinite(rr)) return undefined;
  return rr > v.rr[1] ? 'dyspnee' : undefined;
}

/** Valeurs de l'espèce, ou de son espèce de référence pour la faune ; aucune pour le macaque */
export function vitalsFor(species: SpeciesId): Vitals | undefined {
  return VITALS[species] ?? (speciesById(species).proxy ? VITALS[speciesById(species).proxy!] : undefined);
}
