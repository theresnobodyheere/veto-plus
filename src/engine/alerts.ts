// Alertes vitales : valeurs critiques nécessitant une action immédiate.
// Seuils issus de : Merck Veterinary Manual ; Silverstein & Hopper, Small Animal Critical Care Medicine ;
// Constable (Radostits) pour les ruminants ; Smith pour les équidés.
import type { SpeciesId } from '../data/species';
import { speciesById } from '../data/species';
import type { LabRow } from './interpret';

export interface Alert {
  level: 'critique' | 'attention';
  title: string;
  detail: string;
}

type Fam = 'carn' | 'rum' | 'equ' | 'porc' | 'prim';
const family = (s: SpeciesId): Fam => {
  const base = speciesById(s).proxy ?? s;
  if (base === 'chien' || base === 'chat') return 'carn';
  if (base === 'bovin' || base === 'ovin' || base === 'caprin') return 'rum';
  if (base === 'cheval') return 'equ';
  if (base === 'porc') return 'porc';
  return 'prim';
};

/** Nombre au format français (virgule décimale) */
const fr = (n: number, d: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: d, maximumFractionDigits: d });

export function computeAlerts(species: SpeciesId, rows: LabRow[], signs: string[] = []): Alert[] {
  const v = new Map(rows.map((r) => [r.analyte.id, r.value]));
  const g = (id: string) => v.get(id);
  const out: Alert[] = [];
  const fam = family(species);
  const add = (level: Alert['level'], title: string, detail: string) => out.push({ level, title, detail });
  const young = signs.includes('jeune');

  // Examen : conscience et perfusion
  if (signs.includes('stupeur_coma')) add('critique', 'Altération de la conscience (stupeur, coma)', 'Libérer les voies aériennes, oxygène. Glycémie et température immédiates. Rechercher : hypoglycémie, intoxication, traumatisme crânien, encéphalose hépatique, hypocalcémie, choc.');
  if (signs.includes('trc_allonge') && (signs.includes('tachycardie') || signs.includes('hypothermie') || signs.includes('muqueuses_pales')))
    add('critique', 'Signes de choc', 'TRC allongé avec tachycardie, pâleur ou hypothermie : abord veineux, remplissage vasculaire, lactates, recherche d’une hémorragie (AFAST) ou d’un sepsis.');

  const k = g('k');
  if (k != null) {
    if (k >= 7) add('critique', `Hyperkaliémie sévère (K⁺ ${fr(k, 1)})`, 'Risque d’arrêt cardiaque : ECG, gluconate de calcium IV lent, insuline + glucose, traiter la cause (obstruction, Addison, IRA).');
    else if (k >= 6) add('attention', `Hyperkaliémie (K⁺ ${fr(k, 1)})`, 'Surveiller l’ECG (bradycardie, onde T pointue). Vérifier l’absence d’hémolyse ou d’échantillon vieilli.');
    if (k <= 2.5) add('critique', `Hypokaliémie sévère (K⁺ ${fr(k, 1)})`, 'Faiblesse musculaire, ventroflexion du cou (chat), iléus. Supplémentation IV sans dépasser 0,5 mmol/kg/h.');
  }

  const glu = g('glu');
  if (glu != null) {
    const crit = fam === 'rum' && !young ? 1.5 : fam === 'rum' ? 2.5 : 3.0;
    if (glu < crit) add('critique', `Hypoglycémie (${fr(glu, 1)} mmol/L)`, 'Glucose IV (bolus de glucose dilué puis perfusion glucosée). Vérifier : tube non fluoré analysé tard = fausse hypoglycémie.');
    if (fam === 'carn' && glu >= 25) add('critique', `Hyperglycémie marquée (${fr(glu, 1)} mmol/L)`, 'Rechercher une acidocétose (cétones urinaires / BHB, gaz du sang) ou un état hyperosmolaire.');
  }

  const ca = g('ca'), cai = g('cai');
  if (fam === 'rum' && ca != null) {
    if (ca < 1.5) add('critique', `Hypocalcémie (Ca ${fr(ca, 2)} mmol/L)`, 'Fièvre de lait : calcium IV lent sous auscultation cardiaque (arrêt si arythmie), puis calcium oral/SC.');
    else if (ca < 2.0) add('attention', `Hypocalcémie modérée (Ca ${fr(ca, 2)} mmol/L)`, 'Hypocalcémie subclinique : calcium oral, prévention en péripartum.');
  }
  if (fam === 'carn') {
    if (cai != null && cai < 0.8) add('critique', `Hypocalcémie ionisée (${fr(cai, 2)} mmol/L)`, 'Tétanie/convulsions possibles : gluconate de calcium 10 % IV lent sous surveillance ECG.');
    else if (cai == null && ca != null && ca < 1.6) add('critique', `Hypocalcémie (Ca ${fr(ca, 2)} mmol/L)`, 'Confirmer par le calcium ionisé. Éclampsie, hypoparathyroïdie, éthylène glycol, pancréatite.');
    if ((ca != null && ca >= 3.5) || (cai != null && cai >= 1.6)) add('attention', 'Hypercalcémie', 'Rechercher lymphome, sac anal, Addison, hyperparathyroïdie, vitamine D (raticides, pommades). Risque néphrotoxique.');
  }
  if (fam === 'equ' && ca != null && ca < 2.0) add('attention', `Hypocalcémie (Ca ${fr(ca, 2)} mmol/L)`, 'Flutter diaphragmatique synchrone, tétanie de lactation, colite, effort prolongé.');

  const mg = g('mg');
  if (fam === 'rum' && mg != null) {
    if (mg < 0.5) add('critique', `Hypomagnésémie (${fr(mg, 2)} mmol/L)`, 'Tétanie d’herbage : magnésium SC ; calcium-magnésium IV très lent. Animal excitable, se protéger.');
    else if (mg < 0.7) add('attention', `Magnésémie basse (${fr(mg, 2)} mmol/L)`, 'Risque de tétanie : complémenter le troupeau en magnésium.');
  }

  const na = g('na');
  if (na != null) {
    if (na < (fam === 'equ' ? 120 : 125)) add('critique', `Hyponatrémie sévère (Na⁺ ${fr(na, 0)})`, 'Correction lente (≤ 10–12 mmol/L par 24 h) : risque de myélinolyse.');
    if (na > 170) add('critique', `Hypernatrémie sévère (Na⁺ ${fr(na, 0)})`, 'Correction lente (≤ 0,5 mmol/L/h). Intoxication au sel / privation d’eau ?');
  }
  if (na != null && k != null && k > 0 && fam === 'carn') {
    const r = na / k;
    if (r < 27) add(r < 20 ? 'critique' : 'attention', `Rapport Na/K = ${fr(r, 1)}`, 'Évocateur d’hypocorticisme (Addison) : cortisol basal / test ACTH. Aussi : épanchements, trichurose, IRA.');
  }

  const ht = g('ht');
  if (ht != null) {
    const crit = { carn: species === 'chat' ? 12 : 15, rum: 12, equ: 15, porc: 18, prim: 18 }[fam];
    if (ht < crit) add('critique', `Anémie sévère (Ht ${fr(ht, 0)} %)`, 'Envisager une transfusion. Rechercher une hémorragie, une hémolyse (babésiose, AHMI) ou des parasites hématophages.');
    else if (ht < crit + 6) add('attention', `Anémie marquée (Ht ${fr(ht, 0)} %)`, 'Évaluer la régénération (réticulocytes) et la tolérance clinique.');
    if ((fam === 'equ' && ht >= 60) || (fam === 'carn' && species === 'chien' && ht >= 65) || (fam === 'rum' && ht >= 50))
      add('critique', `Hémoconcentration (Ht ${fr(ht, 0)} %)`, 'Déshydratation sévère / choc : réanimation liquidienne. Diarrhée hémorragique (chien), colite / lésion étranglée (cheval).');
  }

  const plt = g('plaq');
  if (plt != null && plt < 30) add('critique', `Thrombopénie sévère (${fr(plt, 0)} × 10⁹/L)`, 'Risque hémorragique spontané. Contrôler sur frottis (agrégats). Éviter IM, AINS.');
  else if (plt != null && plt < 50 && species !== 'chat') add('attention', `Thrombopénie (${fr(plt, 0)} × 10⁹/L)`, 'Frottis ; penser babésiose, anaplasmose, PTI, CIVD, leptospirose.');

  const lact = g('lact');
  if (lact != null) {
    if (lact >= 8) add('critique', `Hyperlactatémie sévère (${fr(lact, 1)} mmol/L)`, fam === 'equ' ? 'Colique : forte suspicion de lésion étranglée, pronostic réservé. Référer en chirurgie.' : 'Hypoperfusion / choc, ischémie (SDTE). Réanimation et réévaluation à 2–6 h.');
    else if (lact >= 4) add('attention', `Hyperlactatémie (${fr(lact, 1)} mmol/L)`, fam === 'equ' ? 'Colique : lésion chirurgicale possible ; comparer avec le lactate péritonéal.' : 'Hypoperfusion : fluidothérapie, suivi de la clairance du lactate.');
  }

  const bhb = g('bhb');
  if (bhb != null && fam === 'rum') {
    if (bhb >= 3) add('critique', `BHB ${fr(bhb, 1)} mmol/L`, species === 'bovin' ? 'Cétose clinique : propylène glycol, glucose IV, rechercher une cause primaire (déplacement de caillette, métrite).' : 'Toxémie de gestation : glucose, propylène glycol, calcium ; discuter césarienne / induction.');
    else if (bhb >= (species === 'bovin' ? 1.2 : 0.8)) add('attention', `BHB ${fr(bhb, 2)} mmol/L`, 'Cétose subclinique : bilan énergétique du troupeau / lot.');
  }

  const crea = g('crea');
  if (crea != null && fam === 'carn') {
    if (crea >= 440) add('critique', `Azotémie sévère (créatinine ${fr(crea, 0)} µmol/L)`, 'IRIS stade 4 si chronique, ou IRA : évaluer le débit urinaire, la kaliémie, l’hydratation.');
    else if (crea >= 250) add('attention', `Azotémie (créatinine ${fr(crea, 0)} µmol/L)`, 'Préciser pré-rénale / rénale / post-rénale (densité urinaire, palpation vessie).');
  }

  const hco3 = g('hco3'), ph = g('ph');
  if ((hco3 != null && hco3 <= 12) || (ph != null && ph <= 7.15)) add('critique', 'Acidose métabolique sévère', 'Traiter la cause (choc, diarrhée, cétose, IRA). Bicarbonate à discuter si pH < 7,1 et ventilation correcte.');

  const tg = g('tg');
  if (fam === 'equ' && tg != null) {
    if (tg >= 5.6) add('critique', `Hyperlipémie (TG ${fr(tg, 1)} mmol/L)`, 'Poney/âne en anorexie : soutien nutritionnel immédiat (sonde, glucose), traiter la cause.');
    else if (tg >= 2) add('attention', `Hypertriglycéridémie (TG ${fr(tg, 1)} mmol/L)`, 'Hyperlipidémie : réalimenter, surveiller.');
  }

  const ck = g('ck');
  if (ck != null && ck >= 10000) add(ck >= 100000 ? 'critique' : 'attention', `CK très élevées (${Math.round(ck).toLocaleString('fr-FR')} U/L)`,
    fam === 'equ' ? 'Rhabdomyolyse : perfusion (protection rénale), pas de marche. > 100 000 : penser myopathie atypique.' : 'Atteinte musculaire importante : protéger le rein (myoglobinurie).');

  const neutro = g('neutro'), gb = g('gb');
  if (fam === 'carn' && neutro != null && neutro < 0.5) add('critique', `Neutropénie sévère (${fr(neutro, 2)} × 10⁹/L)`, 'Risque septique : parvovirose, chimiothérapie, sepsis. Antibiothérapie large spectre si fièvre.');
  if ((fam === 'equ' || fam === 'rum') && gb != null && gb < (fam === 'equ' ? 3 : 2.5)) add('attention', `Leucopénie marquée (${fr(gb, 1)} × 10⁹/L)`, fam === 'equ' ? 'Endotoxémie / colite : risque de fourbure, cryothérapie des pieds.' : 'Mammite colibacillaire / endotoxémie, BVD, salmonellose.');

  const alb = g('alb');
  if (alb != null && alb < 15) add('attention', `Hypoalbuminémie sévère (${fr(alb, 0)} g/L)`, 'Risque d’œdèmes et d’épanchements : entéropathie, néphropathie exsudative, insuffisance hépatique, parasitisme.');

  return out.sort((a, b) => (a.level === b.level ? 0 : a.level === 'critique' ? -1 : 1));
}
