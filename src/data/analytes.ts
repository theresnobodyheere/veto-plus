// Analytes reconnus, unité de référence (SI, usage français) et conversions.
// Facteurs : valeur_canonique = valeur_saisie × facteur.
// Conversions standard (Système international) ; vérifiées sur les tables du Merck Veterinary Manual.

export type AnalyteGroup = 'hemato' | 'biochimie' | 'electrolytes' | 'gaz' | 'endocrino' | 'urine' | 'mesure';

export interface Analyte {
  id: string;
  label: string;
  short: string;
  group: AnalyteGroup;
  unit: string;
  /** unités normalisées (voir normalizeUnit) -> facteur vers l'unité canonique */
  units: Record<string, number>;
  /** synonymes rencontrés sur les comptes rendus (insensible à la casse) */
  aliases: string[];
  /** synonymes courts, sensibles à la casse (ex. « Na », « K ») */
  exact?: string[];
  /** Conversion spécifique à certains synonymes (ex. BUN en mg/dL) */
  aliasUnits?: Record<string, Record<string, number>>;
  decimals: number;
}

const U = 'U/L';
const enzyme = { 'u/l': 1, 'iu/l': 1, 'ui/l': 1, 'µkat/l': 60 };
const cells9 = { '10^9/l': 1, 'g/l': 1, 'k/µl': 1, '10^3/µl': 1, '/µl': 0.001, '10^3/mm3': 1, '/mm3': 0.001 };

