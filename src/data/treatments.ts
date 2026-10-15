// Conduite à tenir et posologies usuelles des affections fréquentes, calculées pour le poids de l'animal.
// Uniquement pour les tableaux où un protocole standard existe ; sinon l'appli affiche seulement les examens à faire.
// Sources : RCP des spécialités vétérinaires (ANMV) ; Plumb's Veterinary Drug Handbook ; consensus ACVIM (MMVD 2019,
// leptospirose 2023, pancréatite 2024), ISCAID 2019 ; Constable (Radostits) et Smith pour les ruminants et les équidés.
// À faire valider par le vétérinaire. Chaque dose renvoie au RCP de la spécialité utilisée.
import { speciesById, type SpeciesId } from './species';

export type Phase = 'Stabiliser' | 'Traiter' | 'Relais' | 'Alternative' | 'Surveiller' | 'Référer';

export interface TxLine {
  phase: Phase;
  what: string;
  how: string;
  /** Dose en mg/kg (et concentration usuelle en mg/mL pour donner le volume) */
  mgkg?: number;
  conc?: number;
  /** Volume en mL/kg (solutés) */
  mlkg?: number;
  /** Dose fixe (grands animaux, par animal) */
  fixed?: string;
  /** Lignes propres à certaines espèces */
  species?: SpeciesId[];
  /** Recherche dans l'onglet Médicaments */
  q?: string;
  /** Calculateur de l'onglet Outils */
  tool?: string;
}

export interface Treatment { note?: string; lines: TxLine[] }

const methadone: TxLine = { phase: 'Stabiliser', what: 'Analgésie : méthadone', how: '0,2–0,3 mg/kg IV ou IM, toutes les 4 h. Solution à 10 mg/mL.', mgkg: 0.2, conc: 10, q: 'méthadone' };
const buprenorphine: TxLine = { phase: 'Stabiliser', what: 'Analgésie : buprénorphine', how: '0,02 mg/kg IV ou IM, toutes les 6 à 8 h. Solution à 0,3 mg/mL.', mgkg: 0.02, conc: 0.3, q: 'buprénorphine' };
const maropitant: TxLine = { phase: 'Traiter', what: 'Maropitant (anti-vomitif)', how: '1 mg/kg SC ou IV lent une fois par jour, 5 jours au plus (chat : à partir de 16 semaines). Solution à 10 mg/mL.', mgkg: 1, conc: 10, q: 'maropitant' };
const bolusChien: TxLine = { phase: 'Stabiliser', what: 'Perfusion de cristalloïdes (Ringer lactate)', how: 'Choc : bolus de 10 à 20 mL/kg en 15 min, à répéter selon la réponse (pouls, TRC, lactates).', mlkg: 10, species: ['chien'], tool: 'fluides' };
const bolusChat: TxLine = { phase: 'Stabiliser', what: 'Perfusion de cristalloïdes (Ringer lactate)', how: 'Choc : bolus de 5 à 10 mL/kg en 15 min, à répéter selon la réponse. Le chat supporte mal la surcharge.', mlkg: 5, species: ['chat'], tool: 'fluides' };
const calciumCarn: TxLine = { phase: 'Stabiliser', what: 'Gluconate de calcium 10 %', how: '0,5 à 1,5 mL/kg IV lent sur 10 à 20 min, sous auscultation ou ECG : arrêter si bradycardie ou arythmie.', mlkg: 0.5, q: 'gluconate de calcium' };
const flunixine: TxLine = { phase: 'Traiter', what: 'Flunixine méglumine', how: '1,1 mg/kg IV. Masque la douleur : réévaluer 1 h après. Solution à 50 mg/mL.', mgkg: 1.1, conc: 50, q: 'flunixine' };
const meloxicamBovin: TxLine = { phase: 'Traiter', what: 'Méloxicam', how: '0,5 mg/kg SC ou IV, une injection. Solution à 20 mg/mL.', mgkg: 0.5, conc: 20, q: 'méloxicam', species: ['bovin', 'ovin', 'caprin'] };
const antibioCritique = 'Fluoroquinolones et céphalosporines de 3e et 4e génération : antibiogramme obligatoire (antibiotiques critiques).';

