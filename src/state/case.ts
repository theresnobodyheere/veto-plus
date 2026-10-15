// Cas en cours : saisie, lecture des photos et analyse locale.
import { signal, computed } from '@preact/signals';
import type { CaseRecord } from '../db/db';
import { saveCase } from '../db/db';
import { speciesById, type SpeciesId } from '../data/species';
const speciesGroup = (id: SpeciesId) => speciesById(id).group;
import { interpretLab, deriveFindings, type LabValue } from '../engine/interpret';
import { computeAlerts } from '../engine/alerts';
import { rankDiseases } from '../engine/ddx';
import { settings } from './settings';
import { parseLabText } from '../ocr/parse';
import { parseNotes } from '../engine/notes';
import { compressImage } from '../lib/image';
import { breedByName } from '../data/breeds';
import { tempFinding } from '../data/vitals';

/** kind « auto » : photo pas encore triée (la lecture décide s'il s'agit d'analyses) */
export interface Photo { blob: Blob; url: string; kind: 'analyse' | 'clinique' | 'auto'; read?: boolean }

export interface Draft extends Omit<CaseRecord, 'photos'> {
  photos: Photo[];
  /** Champs remplis depuis le commentaire (ils suivent le texte tant que l'utilisateur ne les modifie pas) */
  auto?: AutoFilled;
  /** Signes retirés à la main : ne plus les reprendre depuis le texte */
  dismissed?: string[];
}

export interface AutoFilled { weight?: boolean; age?: boolean; sex?: boolean; breed?: boolean; temp?: boolean; herd?: boolean; signs: string[]; labs: string[] }

export const draft = signal<Draft | null>(null);

export function newCase(species: SpeciesId) {
  draft.value = {
    createdAt: Date.now(), updatedAt: Date.now(), species, signs: [], notes: '', labs: [], photos: [],
  };
  reading.value = { status: 'idle' };
}

export function openCase(c: CaseRecord) {
  draft.value = { ...c, photos: c.photos.map((b, i) => ({ blob: b, url: URL.createObjectURL(b), kind: c.photoKinds?.[i] ?? 'analyse', read: true })) };
  reading.value = { status: 'idle' };
}

export function patch(p: Partial<Draft>) {
  if (draft.value) draft.value = { ...draft.value, ...p };
}

export function toggleSign(id: string) {
  const d = draft.value;
  if (!d) return;
  const auto = d.auto ?? { signs: [], labs: [] };
  if (d.signs.includes(id)) {
    patch({ signs: d.signs.filter((s) => s !== id), dismissed: [...new Set([...(d.dismissed ?? []), id])], auto: { ...auto, signs: auto.signs.filter((s) => s !== id) } });
  } else {
    patch({ signs: [...d.signs, id], dismissed: (d.dismissed ?? []).filter((s) => s !== id) });
  }
}

/** Saisie à la main d'un champ du signalement : il ne suit plus le commentaire */
export function patchManual(p: Partial<Pick<Draft, 'weight' | 'age' | 'sex' | 'breed' | 'temp' | 'herd'>>) {
  const d = draft.value;
  if (!d) return;
  const auto = { ...(d.auto ?? { signs: [], labs: [] }) };
  for (const k of Object.keys(p) as (keyof typeof p)[]) auto[k] = false;
  patch({ ...p, auto });
}

/** Met à jour le commentaire et remplit la page avec ce qu'il contient */
export function setNotes(notes: string) {
  const d = draft.value;
  if (!d) return;
  const f = parseNotes(notes, d.species);
  const prev = d.auto ?? { signs: [], labs: [] };
  const auto: AutoFilled = { ...prev, signs: [], labs: [] };
  const next: Partial<Draft> = { notes };

  // Signalement : rempli si vide, ou s'il venait déjà du texte
  for (const k of ['weight', 'age', 'sex', 'breed', 'temp'] as const) {
    if (d[k] == null || d[k] === '' || prev[k]) {
      (next as any)[k] = f[k];
      auto[k] = f[k] != null;
    }
  }
  if (speciesGroup(d.species) !== 'canine' && (!d.herd || prev.herd)) {
    next.herd = f.herd ?? (prev.herd ? undefined : d.herd);
    auto.herd = !!f.herd;
  }

  // Signes : ceux qui viennent du texte suivent le texte ; les signes choisis à la main restent
  const dismissed = new Set(d.dismissed ?? []);
  const fromText = f.signs.filter((s) => !dismissed.has(s));
  if ((f.herd?.malades ?? 0) > 1 && !dismissed.has('plusieurs_animaux')) fromText.push('plusieurs_animaux');
  const manual = d.signs.filter((s) => !prev.signs.includes(s));
  next.signs = [...new Set([...manual, ...fromText])];
  auto.signs = fromText.filter((s) => !manual.includes(s));

  // Valeurs : jamais au détriment d'une valeur saisie, ou photographiée
  const kept = d.labs.filter((l) => l.source !== 'texte');
  const textLabs = f.labs.filter((v) => !kept.some((l) => l.analyte === v.analyte) && !dismissed.has(`lab:${v.analyte}`));
  next.labs = [...kept, ...textLabs];
  auto.labs = textLabs.map((l) => l.analyte);

  next.auto = auto;
  patch(next);
}

export function setLab(v: LabValue) {
  const d = draft.value;
  if (!d) return;
  patch({ labs: [...d.labs.filter((x) => x.analyte !== v.analyte), v] });
}

export function removeLab(analyte: string) {
  const d = draft.value;
  if (d) patch({ labs: d.labs.filter((x) => x.analyte !== analyte), dismissed: [...new Set([...(d.dismissed ?? []), `lab:${analyte}`])] });
}