export const ANALYTES: Analyte[] = [
  // ——— Hématologie ———
  { id: 'ht', label: 'Hématocrite', short: 'Ht', group: 'hemato', unit: '%', decimals: 1,
    units: { '%': 1, 'l/l': 100 }, aliases: ['hématocrite', 'hematocrite', 'hct', 'hte', 'pcv', 'vgm%'], exact: ['HT', 'Ht'] },
  { id: 'hb', label: 'Hémoglobine', short: 'Hb', group: 'hemato', unit: 'g/L', decimals: 0,
    units: { 'g/l': 1, 'g/dl': 10, 'mmol/l': 16.11 }, aliases: ['hémoglobine', 'hemoglobine', 'hemoglobin', 'hgb'], exact: ['Hb', 'HB'] },
  { id: 'gr', label: 'Globules rouges', short: 'GR', group: 'hemato', unit: '10¹²/L', decimals: 2,
    units: { '10^12/l': 1, 't/l': 1, 'm/µl': 1, '10^6/µl': 1, '10^6/mm3': 1 }, aliases: ['globules rouges', 'hématies', 'hematies', 'érythrocytes', 'rbc'], exact: ['GR'] },
  { id: 'vgm', label: 'VGM', short: 'VGM', group: 'hemato', unit: 'fL', decimals: 1,
    units: { 'fl': 1, 'µm3': 1 }, aliases: ['vgm', 'mcv', 'volume globulaire moyen'] },
  { id: 'ccmh', label: 'CCMH', short: 'CCMH', group: 'hemato', unit: 'g/dL', decimals: 1,
    units: { 'g/dl': 1, 'g/l': 0.1, '%': 1 }, aliases: ['ccmh', 'mchc'] },
  { id: 'retic', label: 'Réticulocytes', short: 'Rétic', group: 'hemato', unit: '10⁹/L', decimals: 1,
    units: cells9, aliases: ['réticulocytes', 'reticulocytes', 'retic', 'réti'] },
  { id: 'gb', label: 'Globules blancs', short: 'GB', group: 'hemato', unit: '10⁹/L', decimals: 2,
    units: cells9, aliases: ['globules blancs', 'leucocytes', 'wbc', 'leuco'], exact: ['GB'] },
  { id: 'neutro', label: 'Neutrophiles', short: 'Neutro', group: 'hemato', unit: '10⁹/L', decimals: 2,
    units: cells9, aliases: ['neutrophiles', 'neutrophils', 'neu', 'neut', 'pnn', 'granulocytes neutrophiles'] },
  { id: 'lympho', label: 'Lymphocytes', short: 'Lympho', group: 'hemato', unit: '10⁹/L', decimals: 2,
    units: cells9, aliases: ['lymphocytes', 'lym', 'lymph'] },
  { id: 'mono', label: 'Monocytes', short: 'Mono', group: 'hemato', unit: '10⁹/L', decimals: 2,
    units: cells9, aliases: ['monocytes', 'mono'] },
  { id: 'eosino', label: 'Éosinophiles', short: 'Éosino', group: 'hemato', unit: '10⁹/L', decimals: 2,
    units: cells9, aliases: ['éosinophiles', 'eosinophiles', 'eosinophils', 'eos', 'pne'] },
  { id: 'plaq', label: 'Plaquettes', short: 'PLT', group: 'hemato', unit: '10⁹/L', decimals: 0,
    units: cells9, aliases: ['plaquettes', 'thrombocytes', 'plt', 'plq', 'platelets'] },
  { id: 'fibri', label: 'Fibrinogène', short: 'Fibrino', group: 'hemato', unit: 'g/L', decimals: 1,
    units: { 'g/l': 1, 'mg/dl': 0.01 }, aliases: ['fibrinogène', 'fibrinogene', 'fib'] },

  // ——— Biochimie ———
  { id: 'glu', label: 'Glucose', short: 'Glu', group: 'biochimie', unit: 'mmol/L', decimals: 1,
    units: { 'mmol/l': 1, 'mg/dl': 0.0555, 'g/l': 5.55 }, aliases: ['glucose', 'glycémie', 'glycemie', 'glu'] },
  { id: 'uree', label: 'Urée', short: 'Urée', group: 'biochimie', unit: 'mmol/L', decimals: 1,
    units: { 'mmol/l': 1, 'g/l': 16.65, 'mg/dl': 0.1665 }, aliases: ['urée', 'uree', 'urea', 'bun', 'ure'],
    aliasUnits: { bun: { 'mg/dl': 0.357, 'mmol/l': 1 } } },
  { id: 'crea', label: 'Créatinine', short: 'Créat', group: 'biochimie', unit: 'µmol/L', decimals: 0,
    units: { 'µmol/l': 1, 'mg/dl': 88.4, 'mg/l': 8.84 }, aliases: ['créatinine', 'creatinine', 'créat', 'créa', 'crea', 'creat', 'cre', 'crt'] },
  { id: 'sdma', label: 'SDMA', short: 'SDMA', group: 'biochimie', unit: 'µg/dL', decimals: 0,
    units: { 'µg/dl': 1 }, aliases: ['sdma'] },
  { id: 'pt', label: 'Protéines totales', short: 'PT', group: 'biochimie', unit: 'g/L', decimals: 0,
    units: { 'g/l': 1, 'g/dl': 10 }, aliases: ['protéines totales', 'proteines totales', 'protides', 'tp', 'tpro', 'prot tot', 'protéines'], exact: ['PT'] },
  { id: 'alb', label: 'Albumine', short: 'Alb', group: 'biochimie', unit: 'g/L', decimals: 0,
    units: { 'g/l': 1, 'g/dl': 10 }, aliases: ['albumine', 'albumin', 'alb'] },
  { id: 'glob', label: 'Globulines', short: 'Glob', group: 'biochimie', unit: 'g/L', decimals: 0,
    units: { 'g/l': 1, 'g/dl': 10 }, aliases: ['globulines', 'globulin', 'glob'] },
  { id: 'alat', label: 'ALAT (ALT)', short: 'ALAT', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['alat', 'alt', 'gpt', 'sgpt', 'alanine aminotransférase'] },
  { id: 'pal', label: 'Phosphatases alcalines', short: 'PAL', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['phosphatases alcalines', 'phosphatase alcaline', 'pal', 'alkp', 'alp', 'palc'] },
  { id: 'ggt', label: 'GGT', short: 'GGT', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['ggt', 'gamma gt', 'γgt', 'gamma-gt', 'gamma glutamyl'] },
  { id: 'asat', label: 'ASAT (AST)', short: 'ASAT', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['asat', 'ast', 'got', 'sgot'] },
  { id: 'gldh', label: 'GLDH', short: 'GLDH', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['gldh', 'gdh', 'glutamate deshydrogenase', 'glutamate déshydrogénase'] },
  { id: 'ck', label: 'CK (CPK)', short: 'CK', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['cpk', 'créatine kinase', 'creatine kinase', 'ck'] },
  { id: 'bili', label: 'Bilirubine totale', short: 'Bili', group: 'biochimie', unit: 'µmol/L', decimals: 1,
    units: { 'µmol/l': 1, 'mg/dl': 17.1, 'mg/l': 1.71 }, aliases: ['bilirubine totale', 'bilirubine', 'tbil', 'bil tot', 'bili', 'tbili'] },
  { id: 'ab', label: 'Acides biliaires', short: 'AB', group: 'biochimie', unit: 'µmol/L', decimals: 1,
    units: { 'µmol/l': 1 }, aliases: ['acides biliaires', 'sels biliaires', 'bile acids', 'tba'] },
  { id: 'chol', label: 'Cholestérol', short: 'Chol', group: 'biochimie', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.02586, 'g/l': 2.586 }, aliases: ['cholestérol', 'cholesterol', 'chol'] },
  { id: 'tg', label: 'Triglycérides', short: 'TG', group: 'biochimie', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.01129, 'g/l': 1.129 }, aliases: ['triglycérides', 'triglycerides', 'trig', 'tg'] },
  { id: 'lipase', label: 'Lipase (DGGR / spec)', short: 'Lipase', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['lipase', 'lips', 'dggr'] },
  { id: 'amyl', label: 'Amylase', short: 'Amyl', group: 'biochimie', unit: U, decimals: 0,
    units: enzyme, aliases: ['amylase', 'amyl'] },
  { id: 'lact', label: 'Lactates', short: 'Lact', group: 'gaz', unit: 'mmol/L', decimals: 1,
    units: { 'mmol/l': 1, 'mg/dl': 0.111 }, aliases: ['lactates', 'lactate', 'lac', 'lact'] },
  { id: 'bhb', label: 'β-hydroxybutyrate', short: 'BHB', group: 'biochimie', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'µmol/l': 0.001, 'mg/dl': 0.096 }, aliases: ['bhb', 'β-hydroxybutyrate', 'beta-hydroxybutyrate', 'bhba', 'hydroxybutyrate', 'corps cétoniques'] },
  { id: 'agne', label: 'AGNE (NEFA)', short: 'AGNE', group: 'biochimie', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'µmol/l': 0.001, 'meq/l': 1 }, aliases: ['agne', 'nefa', 'acides gras non estérifiés', 'acides gras libres'] },
  { id: 'saa', label: 'SAA', short: 'SAA', group: 'biochimie', unit: 'mg/L', decimals: 0,
    units: { 'mg/l': 1, 'µg/ml': 1 }, aliases: ['saa', 'serum amyloid a', 'amyloïde a'] },
  { id: 'fructo', label: 'Fructosamine', short: 'Fructo', group: 'endocrino', unit: 'µmol/L', decimals: 0,
    units: { 'µmol/l': 1 }, aliases: ['fructosamine', 'fruc'] },

  // ——— Électrolytes et minéraux ———
  { id: 'na', label: 'Sodium', short: 'Na⁺', group: 'electrolytes', unit: 'mmol/L', decimals: 0,
    units: { 'mmol/l': 1, 'meq/l': 1 }, aliases: ['sodium'], exact: ['Na', 'NA', 'Na+'] },
  { id: 'k', label: 'Potassium', short: 'K⁺', group: 'electrolytes', unit: 'mmol/L', decimals: 1,
    units: { 'mmol/l': 1, 'meq/l': 1 }, aliases: ['potassium'], exact: ['K', 'K+'] },
  { id: 'cl', label: 'Chlore', short: 'Cl⁻', group: 'electrolytes', unit: 'mmol/L', decimals: 0,
    units: { 'mmol/l': 1, 'meq/l': 1 }, aliases: ['chlorures', 'chlore', 'chloride'], exact: ['Cl', 'CL', 'Cl-'] },
  { id: 'ca', label: 'Calcium total', short: 'Ca', group: 'electrolytes', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.2495, 'mg/l': 0.02495, 'meq/l': 0.5 }, aliases: ['calcium total', 'calcium', 'calcémie', 'calcemie'], exact: ['Ca', 'CA'] },
  { id: 'cai', label: 'Calcium ionisé', short: 'Ca²⁺', group: 'electrolytes', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.2495 }, aliases: ['calcium ionisé', 'calcium ionise', 'ica', 'ca++', 'ca2+', 'cai'] },
  { id: 'p', label: 'Phosphore', short: 'P', group: 'electrolytes', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.3229, 'mg/l': 0.03229 }, aliases: ['phosphore', 'phosphates', 'phos', 'phosphorus'], exact: ['P', 'PHOS'] },
  { id: 'mg', label: 'Magnésium', short: 'Mg', group: 'electrolytes', unit: 'mmol/L', decimals: 2,
    units: { 'mmol/l': 1, 'mg/dl': 0.4114, 'mg/l': 0.04114, 'meq/l': 0.5 }, aliases: ['magnésium', 'magnesium'], exact: ['Mg', 'MG'] },
  { id: 'hco3', label: 'Bicarbonates', short: 'HCO₃⁻', group: 'gaz', unit: 'mmol/L', decimals: 0,
    units: { 'mmol/l': 1, 'meq/l': 1 }, aliases: ['bicarbonates', 'hco3', 'tco2', 'co2 total', 'réserve alcaline'] },
  { id: 'ph', label: 'pH', short: 'pH', group: 'gaz', unit: '', decimals: 2,
    units: { '': 1 }, aliases: [], exact: ['pH', 'PH'] },
  { id: 'pco2', label: 'pCO₂', short: 'pCO₂', group: 'gaz', unit: 'mmHg', decimals: 0,
    units: { 'mmhg': 1, 'kpa': 7.5 }, aliases: ['pco2'] },

  // ——— Endocrinologie ———
  { id: 't4', label: 'T4 totale', short: 'T4', group: 'endocrino', unit: 'nmol/L', decimals: 0,
    units: { 'nmol/l': 1, 'µg/dl': 12.87 }, aliases: ['t4 totale', 'tt4', 'thyroxine', 't4'] },

  // ——— Urines ———
  { id: 'du', label: 'Densité urinaire', short: 'DU', group: 'urine', unit: '', decimals: 3,
    units: { '': 1 }, aliases: ['densité urinaire', 'densite urinaire', 'usg', 'densité', 'sg'] },
  { id: 'rpcu', label: 'RPCU', short: 'RPCU', group: 'urine', unit: '', decimals: 2,
    units: { '': 1 }, aliases: ['rpcu', 'upc', 'upcr', 'rapport protéines/créatinine'] },

  // ——— Mesures ———
  { id: 'pas', label: 'Pression artérielle systolique', short: 'PAS', group: 'mesure', unit: 'mmHg', decimals: 0,
    units: { 'mmhg': 1, 'kpa': 7.5 }, aliases: ['pression artérielle systolique', 'pression systolique', 'tension artérielle', 'sbp'], exact: ['PAS', 'PA'] },
];