export const TREATMENTS: Record<string, Treatment> = {
  // ——— Chien / chat ———
  pyometre: { note: 'Urgence chirurgicale dans la plupart des cas.', lines: [
    bolusChien, bolusChat, methadone,
    { phase: 'Traiter', what: 'Amoxicilline + acide clavulanique', how: '12,5 mg/kg deux fois par jour ; voie et dose selon le RCP de la spécialité.', mgkg: 12.5, q: 'amoxicilline clavulanique' },
    { phase: 'Traiter', what: 'Ovariohystérectomie', how: 'Traitement de choix, dès que l’animal est stabilisé.' },
    { phase: 'Alternative', what: 'Aglépristone', how: 'Col ouvert, chienne destinée à la reproduction, état général conservé : 10 mg/kg SC à J1, J2 et J8 (et J14 si besoin). Solution à 30 mg/mL.', mgkg: 10, conc: 30, species: ['chien'], q: 'aglépristone' },
  ] },
  gastro_aigue: { note: 'Le plus souvent bénin si l’état général est conservé.', lines: [
    { phase: 'Traiter', what: 'Diète 12 à 24 h, puis aliment digestible en petits repas', how: 'Eau en petites quantités, à volonté s’il ne vomit plus.' },
    maropitant,
    { phase: 'Surveiller', what: 'Pas d’antibiotique si l’état général est bon', how: 'Revoir si sang, fièvre, abattement, vomissements répétés ou au-delà de 48 h.' },
  ] },
  sdha: { note: 'La réhydratation est le traitement principal.', lines: [
    { ...bolusChien, how: 'Bolus de 10 mL/kg, puis entretien + pertes ; objectif : hématocrite sous 50 %.' },
    maropitant,
    { phase: 'Surveiller', what: 'Antibiotique seulement en cas de sepsis', how: 'Fièvre, leucopénie ou état de choc. Sans eux, il n’accélère pas la guérison.' },
  ] },
  pancreatite: { lines: [
    bolusChien, bolusChat, maropitant, buprenorphine,
    { phase: 'Traiter', what: 'Réalimentation précoce', how: 'Dès que les vomissements sont contrôlés, aliment pauvre en graisses (chien) ; sonde si anorexie de plus de 3 jours.' },
  ] },
  parvovirose: { note: 'Isolement strict, désinfection à l’eau de Javel.', lines: [
    bolusChien, bolusChat,
    { phase: 'Traiter', what: 'Perfusion d’entretien', how: 'Ajouter du potassium selon la kaliémie et du glucose en cas d’hypoglycémie.', tool: 'fluides' },
    maropitant,
    { phase: 'Traiter', what: 'Antibiotique IV si neutropénie ou fièvre', how: 'Par exemple amoxicilline–acide clavulanique : dose et voie selon le RCP.', q: 'amoxicilline' },
    { phase: 'Traiter', what: 'Alimentation entérale précoce', how: 'Dès l’arrêt des vomissements, ou par sonde naso-œsophagienne.' },
  ] },
  obstruction_uretrale: { note: 'Stabiliser la kaliémie avant l’anesthésie.', lines: [
    { ...calciumCarn, what: 'Gluconate de calcium 10 % (si K⁺ ≥ 7 ou ECG anormal)', how: '0,5 à 1,5 mL/kg IV lent sur 10 min sous ECG : protège le cœur 20 à 30 min, sans baisser la kaliémie.' },
    { phase: 'Stabiliser', what: 'Perfusion (Ringer lactate ou NaCl 0,9 %)', how: 'Le Ringer lactate convient et corrige mieux l’acidose.', tool: 'fluides' },
    buprenorphine,
    { phase: 'Traiter', what: 'Cystocentèse de décompression, puis sondage urétral sous sédation', how: 'Garder la sonde 24 à 48 h si l’urine est très sale ou le jet faible.' },
    { phase: 'Surveiller', what: 'Diurèse post-obstructive', how: 'Débit urinaire et kaliémie toutes les 4 à 6 h.' },
  ] },
  addison: { lines: [
    { phase: 'Stabiliser', what: 'NaCl 0,9 %', how: 'Bolus de 10 à 20 mL/kg, à répéter. Si Na⁺ < 130 : remonter la natrémie de 10 à 12 mmol/L par 24 h au plus.', mlkg: 10, tool: 'fluides' },
    { phase: 'Traiter', what: 'Dexaméthasone', how: '0,1 à 0,2 mg/kg IV. Ne fausse pas le dosage du cortisol : faire le test ACTH avant ou juste après. Solution à 2 mg/mL.', mgkg: 0.1, conc: 2, q: 'dexaméthasone' },
    { phase: 'Relais', what: 'Minéralocorticoïde et glucocorticoïde', how: 'DOCP ou fludrocortisone, plus prednisolone : dose ajustée sur l’ionogramme (voir RCP).' },
  ] },
  eclampsie: { lines: [
    { ...calciumCarn, how: '0,5 à 1,5 mL/kg IV lent sur 10 à 30 min, sous auscultation : arrêter si bradycardie ou arythmie.' },
    { phase: 'Relais', what: 'Calcium oral et sevrage des petits 24 h', how: 'Puis biberon de complément ou sevrage définitif si récidive.' },
    { phase: 'Surveiller', what: 'Glycémie et température', how: 'Hypoglycémie fréquente ; hyperthermie si convulsions prolongées.' },
  ] },
  avk: { note: 'Le temps de Quick s’allonge 36 à 72 h après l’ingestion.', lines: [
    { phase: 'Traiter', what: 'Ingestion de moins de 2 h, sans signe : faire vomir', how: 'Chien : apomorphine 0,1 mg/kg SC (solution à 10 mg/mL, voir RCP).', mgkg: 0.1, conc: 10, species: ['chien'], q: 'apomorphine' },
    { phase: 'Stabiliser', what: 'Plasma frais congelé si saignement actif', how: '10 à 20 mL/kg.', mlkg: 10, tool: 'transfusion' },
    { phase: 'Traiter', what: 'Vitamine K1', how: '5 mg/kg SC la première fois, puis 2,5 mg/kg par voie orale deux fois par jour avec un repas gras, pendant 4 semaines (raticides de 2e génération). Solution à 10 mg/mL.', mgkg: 5, conc: 10, q: 'vitamine k1' },
    { phase: 'Surveiller', what: 'Temps de Quick 48 h après la dernière dose', how: 'Prolonger le traitement s’il est encore allongé.' },
  ] },
  babesiose_chien: { lines: [
    { phase: 'Traiter', what: 'Imidocarbe', how: '0,25 mL pour 10 kg SC ou IM (solution à 85 mg/mL, soit 2,1 mg/kg), une injection ; atropine avant si salivation, diarrhée.', mgkg: 2.125, conc: 85, q: 'imidocarbe' },
    { phase: 'Stabiliser', what: 'Transfusion si hématocrite < 15 % ou mauvaise tolérance', how: 'Sang total compatible.', tool: 'transfusion' },
    { phase: 'Surveiller', what: 'Créatinine et hématocrite à 24–48 h', how: 'Insuffisance rénale aiguë possible.' },
  ] },
  leptospirose: { note: 'Zoonose : gants pour l’urine.', lines: [
    { phase: 'Stabiliser', what: 'Perfusion et suivi du débit urinaire', how: 'Oligurie malgré la réhydratation : pronostic réservé, dialyse à discuter.', tool: 'fluides' },
    { phase: 'Traiter', what: 'Doxycycline', how: '5 mg/kg par voie orale deux fois par jour, 14 jours. S’il vomit : amoxicilline ou ampicilline IV d’abord (voir RCP).', mgkg: 5, q: 'doxycycline' },
  ] },
  icc_chien: { lines: [
    { phase: 'Stabiliser', what: 'Oxygène, calme, manipulations réduites', how: 'Pas de radiographie tant qu’il est en détresse.' },
    { phase: 'Stabiliser', what: 'Furosémide', how: '2 mg/kg IV ou IM, à répéter toutes les 1 à 2 h jusqu’à baisse de la FR (8 mg/kg sur 4 h au plus). Solution à 50 mg/mL.', mgkg: 2, conc: 50, q: 'furosémide' },
    { phase: 'Traiter', what: 'Pimobendane', how: '0,25 mg/kg par voie orale deux fois par jour, une heure avant le repas.', mgkg: 0.25, q: 'pimobendane' },
    { phase: 'Surveiller', what: 'Fréquence respiratoire au repos à la maison', how: 'Moins de 30 à 35/min pendant le sommeil.' },
  ] },
  cmh_tea: { note: 'Pronostic réservé ; douleur intense.', lines: [
    methadone,
    { phase: 'Stabiliser', what: 'Oxygène ; furosémide si œdème pulmonaire', how: '1 à 2 mg/kg IV ou IM. Solution à 50 mg/mL.', mgkg: 1, conc: 50, q: 'furosémide' },
    { phase: 'Traiter', what: 'Clopidogrel', how: '18,75 mg par chat, par voie orale une fois par jour.', fixed: '18,75 mg par chat' },
  ] },
  sdte: { note: 'Urgence chirurgicale.', lines: [
    { ...bolusChien, how: 'Deux voies veineuses aux membres antérieurs ; bolus de 20 mL/kg en 15 min.', mlkg: 20 },
    methadone,
    { phase: 'Stabiliser', what: 'Décompression gastrique', how: 'Sonde orogastrique, ou trocardage si la sonde ne passe pas.' },
    { phase: 'Traiter', what: 'Chirurgie : détorsion et gastropexie', how: 'Dès que l’animal est stabilisé.' },
    { phase: 'Surveiller', what: 'ECG pendant 72 h, lactate', how: 'Arythmies ventriculaires fréquentes.' },
  ] },
  epilepsie: { lines: [
    { phase: 'Stabiliser', what: 'Crise de plus de 5 min ou en série : diazépam', how: '0,5 mg/kg IV, ou 1 mg/kg par voie rectale ; à répéter 2 fois au plus. Solution à 5 mg/mL.', mgkg: 0.5, conc: 5, q: 'diazépam' },
    { phase: 'Alternative', what: 'Midazolam', how: '0,2 mg/kg IM ou intranasal. Solution à 5 mg/mL.', mgkg: 0.2, conc: 5, q: 'midazolam' },
    { phase: 'Surveiller', what: 'Glycémie, calcémie, température', how: 'Traitement de fond si 2 crises ou plus en 6 mois (voir RCP).' },
  ] },
  insulinome: { lines: [
    { phase: 'Stabiliser', what: 'Glucose 50 % dilué de moitié', how: '0,5 à 1 mL/kg de glucose 50 %, dilué, IV lent ; puis perfusion glucosée à 2,5–5 %.', mlkg: 0.5 },
    { phase: 'Relais', what: 'Repas fréquents, pauvres en sucres rapides', how: 'Rechercher la cause : insulinome, sepsis, jeûne du chiot, xylitol.' },
  ] },
  coup_chaleur: { lines: [
    { phase: 'Stabiliser', what: 'Refroidir à l’eau tempérée et ventiler', how: 'Jamais d’eau glacée. Arrêter à 39,5 °C pour éviter l’hypothermie.' },
    { phase: 'Stabiliser', what: 'Oxygène, perfusion de cristalloïdes', how: 'Selon la perfusion et la pression artérielle.', tool: 'fluides' },
    { phase: 'Surveiller', what: 'Glycémie, coagulation, créatinine pendant 24 à 48 h', how: 'CIVD et insuffisance rénale peuvent apparaître plus tard.' },
  ] },
  toux_chenil: { lines: [
    { phase: 'Traiter', what: 'Repos, harnais plutôt que collier, isolement 2 à 3 semaines', how: 'Guérit seule en 1 à 3 semaines dans la plupart des cas.' },
    { phase: 'Traiter', what: 'Doxycycline seulement si fièvre, jetage purulent ou abattement', how: '5 mg/kg par voie orale deux fois par jour, 7 à 10 jours.', mgkg: 5, q: 'doxycycline' },
  ] },
  cystite: { lines: [
    { phase: 'Traiter', what: 'Chien : amoxicilline après le prélèvement', how: '11 à 15 mg/kg par voie orale deux à trois fois par jour, 3 à 5 jours (cystite simple).', mgkg: 12.5, species: ['chien'], q: 'amoxicilline' },
    { phase: 'Traiter', what: 'Chat : analgésie, eau, moins de stress', how: 'Pas d’antibiotique sans culture positive. Aliment humide, fontaine.', species: ['chat'] },
    { ...buprenorphine, phase: 'Traiter', species: ['chat'] },
  ] },
  dermatite_allergique: { lines: [
    { phase: 'Traiter', what: 'Antiparasitaire externe pour tous les animaux du foyer', how: 'Même sans puce visible ; à renouveler toute l’année.', q: 'antiparasitaire' },
    { phase: 'Traiter', what: 'Oclacitinib (chien de plus de 12 mois)', how: '0,4 à 0,6 mg/kg par voie orale deux fois par jour 14 jours, puis une fois par jour.', mgkg: 0.4, species: ['chien'], q: 'oclacitinib' },
  ] },
  otite: { lines: [
    { phase: 'Traiter', what: 'Nettoyage auriculaire puis traitement local', how: 'Choisi selon la cytologie (levures, cocci, bacilles) ; vérifier le tympan avant (voir RCP).', q: 'auriculaire' },
  ] },
  hernie_discale: { lines: [
    { phase: 'Traiter', what: 'Douleur seule : repos strict en cage 4 semaines', how: 'Sorties en laisse courte pour les besoins.' },
    { phase: 'Traiter', what: 'Méloxicam (chien)', how: '0,2 mg/kg le premier jour puis 0,1 mg/kg par voie orale une fois par jour.', mgkg: 0.1, species: ['chien'], q: 'méloxicam' },
    { phase: 'Référer', what: 'Déficit neurologique ou paralysie', how: 'Neurochirurgie ; en urgence si la sensibilité douloureuse profonde a disparu.' },
  ] },
  arthrose: { lines: [
    { phase: 'Traiter', what: 'Méloxicam', how: 'Chien : 0,1 mg/kg par voie orale une fois par jour.', mgkg: 0.1, species: ['chien'], q: 'méloxicam' },
    { phase: 'Traiter', what: 'Méloxicam', how: 'Chat : 0,05 mg/kg par voie orale une fois par jour, fonction rénale contrôlée.', mgkg: 0.05, species: ['chat'], q: 'méloxicam' },
    { phase: 'Traiter', what: 'Contrôle du poids, exercice régulier modéré', how: 'Anticorps anti-NGF mensuel en alternative aux AINS (voir RCP).' },
  ] },
  rupture_lca: { lines: [
    { phase: 'Traiter', what: 'Méloxicam et repos', how: 'Chien : 0,1 mg/kg par voie orale une fois par jour.', mgkg: 0.1, species: ['chien'], q: 'méloxicam' },
    { phase: 'Référer', what: 'Chirurgie (TPLO, TTA)', how: 'Recommandée au-delà de 15 kg.', species: ['chien'] },
  ] },
  intoxication: { note: 'Appeler le CNITV ou le CAPAE : conduite à tenir selon le toxique et la dose.', lines: [
    { phase: 'Traiter', what: 'Ingestion de moins de 2 h, animal conscient : faire vomir', how: 'Chien : apomorphine 0,1 mg/kg SC (solution à 10 mg/mL). Pas de vomissement pour un caustique ou un hydrocarbure.', mgkg: 0.1, conc: 10, species: ['chien'], q: 'apomorphine' },
    { phase: 'Traiter', what: 'Charbon activé', how: '1 à 2 g/kg par voie orale (pas pour le xylitol, l’éthylène glycol, les métaux).', mgkg: 1000 },
    { phase: 'Surveiller', what: 'Créatinine 48 à 72 h (raisin, AINS, lys chez le chat), glycémie (xylitol)', how: 'Perfusion préventive pendant 48 h pour le raisin.' },
  ] },

  // ——— Ruminants ———
  fievre_lait: { note: 'À traiter sur place.', lines: [
    { phase: 'Traiter', what: 'Calcium IV lent', how: '8 à 12 g de calcium (environ 2 g/100 kg) en 10 à 20 min, sous auscultation : arrêter si le rythme s’emballe ou devient irrégulier.', fixed: '8 à 12 g de Ca', species: ['bovin'], q: 'borogluconate' },
    { phase: 'Traiter', what: 'Calcium IV lent', how: '50 à 100 mL de borogluconate de calcium à 20–25 %, en surveillant le cœur.', fixed: '50 à 100 mL', species: ['ovin', 'caprin'], q: 'borogluconate' },
    { phase: 'Relais', what: 'Bolus oral de calcium', how: 'Au relever puis 12 h après, si la vache avale bien.', species: ['bovin'] },
    { phase: 'Surveiller', what: 'Rechute dans les 24 à 48 h', how: 'Rechercher une mammite ou une métrite associée.' },
  ] },
  cetose_bovin: { lines: [
    { phase: 'Traiter', what: 'Propylène glycol', how: '300 mL par voie orale une fois par jour, 3 à 5 jours.', fixed: '300 mL/j' },
    { phase: 'Traiter', what: 'Glucose 50 % IV lent', how: '500 mL en une fois (cétose clinique).', fixed: '500 mL' },
    { phase: 'Surveiller', what: 'Rechercher une cause primaire', how: 'Déplacement de caillette, métrite, boiterie.' },
  ] },
  toxemie_gestation: { note: 'Pronostic sombre en décubitus.', lines: [
    { phase: 'Traiter', what: 'Propylène glycol', how: '60 mL par voie orale deux fois par jour.', fixed: '60 mL × 2/j' },
    { phase: 'Traiter', what: 'Glucose 50 % IV lent', how: '60 à 100 mL.', fixed: '60 à 100 mL' },
    { phase: 'Traiter', what: 'Calcium', how: 'Hypocalcémie fréquente : 50 mL de borogluconate de calcium SC ou IV lent.', fixed: '50 mL', q: 'borogluconate' },
    { phase: 'Référer', what: 'Induction de la mise bas ou césarienne', how: 'Selon le terme, la viabilité des fœtus et l’état de la mère.' },
  ] },
  mammite_coli: { note: 'Toxinique : le pronostic dépend de la rapidité.', lines: [
    { phase: 'Stabiliser', what: 'Soluté salé hypertonique 7,2 %', how: '4 à 5 mL/kg IV en 5 min, puis 20 à 40 L d’eau à boire ou par sonde.', mlkg: 4, species: ['bovin'] },
    meloxicamBovin,
    { phase: 'Traiter', what: 'Antibiotique par voie générale', how: `Prélever le lait avant. ${antibioCritique}`, q: 'antibiotique' },
    { phase: 'Surveiller', what: 'Vidanges fréquentes du quartier', how: 'Temps d’attente lait et viande : voir chaque RCP.' },
  ] },
  mammite_clinique: { lines: [
    { phase: 'Traiter', what: 'Prélèvement de lait stérile, puis intramammaire', how: 'Le plus souvent 3 jours ; produit et durée selon le RCP et l’historique de l’élevage.', q: 'intramammaire' },
    { ...meloxicamBovin, how: 'Si quartier douloureux : 0,5 mg/kg SC. Solution à 20 mg/mL.' },
    { phase: 'Surveiller', what: 'Écarter le lait', how: 'Pendant tout le traitement et le temps d’attente du RCP.' },
  ] },
  metrite: { lines: [
    { phase: 'Traiter', what: 'Anti-inflammatoire et antibiotique par voie générale si fièvre', how: `Selon le RCP. ${antibioCritique}` },
    { phase: 'Traiter', what: 'Ne pas extraire le placenta de force', how: 'Température chaque jour pendant 10 jours.' },
  ] },
  tetanie: { note: 'Animal excitable : se protéger.', lines: [
    { phase: 'Traiter', what: 'Sulfate de magnésium 25 % SC', how: '200 à 400 mL sous la peau (bovin adulte).', fixed: '200 à 400 mL', species: ['bovin'] },
    { phase: 'Traiter', what: 'Calcium-magnésium IV très lent', how: 'Environ 400 mL, sous auscultation.', fixed: '≈ 400 mL', species: ['bovin'] },
    { phase: 'Surveiller', what: 'Complémenter le troupeau en magnésium', how: 'Oxyde de magnésium dans la ration, pierres à lécher.' },
  ] },
  meteorisation: { lines: [
    { phase: 'Traiter', what: 'Sondage œsophagien', how: 'Gaz libre : la sonde soulage. Mousse : rien ne sort.' },
    { phase: 'Traiter', what: 'Météorisation spumeuse : antimousse', how: 'Huile végétale 250 à 500 mL (bovin) ou poloxalène selon le RCP.', fixed: '250 à 500 mL', species: ['bovin'] },
    { phase: 'Stabiliser', what: 'Trocardage', how: 'Seulement si l’asphyxie est imminente.' },
  ] },
  diarrhee_neonatale: { lines: [
    { phase: 'Traiter', what: 'Veau debout qui tète : réhydratation orale', how: '2 L deux à trois fois par jour, en plus du lait (ne pas arrêter le lait).', fixed: '2 L × 2–3/j' },
    { phase: 'Stabiliser', what: 'Veau couché ou sans réflexe de succion : perfusion IV', how: 'Bicarbonate et volume selon la déshydratation et l’acidose.', tool: 'veau' },
    { phase: 'Surveiller', what: 'Antibiotique seulement si fièvre ou septicémie', how: 'Vérifier le transfert colostral (protéines totales).' },
  ] },
  bpie: { lines: [
    meloxicamBovin,
    { phase: 'Traiter', what: 'Antibiotique selon le RCP', how: `Traiter tout le lot si plus de 10 % des animaux sont atteints. ${antibioCritique}`, q: 'antibiotique' },
    { phase: 'Surveiller', what: 'Ventilation du bâtiment', how: 'Courants d’air, humidité, densité.' },
  ] },

  // ——— Équidés ———
  colique_med: { lines: [
    flunixine,
    { phase: 'Traiter', what: 'Sondage naso-gastrique', how: 'Toujours, avant tout produit par la bouche.' },
    { phase: 'Traiter', what: 'Impaction : huile de paraffine par sonde', how: '2 à 4 L pour 500 kg, avec de l’eau.', fixed: '2 à 4 L / 500 kg' },
    { phase: 'Référer', what: 'FC > 60/min, douleur réfractaire, reflux, lactate en hausse', how: 'Clinique équipée pour la chirurgie.' },
  ] },
  colique_chir: { note: 'Référer sans attendre.', lines: [
    { phase: 'Stabiliser', what: 'Décompression par sonde naso-gastrique', how: 'Avant le transport.' },
    flunixine,
    { phase: 'Stabiliser', what: 'Xylazine pour le transport', how: '0,3 à 0,5 mg/kg IV. Solution à 100 mg/mL.', mgkg: 0.3, conc: 100, q: 'xylazine' },
    { phase: 'Référer', what: 'Clinique équipée pour la chirurgie', how: 'Appeler avant de partir.' },
  ] },
  fourbure: { note: 'Phénylbutazone : interdite si le cheval n’est pas exclu de l’abattage (document SIRE).', lines: [
    { phase: 'Traiter', what: 'Phénylbutazone', how: '2,2 mg/kg IV ou par voie orale deux fois par jour (4,4 mg/kg/j au plus). Solution à 200 mg/mL.', mgkg: 2.2, conc: 200, q: 'phénylbutazone' },
    { phase: 'Traiter', what: 'Cryothérapie des pieds', how: 'Eau glacée en continu au début, surtout si endotoxémie.' },
    { phase: 'Traiter', what: 'Box sur litière profonde, soutien de la fourchette', how: 'Repos strict ; radiographies des pieds.' },
  ] },
  rhabdomyolyse: { lines: [
    { phase: 'Traiter', what: 'Repos strict : ne pas faire marcher', how: 'Couvrir, box sur place.' },
    { phase: 'Stabiliser', what: 'Perfusion si urines foncées', how: 'Protège le rein de la myoglobine.', tool: 'fluides' },
    { ...flunixine, how: '1,1 mg/kg IV, seulement chez un cheval bien hydraté. Solution à 50 mg/mL.' },
  ] },
  asthme_equin: { lines: [
    { phase: 'Traiter', what: 'Éviter les poussières', how: 'Pré, foin trempé ou à la vapeur, litière sans poussière. C’est le traitement principal.' },
    { phase: 'Traiter', what: 'Dexaméthasone', how: '0,05 à 0,1 mg/kg IV ou IM une fois par jour, quelques jours. Solution à 2 mg/mL.', mgkg: 0.05, conc: 2, q: 'dexaméthasone' },
    { phase: 'Traiter', what: 'Bronchodilatateur : clenbutérol', how: '0,8 µg/kg par voie orale deux fois par jour (voir RCP).', q: 'clenbutérol' },
  ] },
  obstruction_oeso: { lines: [
    { phase: 'Traiter', what: 'Sédation : xylazine, tête basse', how: '0,3 à 0,5 mg/kg IV. Solution à 100 mg/mL.', mgkg: 0.3, conc: 100, q: 'xylazine' },
    { phase: 'Traiter', what: 'Sonde naso-gastrique et lavages doux', how: 'Petits volumes d’eau tiède.' },
    { phase: 'Surveiller', what: 'Pas d’aliment 24 h, puis aliment trempé', how: 'Pneumonie par fausse déglutition : température 5 jours.' },
  ] },
  abces_pied: { lines: [
    { phase: 'Traiter', what: 'Parage pour drainer, bains et pansement', how: 'Cataplasme 2 à 3 jours, puis pansement propre.' },
    { phase: 'Traiter', what: 'Vaccination antitétanique', how: 'Rappel si plus d’un an ; sérum si non vacciné.' },
    { phase: 'Traiter', what: 'Phénylbutazone si douleur', how: '2,2 mg/kg deux fois par jour, 2 à 3 jours (cheval exclu de l’abattage).', mgkg: 2.2, conc: 200, q: 'phénylbutazone' },
  ] },
};

