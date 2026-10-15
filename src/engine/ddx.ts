// Diagnostic différentiel local : classement pondéré des maladies selon les signes et anomalies.
import { DISEASES, type Disease } from '../data/diseases';
import { speciesById, type SpeciesId } from '../data/species';

export interface DdxResult {
  disease: Disease;
  score: number;
  /** pourcentage des éléments évocateurs présents (pondéré) */
  coverage: number;
  matched: string[];
  missingKey: boolean;
}

export function rankDiseases(species: SpeciesId, findings: string[], limit = 12): DdxResult[] {
  const sp = speciesById(species);
  const families = new Set<SpeciesId>([species, ...sp.ddx]);
  const present = new Set(findings);
  const out: DdxResult[] = [];

  for (const d of DISEASES) {
    if (!d.species.some((s) => families.has(s))) continue;
    let raw = 0, total = 0;
    const matched: string[] = [];
    for (const [fid, w] of Object.entries(d.f)) {
      total += w;
      if (present.has(fid)) { raw += w; matched.push(fid); }
    }
    if (!matched.length) continue;
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

/** Niveau de probabilité relative à afficher */
export function likelihood(r: DdxResult, best: number): 'forte' | 'moyenne' | 'faible' {
  const rel = r.score / (best || 1);
  if (rel > 0.75 && !r.missingKey && r.coverage >= 30) return 'forte';
  if (rel > 0.4 && !r.missingKey) return 'moyenne';
  return 'faible';
}
