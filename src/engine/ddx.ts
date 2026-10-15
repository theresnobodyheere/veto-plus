// Diagnostic différentiel local : classement pondéré des maladies selon les signes et anomalies.
import { DISEASES, type Disease } from '../data/diseases';
import { speciesById, type SpeciesId } from '../data/species';
import { LAB_FINDINGS, SEASONS, signLabel } from '../data/signs';
import { signsForSpecies } from './textSigns';

export interface DdxResult {
  disease: Disease;
  score: number;
  /** pourcentage des éléments évocateurs présents (pondéré) */
  coverage: number;
  matched: string[];
  missingKey: boolean;
}

/** Éléments propres aux femelles : une maladie qui en fait un signe cardinal (poids 3) est exclue chez un mâle (cas individuel) */
const FEMALE_ONLY = ['femelle_entiere', 'mise_bas_recente', 'gestation_avancee', 'ecoulement_vulvaire', 'retention_placentaire', 'mammite', 'mammite_induree', 'debut_lactation'];

/**
 * absent : éléments recherchés et déclarés absents (« Non » à une question ciblée).
 * Un signe cardinal absent retire un point au score de la maladie.
 */
export function rankDiseases(species: SpeciesId, findings: string[], limit = 12, absent: string[] = []): DdxResult[] {
  const sp = speciesById(species);
  const families = new Set<SpeciesId>([species, ...sp.ddx]);
  const present = new Set(findings);
  const missing = new Set(absent.filter((a) => !present.has(a)));
  const out: DdxResult[] = [];

  for (const d of DISEASES) {
    if (!d.species.some((s) => families.has(s))) continue;
    if (present.has('male') && !present.has('plusieurs_animaux') && FEMALE_ONLY.some((f) => d.f[f] === 3)) continue;
    if (d.requires && !d.requires.some((r) => present.has(r))) continue;
    let raw = 0, total = 0;
    const matched: string[] = [];
    for (const [fid, w] of Object.entries(d.f)) {
      total += w;
      if (present.has(fid)) { raw += w; matched.push(fid); }
      else if (w === 3 && missing.has(fid)) raw -= 1;
    }
    // La saison seule ne suffit pas à proposer une maladie
    if (!matched.some((m) => !SEASONS.includes(m))) continue;
    raw = Math.max(0, raw);
    const missingKey = !!d.key && !d.key.some((k) => present.has(k));
    let score = raw / Math.sqrt(total);
    if (missingKey) score *= 0.35;
    // Un seul élément peu spécifique ne suffit pas
    if (matched.length === 1 && raw < 3) score *= 0.5;
    out.push({ disease: d, score, coverage: Math.round((raw / total) * 100), matched, missingKey });
  }

  out.sort((a, b) => b.score - a.score || Number(!!b.disease.urgent) - Number(!!a.disease.urgent));
  const top = out[0]?.score ?? 0;
  return out.filter((r) => r.score >= top * 0.2).slice(0, limit);
}

/** Score à partir duquel une hypothèse repose sur un tableau clinique franc (≈ 3 signes cardinaux) */
const SOLID = 2.5;
/** Score minimal d'une hypothèse jugée solide (tête de classement fiable, probabilité « forte ») */
const FIRM = 1.2;

/** Niveau de probabilité à afficher : relatif aux autres hypothèses, mais « forte » seulement sur un tableau étayé (3 éléments ou plus) */
export function likelihood(r: DdxResult, best: number): 'forte' | 'moyenne' | 'faible' {
  const rel = r.score / (best || 1);
  if (rel > 0.75 && !r.missingKey && r.coverage >= 35 && r.matched.length >= 3 && r.score >= FIRM) return 'forte';
  if (rel > 0.4 && !r.missingKey) return 'moyenne';
  return 'faible';
}

/** Longueur de la barre (0–1) : absolue, pour qu'une hypothèse isolée sur un signe vague ne paraisse pas certaine */
export function strength(r: DdxResult): number {
  return Math.max(0.03, Math.min(1, r.score / SOLID));
}

export type Confidence = 'insuffisant' | 'orientation' | 'solide';

/** Solidité globale du classement, pour prévenir quand les éléments ne suffisent pas à orienter */
export function confidence(ddx: DdxResult[]): Confidence {
  const b = ddx[0];
  if (!b || b.matched.length < 2 || b.score < 0.6) return 'insuffisant';
  if (likelihood(b, b.score) !== 'forte') return 'orientation';
  return 'solide';
}

export interface Discriminant {
  id: string;
  label: string;
  /** Hypothèses que cet élément soutiendrait (les plus probables d'abord) */
  supports: string[];
}

/**
 * Éléments à rechercher pour départager les hypothèses en tête :
 * signes absents des hypothèses probables, surtout leurs signes cardinaux, et anomalies biologiques à doser.
 */
export function discriminants(species: SpeciesId, ddx: DdxResult[], findings: string[], limit = 8, absent: string[] = []): { signs: Discriminant[]; labs: Discriminant[] } {
  const best = ddx[0]?.score ?? 0;
  const top = ddx.filter((r) => r.score >= best * 0.25).slice(0, 6);
  const present = new Set([...findings, ...absent]);
  const available = new Set(signsForSpecies(species).map((s) => s.id));
  const acc = new Map<string, { v: number; by: { name: string; v: number }[] }>();

  for (const r of top) {
    const rel = r.score / (best || 1);
    for (const [fid, w] of Object.entries(r.disease.f)) {
      if (present.has(fid) || (!available.has(fid) && !(fid in LAB_FINDINGS))) continue;
      // Un signe cardinal manquant pèse double : le trouver change vraiment le classement
      const v = rel * w * (r.disease.key?.includes(fid) ? 2 : 1);
      const e = acc.get(fid) ?? { v: 0, by: [] };
      e.v += v;
      e.by.push({ name: r.disease.name, v });
      acc.set(fid, e);
    }
  }

  const ranked = [...acc.entries()]
    .map(([id, e]) => {
      // Présent dans toutes les hypothèses : n'aide pas à les départager
      const spread = top.length >= 3 && e.by.length === top.length ? 0.5 : 1;
      return { id, score: e.v * spread, label: signLabel(id), supports: e.by.sort((a, b) => b.v - a.v).map((b) => b.name) };
    })
    .filter((x) => x.score >= 1)
    .sort((a, b) => b.score - a.score);
  const pick = (lab: boolean) => ranked.filter((x) => (x.id in LAB_FINDINGS) === lab).slice(0, limit).map(({ score: _s, ...x }) => x);
  return { signs: pick(false), labs: pick(true) };
}