/** Lignes du protocole qui concernent l'espèce (la faune utilise son espèce de référence) */
export function treatmentFor(diseaseId: string, species: SpeciesId): Treatment | undefined {
  const t = TREATMENTS[diseaseId];
  if (!t) return undefined;
  const base = speciesById(species).proxy ?? species;
  const lines = t.lines.filter((l) => !l.species || l.species.includes(base));
  return lines.length ? { ...t, lines } : undefined;
}

const num = (n: number, d = 1) => n.toLocaleString('fr-FR', { maximumFractionDigits: n < 1 ? 2 : d });

/** Quantité à administrer pour ce poids : « 280 mg = 9,3 mL », « 420 mL », ou la dose fixe */
export function lineDose(l: TxLine, weight?: number): string | undefined {
  if (l.fixed) return l.fixed;
  if (!weight || !(weight > 0)) return undefined;
  if (l.mlkg) return `${num(l.mlkg * weight, 0)} mL`;
  if (l.mgkg) {
    const mg = l.mgkg * weight;
    const amount = mg >= 1000 ? `${num(mg / 1000, 1)} g` : `${num(mg, mg < 10 ? 1 : 0)} mg`;
    return l.conc ? `${amount} = ${num(mg / l.conc, 1)} mL` : amount;
  }
  return undefined;
}

/** Une ligne a besoin du poids pour afficher sa quantité */
export const needsWeight = (l: TxLine) => !l.fixed && !!(l.mgkg || l.mlkg);
