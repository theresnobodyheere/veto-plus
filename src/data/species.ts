// Espèces prises en charge. Les espèces de faune utilisent une espèce domestique « proxy »
// pour les intervalles de référence quand aucune donnée publiée n'est intégrée.

export type SpeciesId =
  | 'chien' | 'chat' | 'bovin' | 'ovin' | 'caprin' | 'cheval' | 'porc'
  | 'macaque' | 'ours' | 'loup' | 'lynx' | 'bison' | 'cervide' | 'bouquetin' | 'sanglier';

export type SpeciesGroup = 'canine' | 'rurale' | 'equine' | 'faune';

export interface Species {
  id: SpeciesId;
  label: string;
  group: SpeciesGroup;
  /** Familles utilisées pour le diagnostic différentiel */
  ddx: SpeciesId[];
  /** Espèce domestique servant de référence si pas d'intervalles propres */
  proxy?: SpeciesId;
  /** Animal de rente : temps d'attente à respecter */
  food: boolean;
  note?: string;
}

export const SPECIES: Species[] = [
  { id: 'chien', label: 'Chien', group: 'canine', ddx: ['chien'], food: false },
  { id: 'chat', label: 'Chat', group: 'canine', ddx: ['chat'], food: false },
  { id: 'bovin', label: 'Bovin', group: 'rurale', ddx: ['bovin'], food: true },
  { id: 'ovin', label: 'Ovin', group: 'rurale', ddx: ['ovin'], food: true },
  { id: 'caprin', label: 'Caprin', group: 'rurale', ddx: ['caprin'], food: true },
  { id: 'cheval', label: 'Équidé', group: 'equine', ddx: ['cheval'], food: true,
    note: "Vérifier le statut « exclu de l'abattage » sur le document d'identification (SIRE)." },
  { id: 'porc', label: 'Porc', group: 'rurale', ddx: ['porc'], food: true },
  { id: 'macaque', label: 'Magot (macaque)', group: 'faune', ddx: ['macaque'], food: false,
    note: 'Tout macaque est considéré porteur potentiel de l’herpèsvirus B : gants, lunettes, protocole morsure.' },
  { id: 'ours', label: 'Ours brun', group: 'faune', ddx: ['chien'], proxy: 'chien', food: false },
  { id: 'loup', label: 'Loup', group: 'faune', ddx: ['chien'], proxy: 'chien', food: false },
  { id: 'lynx', label: 'Lynx', group: 'faune', ddx: ['chat'], proxy: 'chat', food: false },
  { id: 'bison', label: 'Bison', group: 'faune', ddx: ['bovin'], proxy: 'bovin', food: false },
  { id: 'cervide', label: 'Cervidé', group: 'faune', ddx: ['ovin', 'caprin'], proxy: 'ovin', food: false },
  { id: 'bouquetin', label: 'Bouquetin / chamois', group: 'faune', ddx: ['caprin'], proxy: 'caprin', food: false },
  { id: 'sanglier', label: 'Sanglier', group: 'faune', ddx: ['porc'], proxy: 'porc', food: false },
];

export const speciesById = (id: SpeciesId): Species => SPECIES.find((s) => s.id === id)!;
