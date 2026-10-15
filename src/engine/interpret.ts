// Interprétation des valeurs biologiques : comparaison aux intervalles, conversion d'unités,
// déduction des anomalies utilisées par le diagnostic différentiel.
import { ANALYTES, analyteById, type Analyte } from '../data/analytes';
import { RANGES, RANGE_NOTES, RANGE_SOURCES, type Range, type RangeTable } from '../data/ranges';
import { speciesById, type SpeciesId } from '../data/species';

export interface LabValue {
  analyte: string;
  /** valeur dans l'unité canonique */
  value: number;
  /** valeur et unité telles que lues */
  rawValue?: number;
  rawUnit?: string;
  /** « ia » : valeur lue par l'IA dans une version précédente (cas anciens) */
  source: 'ocr' | 'ia' | 'manuel' | 'texte';
  unitGuessed?: boolean;
  /** intervalle imprimé sur le compte rendu (unité canonique) — prioritaire */
  reportRange?: Range;
}

export type LabStatus = 'low' | 'high' | 'normal' | 'unknown';

export interface LabRow {
  analyte: Analyte;
  value: number;
  range?: Range;
  rangeSource?: string;
  status: LabStatus;
  /** 0 = normal, 1 = léger, 2 = modéré, 3 = marqué */
  severity: 0 | 1 | 2 | 3;
  note?: string;
  input: LabValue;
}

/** Intervalle applicable : intervalles de la clinique > espèce > espèce proxy */
export function rangeFor(species: SpeciesId, analyte: string, custom?: Partial<Record<SpeciesId, RangeTable>>): { range?: Range; source?: string } {
  const c = custom?.[species]?.[analyte];
  if (c) return { range: c, source: 'Intervalles de la clinique' };
  const own = RANGES[species]?.[analyte];
  if (own) return { range: own, source: RANGE_SOURCES[species] };
  const proxy = speciesById(species).proxy;
  if (proxy) {
    const pc = custom?.[proxy]?.[analyte] ?? RANGES[proxy]?.[analyte];
    if (pc) return { range: pc, source: `Approximation : ${speciesById(proxy).label.toLowerCase()} (aucune référence propre à l’espèce intégrée)` };
  }
  return {};
}

export function interpretLab(species: SpeciesId, values: LabValue[], custom?: Partial<Record<SpeciesId, RangeTable>>): LabRow[] {
  const rows: LabRow[] = [];
  for (const v of values) {
    const a = analyteById(v.analyte);
    if (!a || !Number.isFinite(v.value)) continue;
    const ref = rangeFor(species, a.id, custom);
    const range = v.reportRange ?? ref.range;
    const source = v.reportRange ? 'Intervalle imprimé sur le compte rendu' : ref.source;
    let status: LabStatus = 'unknown';
    let severity: LabRow['severity'] = 0;
    if (range) {
      const [lo, hi] = range;
      const width = Math.max(hi - lo, Math.abs(hi) * 0.05, 1e-9);
      if (v.value > hi) {
        status = 'high';
        const r = (v.value - hi) / width;
        severity = r < 0.25 ? 1 : r < 1.5 ? 2 : 3;
      } else if (v.value < lo) {
        status = 'low';
        const r = (lo - v.value) / width;
        severity = r < 0.15 ? 1 : r < 0.5 ? 2 : 3;
      } else status = 'normal';
    }
    const note = RANGE_NOTES[species]?.[a.id] ?? (speciesById(species).proxy ? RANGE_NOTES[speciesById(species).proxy!]?.[a.id] : undefined);
    rows.push({ analyte: a, value: v.value, range, rangeSource: source, status, severity, note, input: v });
  }
  const order = new Map(ANALYTES.map((a, i) => [a.id, i]));
  return rows.sort((x, y) => (order.get(x.analyte.id)! - order.get(y.analyte.id)!));
}

