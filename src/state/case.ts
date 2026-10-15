// Cas en cours : réponses du parcours, valeurs d'analyses et analyse locale.
import { signal, computed } from '@preact/signals';
import type { CaseRecord } from '../db/db';
import { saveCase } from '../db/db';
import type { SpeciesId } from '../data/species';
import { interpretLab, deriveFindings, type LabValue } from '../engine/interpret';
import { computeAlerts } from '../engine/alerts';
import { rankDiseases, discriminants } from '../engine/ddx';
import { settings } from './settings';
import { breedByName } from '../data/breeds';
import { tempFinding, hrFinding, rrFinding } from '../data/vitals';
import { buildSteps, answerSigns, motifsOf, SEX_LABEL } from '../data/wizard';

export type Draft = CaseRecord;

export const draft = signal<Draft | null>(null);
/** Étape affichée du parcours */
export const step = signal(0);

export function newCase(species: SpeciesId) {
  draft.value = { createdAt: Date.now(), updatedAt: Date.now(), species, signs: [], notes: '', labs: [], answers: {} };
  step.value = 0;
}

export function openCase(c: CaseRecord) {
  draft.value = { ...c, answers: c.answers ?? {} };
  step.value = 0;
}

export function patch(p: Partial<Draft>) {
  if (draft.value) draft.value = { ...draft.value, ...p };
}

export function toggleSign(id: string) {
  const d = draft.value;
  if (!d) return;
  patch({ signs: d.signs.includes(id) ? d.signs.filter((s) => s !== id) : [...d.signs, id] });
}

/** Réponse à une étape du parcours ; met à jour les champs du signalement qui en dépendent */
export function setAnswer(stepId: string, answer: string | undefined) {
  const d = draft.value;
  if (!d) return;
  const answers = { ...(d.answers ?? {}) };
  if (answer == null) delete answers[stepId];
  else answers[stepId] = answer;
  const p: Partial<Draft> = { answers };
  if (stepId === 'age' || stepId === 'sex') {
    // Le stade ne s'applique plus (jeune, mâle) : sa réponse est retirée
    delete answers.stage;
  }
  const opt = buildSteps({ ...d, ...p }).find((s) => s.id === stepId)?.options?.find((o) => o.id === answer);
  if (stepId === 'age') p.age = opt ? `${opt.label}${opt.detail ? ` (${opt.detail})` : ''}` : undefined;
  if (stepId === 'sex') p.sex = answer ? SEX_LABEL[answer] : undefined;
  if (stepId === 'herd') p.herd = answer && answer !== 'seul' ? (d.herd ?? {}) : undefined;
  // Une plage choisie remplace une valeur exacte saisie avant
  if (stepId === 'temp' || stepId === 'hr' || stepId === 'rr') p[stepId] = undefined;
  patch(p);
}

/** Ajoute ou retire un motif de consultation (plusieurs possibles) */
export function toggleMotif(id: string) {
  const d = draft.value;
  if (!d) return;
  const cur = motifsOf(d);
  const motifs = cur.includes(id) ? cur.filter((m) => m !== id) : [...cur, id];
  // Les questions ciblées seront recalculées d'après les nouveaux motifs
  patch({ motifs, motif: undefined, questions: undefined });
}

/** Mesure exacte (température, FC, FR) : elle remplace la plage */
export function setMeasure(kind: 'temp' | 'hr' | 'rr', value: number | undefined) {
  const d = draft.value;
  if (!d) return;
  const answers = { ...(d.answers ?? {}) };
  if (value == null) delete answers[kind];
  else answers[kind] = 'exact';
  patch({ [kind]: value, answers });
}

/** Fige les questions ciblées d'après le classement du moment (en quittant l'étape des signes) */
export function freezeQuestions() {
  const d = draft.value;
  const a = analysis.value;
  if (!d || !a) return;
  const { signs } = discriminants(d.species, a.ddx, a.findings, 3, a.absent);
  patch({ questions: signs.map(({ id, label, supports }) => ({ id, label, supports: supports.slice(0, 2) })) });
}

export function setLab(v: LabValue) {
  const d = draft.value;
  if (!d) return;
  patch({ labs: [...d.labs.filter((x) => x.analyte !== v.analyte), v] });
}

export function removeLab(analyte: string) {
  const d = draft.value;
  if (d) patch({ labs: d.labs.filter((x) => x.analyte !== analyte) });
}

// ——— Analyse locale (instantanée) ———

export const analysis = computed(() => {
  const d = draft.value;
  if (!d) return null;
  const rows = interpretLab(d.species, d.labs, settings.value.customRanges);
  const labFindings = deriveFindings(d.species, rows);
  const fromAnswers = answerSigns(d);
  // La race renseigne le gabarit (chien de grande race à thorax profond)
  const breedFindings = breedByName(d.species, d.breed)?.large ? ['grand_chien'] : [];
  // Température et FC mesurées : elles priment sur « fièvre », « tachycardie »… cochés
  const overridden = new Set([...(d.temp != null ? ['fievre', 'hypothermie'] : []), ...(d.hr != null ? ['tachycardie', 'bradycardie'] : [])]);
  const signs = [...d.signs, ...fromAnswers.present].filter((s) => !overridden.has(s));
  // FR élevée : ajoute une dyspnée (tachypnée) ; une FR normale n'efface pas une dyspnée constatée
  const measured = [tempFinding(d.species, d.temp), hrFinding(d.species, d.hr), rrFinding(d.species, d.rr)].filter((x): x is NonNullable<typeof x> => !!x);
  const findings = [...new Set([...signs, ...labFindings, ...breedFindings, ...measured])];
  const absent = fromAnswers.absent.filter((x) => !findings.includes(x));
  return {
    rows,
    labFindings,
    findings,
    absent,
    ddx: rankDiseases(d.species, findings, 12, absent),
    alerts: computeAlerts(d.species, rows, findings),
  };
});

/** Réponses données après le motif (une valeur normale compte : c'est une information) */
export const answeredCount = computed(() => {
  const d = draft.value;
  if (!d) return 0;
  return Object.keys(d.answers ?? {}).filter((k) => k !== 'motif').length + (d.signs.length ? 1 : 0) + (d.labs.length ? 1 : 0);
});

/** Assez d'éléments pour un classement utile */
export const MIN_ANSWERS = 3;
export const canAnalyse = computed(() => {
  const d = draft.value;
  const a = analysis.value;
  return !!d && !!a && (motifsOf(d).length > 0 || d.labs.length > 0) && answeredCount.value >= MIN_ANSWERS && a.findings.length >= 2;
});

// ——— Enregistrement ———

export async function persist() {
  const d = draft.value;
  const a = analysis.value;
  if (!d || !a) return;
  const record: CaseRecord = {
    ...d,
    summary: { top: a.ddx[0]?.disease.name, alerts: a.alerts.length, critical: a.alerts.filter((x) => x.level === 'critique').length },
  };
  const id = await saveCase(record);
  if (!d.id) patch({ id });
}
