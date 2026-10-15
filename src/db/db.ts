// Historique des cas, stocké uniquement sur l'appareil (IndexedDB).
import Dexie, { type Table } from 'dexie';
import type { LabValue } from '../engine/interpret';
import type { SpeciesId } from '../data/species';

export interface Herd { effectif?: number; malades?: number; morts?: number; lot?: string }

export interface CaseRecord {
  id?: number;
  createdAt: number;
  updatedAt: number;
  species: SpeciesId;
  /** Référence de l'animal ou de l'élevage : reste sur l'appareil */
  ref?: string;
  age?: string;
  sex?: string;
  breed?: string;
  /** Température rectale (°C) */
  temp?: number;
  /** Fréquences cardiaque et respiratoire (/min) */
  hr?: number;
  rr?: number;
  weight?: number;
  /** Poids estimé (ruban, formule) et non pesé */
  weightEstimated?: boolean;
  herd?: Herd;
  /** Signes cochés (étape des signes, « Pour affiner ») */
  signs: string[];
  /** Parcours : motif, réponses par étape, questions ciblées figées */
  motifs?: string[];
  /** Motif unique des cas enregistrés avant le choix multiple */
  motif?: string;
  answers?: Record<string, string>;
  questions?: { id: string; label: string; supports: string[] }[];
  /** Commentaire libre des cas enregistrés par les versions précédentes */
  notes: string;
  labs: LabValue[];
  /** Texte de compte rendu des cas enregistrés par les versions précédentes */
  otherResults?: string;
  /** Photos des cas enregistrés par les versions précédentes (conservées à l'export) */
  photos?: Blob[];
  photoKinds?: ('analyse' | 'clinique')[];
  summary?: { top?: string; alerts: number; critical: number };
  /** false tant que la saisie n'est pas terminée (absent : cas des versions précédentes, enregistrés à la fin) */
  finished?: boolean;
  /** Étape du parcours où reprendre un cas interrompu */
  step?: number;
  /** Cas précédent du même animal (visite de suivi) */
  followOf?: number;
}

class VetoDB extends Dexie {
  cases!: Table<CaseRecord, number>;
  constructor() {
    super('vetoplus');
    this.version(1).stores({ cases: '++id, createdAt, updatedAt, species' });
  }
}

export const db = new VetoDB();

/** Dernier cas interrompu (saisie non terminée), s'il date de moins de 3 jours */
export async function lastUnfinished(): Promise<CaseRecord | undefined> {
  const since = Date.now() - 3 * 24 * 3600 * 1000;
  return db.cases.where('updatedAt').above(since).reverse().filter((c) => c.finished === false).first();
}

/** Visites précédentes du même animal, de la plus ancienne à la plus récente */
export async function previousVisits(c: CaseRecord): Promise<CaseRecord[]> {
  const out: CaseRecord[] = [];
  let id = c.followOf;
  while (id != null && out.length < 10) {
    const prev = await db.cases.get(id);
    if (!prev) break;
    out.unshift(prev);
    id = prev.followOf;
  }
  return out;
}

export async function saveCase(c: CaseRecord): Promise<number> {
  c.updatedAt = Date.now();
  return db.cases.put(c);
}

/** Demande au navigateur de ne pas effacer les données (Safari) */
export async function requestPersistence() {
  try { await navigator.storage?.persist?.(); } catch { /* non supporté */ }
}

export async function exportAll(): Promise<Blob> {
  const cases = await db.cases.toArray();
  const out = await Promise.all(cases.map(async (c) => ({
    ...c,
    photos: await Promise.all((c.photos ?? []).map(blobToDataUrl)),
  })));
  return new Blob([JSON.stringify({ app: 'veto-plus', version: 1, exportedAt: new Date().toISOString(), cases: out })], { type: 'application/json' });
}

export async function importAll(file: File): Promise<number> {
  const data = JSON.parse(await file.text());
  if (data.app !== 'veto-plus' || !Array.isArray(data.cases)) throw new Error('Fichier non reconnu');
  let n = 0;
  for (const c of data.cases) {
    const photos = await Promise.all((c.photos ?? []).map((d: string) => fetch(d).then((r) => r.blob())));
    const { id: _id, ...rest } = c;
    await db.cases.add({ ...rest, photos });
    n++;
  }
  return n;
}

function blobToDataUrl(b: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(b);
  });
}