/** Déduit les anomalies biologiques (identifiants de LAB_FINDINGS) */
export function deriveFindings(species: SpeciesId, rows: LabRow[]): string[] {
  const f = new Set<string>();
  const by = new Map(rows.map((r) => [r.analyte.id, r]));
  const hi = (id: string, min = 1) => { const r = by.get(id); return !!r && r.status === 'high' && r.severity >= min; };
  const lo = (id: string, min = 1) => { const r = by.get(id); return !!r && r.status === 'low' && r.severity >= min; };
  const val = (id: string) => by.get(id)?.value;

  if (lo('ht')) f.add('anemie');
  if (hi('ht')) f.add('polyglobulie');
  if (hi('gb')) f.add('leucocytose');
  if (lo('gb')) f.add('leucopenie');
  if (hi('neutro')) f.add('neutrophilie');
  if (lo('neutro')) f.add('neutropenie');
  if (lo('lympho')) f.add('lymphopenie');
  if (hi('lympho')) f.add('lymphocytose');
  if (hi('eosino')) f.add('eosinophilie');
  if (lo('plaq', species === 'chat' ? 2 : 1)) f.add('thrombopenie');
  if (hi('fibri') || hi('saa')) f.add('inflammation');
  if (hi('crea') || hi('uree', 2)) f.add('azotemie');
  if (hi('sdma')) f.add('sdma_haut');
  // Chat : hyperglycémie de stress fréquente, on exige un écart marqué
  if (hi('glu', species === 'chat' ? 2 : 1)) f.add('hyperglycemie');
  if (lo('glu')) f.add('hypoglycemie');
  if (hi('k')) f.add('hyperkaliemie');
  if (lo('k')) f.add('hypokaliemie');
  if (lo('na')) f.add('hyponatremie');
  if (hi('na')) f.add('hypernatremie');
  if (lo('cl')) f.add('hypochloremie');
  if (hi('ca') || hi('cai')) f.add('hypercalcemie');
  if (lo('ca') || lo('cai')) f.add('hypocalcemie');
  if (hi('p')) f.add('hyperphosphatemie');
  if (lo('p')) f.add('hypophosphatemie');
  if (lo('mg')) f.add('hypomagnesemie');
  if (hi('alat')) f.add('alat_haut');
  if (hi('pal', species === 'cheval' || species === 'bovin' ? 2 : 1)) f.add('pal_haut');
  if (hi('ggt')) f.add('ggt_haut');
  if (hi('asat')) f.add('asat_haut');
  if (hi('gldh')) f.add('gldh_haut');
  if (hi('ck')) f.add('ck_haut');
  if (hi('bili')) f.add('hyperbilirubinemie');
  if (hi('ab')) f.add('ab_haut');
  if (lo('alb')) f.add('hypoalbuminemie');
  if (hi('glob')) f.add('hyperglobulinemie');
  if (lo('pt')) f.add('hypoproteinemie');
  if (hi('pt')) f.add('hyperproteinemie');
  if (hi('chol')) f.add('hypercholesterolemie');
  if (hi('tg')) f.add('hypertriglyceridemie');
  if (hi('lipase')) f.add('lipase_haut');
  if (hi('lact')) f.add('lactate_haut');
  if (hi('bhb')) f.add('cetose');
  if (hi('agne')) f.add('agne_haut');
  if (hi('fructo')) f.add('fructo_haut');
  if (hi('t4')) f.add('t4_haut');
  if (lo('t4')) f.add('t4_bas');
  if (lo('hco3') || (lo('ph') && !hi('pco2'))) f.add('acidose');
  if (hi('hco3')) f.add('alcalose');
  if (hi('rpcu')) f.add('proteinurie');
  // ACVIM 2018 : hypertension à partir de 160 mmHg ; 140–159 = préhypertension, sans conclusion
  const pas = val('pas');
  if ((species === 'chien' || species === 'chat') && pas != null && pas >= 160) f.add('hypertension');

  const du = val('du');
  if (du != null && du > 1 && du < (species === 'chat' ? 1.030 : 1.025)) f.add('isosthenurie');

  const na = val('na'), k = val('k');
  if ((species === 'chien' || species === 'chat') && na != null && k != null && k > 0 && na / k < 27) f.add('na_k_bas');

  const alb = val('alb');
  const glob = val('glob') ?? (val('pt') != null && alb != null ? val('pt')! - alb : undefined);
  if (alb != null && glob != null && glob > 0 && alb / glob < 0.4) f.add('ag_bas');

  return [...f];
}

/**
 * Analytes qui recherchent chaque anomalie et sens de l'anomalie.
 * Une anomalie est écartée quand au moins un de ses analytes est dosé et qu'aucun ne va dans ce sens.
 */
