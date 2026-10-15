// Valeurs usuelles chez l'adulte au repos, pour lire la température et la fréquence cardiaque écrites dans le commentaire.
// Source : Merck Veterinary Manual — « Normal Rectal Temperature Ranges » et « Resting Heart Rates ».
import { speciesById, type SpeciesId } from './species';

export interface Vitals {
  /** Température rectale usuelle (°C) */
  temp: [number, number];
  /** Fréquence cardiaque au repos (battements/min) */
  hr: [number, number];
  /** Âge (en années) à partir duquel l'animal est considéré âgé */
  senior?: number;
  /** Âge (en mois) en dessous duquel l'animal est considéré jeune */
  young: number;
}

const VITALS: Partial<Record<SpeciesId, Vitals>> = {
  chien: { temp: [37.9, 39.9], hr: [60, 160], senior: 8, young: 6 },
  chat: { temp: [38.1, 39.2], hr: [140, 220], senior: 10, young: 6 },
  bovin: { temp: [38.0, 39.3], hr: [48, 84], young: 3 },
  ovin: { temp: [38.3, 39.9], hr: [70, 80], young: 3 },
  caprin: { temp: [38.5, 39.7], hr: [70, 90], young: 3 },
  cheval: { temp: [37.2, 38.3], hr: [28, 44], senior: 15, young: 6 },
  porc: { temp: [38.7, 39.8], hr: [70, 120], young: 3 },
};

/** Valeurs de l'espèce, ou de son espèce de référence pour la faune ; aucune pour le macaque */
export function vitalsFor(species: SpeciesId): Vitals | undefined {
  return VITALS[species] ?? (speciesById(species).proxy ? VITALS[speciesById(species).proxy!] : undefined);
}