export const analyteById = (id: string): Analyte | undefined => ANALYTES.find((a) => a.id === id);

/** Normalise une unité lue sur un compte rendu (OCR ou saisie) */
export function normalizeUnit(raw: string | undefined): string {
  if (!raw) return '';
  let s = raw.trim().toLowerCase().replace(/\s+/g, '');
  s = s.replace(/μ/g, 'µ').replace(/³/g, '3').replace(/¹²/g, '^12').replace(/⁹/g, '^9');
  s = s.replace(/(^|[/k])u(mol|g|l)/g, '$1µ$2'); // umol -> µmol, k/ul -> k/µl
  s = s.replace(/^(x)?10e?\^?(9|12|3|6)/, '10^$2').replace(/^x/, '');
  s = s.replace(/^10\^?9/, '10^9').replace(/^109\//, '10^9/').replace(/^1012\//, '10^12/');
  s = s.replace(/^ui\/l$|^iu\/l$/, 'u/l');
  // OCR : « U/L » souvent lu « uL » ou « UIL »
  if (s === 'µl' || s === 'ul' || s === 'uil' || s === 'u/i' || s === 'u1l') s = 'u/l';
  s = s.replace(/^g\/l\(10\^9\/l\)$/, 'g/l');
  return s;
}

/** Convertit une valeur vers l'unité canonique ; renvoie null si l'unité est inconnue. */
export function toCanonical(a: Analyte, value: number, unit: string, alias?: string): number | null {
  const u = normalizeUnit(unit);
  const special = alias ? a.aliasUnits?.[alias.toLowerCase()] : undefined;
  const f = special?.[u] ?? a.units[u];
  if (f == null) return null;
  return value * f;
}