// ——— Analyse locale (instantanée) ———

export const analysis = computed(() => {
  const d = draft.value;
  if (!d) return null;
  const rows = interpretLab(d.species, d.labs, settings.value.customRanges);
  const labFindings = deriveFindings(d.species, rows);
  // La race renseigne le gabarit (chien de grande race à thorax profond)
  const breedFindings = breedByName(d.species, d.breed)?.large ? ['grand_chien'] : [];
  // Température mesurée : elle prime sur « fièvre » / « hypothermie » cochés ou dictés
  const signs = d.temp != null ? d.signs.filter((s) => s !== 'fievre' && s !== 'hypothermie') : d.signs;
  const t = tempFinding(d.species, d.temp);
  const findings = [...new Set([...signs, ...labFindings, ...breedFindings, ...(t ? [t] : [])])];
  return {
    rows,
    labFindings,
    findings,
    ddx: rankDiseases(d.species, findings),
    alerts: computeAlerts(d.species, rows, d.signs),
  };
});

// ——— Lecture des photos ———

export const reading = signal<{ status: 'idle' | 'running' | 'done' | 'error'; message?: string; progress?: number }>({ status: 'idle' });

export async function addPhotos(files: FileList | File[], kind: Photo['kind'] = 'auto') {
  const d = draft.value;
  if (!d) return;
  const added: Photo[] = [];
  for (const f of Array.from(files)) {
    const blob = await compressImage(f);
    added.push({ blob, url: URL.createObjectURL(blob), kind });
  }
  patch({ photos: [...draft.value!.photos, ...added] });
  if (kind !== 'clinique') await readPhotos();
}

export function setPhotoKind(i: number, kind: Photo['kind']) {
  const d = draft.value;
  if (!d) return;
  const photos = d.photos.map((p, j) => (j === i ? { ...p, kind, read: kind === 'clinique' ? p.read : false } : p));
  patch({ photos });
  if (kind === 'analyse') void readPhotos();
}

export function removePhoto(i: number) {
  const d = draft.value;
  if (!d) return;
  URL.revokeObjectURL(d.photos[i].url);
  patch({ photos: d.photos.filter((_, j) => j !== i) });
}

/** Fusionne des valeurs lues sans écraser les saisies manuelles */
function mergeLabs(values: LabValue[]) {
  const d = draft.value!;
  const manual = new Set(d.labs.filter((l) => l.source === 'manuel').map((l) => l.analyte));
  const keep = d.labs.filter((l) => manual.has(l.analyte) || !values.some((v) => v.analyte === l.analyte));
  patch({ labs: [...keep, ...values.filter((v) => !manual.has(v.analyte))] });
}

export async function readPhotos() {
  const d = draft.value;
  if (!d) return;
  const todo = d.photos.map((p, i) => ({ p, i })).filter(({ p }) => p.kind !== 'clinique' && !p.read).slice(0, 6);
  if (!todo.length) return;
  reading.value = { status: 'running', message: 'Lecture des photos…' };
  const kinds = new Map<number, Photo['kind']>();
  try {
    const { ocrImage } = await import('../ocr/tesseract');
    const values: LabValue[] = [];
    for (const [k, { p, i }] of todo.entries()) {
      const text = await ocrImage(p.blob, (pr) => {
        reading.value = { status: 'running', message: `Lecture ${k + 1}/${todo.length}…`, progress: pr };
      });
      const found = parseLabText(text, d.species);
      values.push(...found);
      // Sans valeur reconnue, une photo non triée est considérée comme clinique
      kinds.set(i, found.length || p.kind === 'analyse' ? 'analyse' : 'clinique');
    }
    mergeLabs(values);
    reading.value = values.length || [...kinds.values()].includes('clinique')
      ? { status: 'done', message: readingSummary(values.length, kinds) }
      : { status: 'error', message: 'Aucune valeur reconnue. Photo plus nette, bien à plat, ou saisie manuelle.' };
  } catch (e) {
    reading.value = { status: 'error', message: `Lecture impossible : ${(e as Error).message}` };
  }
  const photos = draft.value!.photos.map((p, i) => (kinds.has(i) ? { ...p, kind: kinds.get(i)!, read: true } : p));
  patch({ photos });
}

function readingSummary(values: number, kinds: Map<number, Photo['kind']>): string {
  const clin = [...kinds.values()].filter((k) => k === 'clinique').length;
  const parts = [
    values ? `${values} valeur${values > 1 ? 's' : ''} lue${values > 1 ? 's' : ''} — vérifiez-les` : '',
    clin ? `${clin} photo${clin > 1 ? 's' : ''} clinique${clin > 1 ? 's' : ''}, conservée${clin > 1 ? 's' : ''} avec le cas` : '',
  ].filter(Boolean);
  return `${parts.join(' · ')}.`;
}

// ——— Enregistrement ———

export async function persist() {
  const d = draft.value;
  const a = analysis.value;
  if (!d || !a) return;
  const { photos, auto: _auto, dismissed: _dismissed, ...rest } = d;
  const record: CaseRecord = {
    ...rest,
    photos: photos.map((p) => p.blob),
    // Une photo encore « à trier » à l'enregistrement est gardée comme clinique
    photoKinds: photos.map((p) => (p.kind === 'analyse' ? 'analyse' : 'clinique')),
    summary: { top: a.ddx[0]?.disease.name, alerts: a.alerts.length, critical: a.alerts.filter((x) => x.level === 'critique').length },
  };
  const id = await saveCase(record);
  if (!d.id) patch({ id });
}