const TESTED_BY: Record<string, [string[], 'high' | 'low']> = {
  anemie: [['ht'], 'low'], polyglobulie: [['ht'], 'high'],
  leucocytose: [['gb'], 'high'], leucopenie: [['gb'], 'low'],
  neutrophilie: [['neutro'], 'high'], neutropenie: [['neutro'], 'low'],
  lymphopenie: [['lympho'], 'low'], lymphocytose: [['lympho'], 'high'],
  eosinophilie: [['eosino'], 'high'], thrombopenie: [['plaq'], 'low'],
  inflammation: [['fibri', 'saa'], 'high'],
  azotemie: [['crea', 'uree'], 'high'], sdma_haut: [['sdma'], 'high'],
  hyperglycemie: [['glu'], 'high'], hypoglycemie: [['glu'], 'low'],
  hyperkaliemie: [['k'], 'high'], hypokaliemie: [['k'], 'low'],
  hyponatremie: [['na'], 'low'], hypernatremie: [['na'], 'high'], hypochloremie: [['cl'], 'low'],
  hypercalcemie: [['ca', 'cai'], 'high'], hypocalcemie: [['ca', 'cai'], 'low'],
  hyperphosphatemie: [['p'], 'high'], hypophosphatemie: [['p'], 'low'], hypomagnesemie: [['mg'], 'low'],
  alat_haut: [['alat'], 'high'], pal_haut: [['pal'], 'high'], ggt_haut: [['ggt'], 'high'],
  asat_haut: [['asat'], 'high'], gldh_haut: [['gldh'], 'high'], ck_haut: [['ck'], 'high'],
  hyperbilirubinemie: [['bili'], 'high'], ab_haut: [['ab'], 'high'],
  hypoalbuminemie: [['alb'], 'low'], hyperglobulinemie: [['glob'], 'high'],
  hypoproteinemie: [['pt'], 'low'], hyperproteinemie: [['pt'], 'high'],
  hypercholesterolemie: [['chol'], 'high'], hypertriglyceridemie: [['tg'], 'high'],
  lipase_haut: [['lipase'], 'high'], lactate_haut: [['lact'], 'high'],
  cetose: [['bhb'], 'high'], agne_haut: [['agne'], 'high'], fructo_haut: [['fructo'], 'high'],
  t4_haut: [['t4'], 'high'], t4_bas: [['t4'], 'low'],
  acidose: [['hco3'], 'low'], alcalose: [['hco3'], 'high'],
  proteinurie: [['rpcu'], 'high'], hypertension: [['pas'], 'high'],
};

/** Anomalies calculées : écartées dès que leurs valeurs sont saisies sans qu'elles ressortent */
const COMPUTED: Record<string, string[][]> = {
  isosthenurie: [['du']],
  na_k_bas: [['na', 'k']],
  ag_bas: [['alb', 'glob'], ['alb', 'pt']],
};

/**
 * Anomalies biologiques écartées par des valeurs dosées dans les normes.
 * Une valeur hors normes dans l'autre sens écarte aussi (glycémie basse : pas d'hyperglycémie) ;
 * une valeur un peu élevée mais sous le seuil retenu (glycémie de stress du chat) n'écarte rien.
 */
export function deriveAbsent(species: SpeciesId, rows: LabRow[]): string[] {
  const by = new Map(rows.map((r) => [r.analyte.id, r]));
  const found = new Set(deriveFindings(species, rows));
  const out: string[] = [];
  for (const [f, [ids, dir]] of Object.entries(TESTED_BY)) {
    if (found.has(f)) continue;
    const measured = ids.map((id) => by.get(id)).filter((r): r is LabRow => !!r && r.status !== 'unknown');
    if (measured.length && measured.every((r) => r.status !== dir)) out.push(f);
  }
  for (const [f, sets] of Object.entries(COMPUTED)) {
    if (found.has(f)) continue;
    if (f === 'na_k_bas' && species !== 'chien' && species !== 'chat') continue;
    if (sets.some((ids) => ids.every((id) => by.get(id)?.value != null))) out.push(f);
  }
  return out;
}

export function formatValue(a: Analyte, v: number): string {
  return v.toLocaleString('fr-FR', { maximumFractionDigits: a.decimals, minimumFractionDigits: 0 });
}
