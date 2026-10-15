// Parcours de saisie d'un cas en questions successives, dans l'ordre utile au diagnostic :
// motif, cas collectif, âge, sexe et stade, température, signes, questions ciblées, examen, race, poids, analyses.
// Chaque réponse ajoute des éléments (identifiants de signes) au diagnostic différentiel.
import { speciesById, type SpeciesId } from './species';
import { vitalsFor } from './vitals';
import { breedsFor } from './breeds';

export interface Option {
  id: string;
  label: string;
  detail?: string;
  /** Éléments ajoutés au diagnostic quand cette réponse est choisie */
  signs?: string[];
  /** Valeur normale (cadre vert) ou anormale (pastille rouge) */
  normal?: boolean;
  abnormal?: boolean;
}

export type StepKind = 'motifs' | 'choice' | 'measure' | 'signs' | 'question' | 'breed' | 'weight' | 'labs';

export interface Step {
  id: string;
  kind: StepKind;
  /** Nom court (barre du haut, récapitulatif) */
  name: string;
  title: string;
  sub?: string;
  /** Valeurs usuelles affichées en encadré */
  norms?: string;
  options?: Option[];
  /** Mesure chiffrée associée (champ du cas) */
  measure?: 'temp' | 'hr' | 'rr';
  unit?: string;
  /** Question ciblée : signe recherché et hypothèses qu'il soutiendrait */
  sign?: string;
  supports?: string[];
}

export interface Motif { id: string; label: string; detail?: string; signs?: string[]; sugg: string[] }

export type Family = 'carn' | 'rum' | 'equ' | 'porc';

export function family(species: SpeciesId): Family {
  const base = speciesById(species).proxy ?? species;
  if (base === 'bovin' || base === 'ovin' || base === 'caprin') return 'rum';
  if (base === 'cheval') return 'equ';
  if (base === 'porc') return 'porc';
  return 'carn';
}

const BILAN: Motif = { id: 'bilan', label: 'Bilan sanguin', sugg: [] };

export const MOTIFS: Record<Family, Motif[]> = {
  carn: [
    { id: 'dig', label: 'Vomissements, diarrhée', sugg: ['vomissements', 'diarrhee', 'diarrhee_hemorragique', 'vomissements_improductifs', 'regurgitation', 'douleur_abdo', 'distension_abdo', 'anorexie', 'abattement', 'ecart_alimentaire', 'corps_etranger_ingere', 'vers_selles', 'toxique', 'ptyalisme'] },
    { id: 'pupd', label: 'Polyuro-polydipsie', signs: ['pupd'], sugg: ['polyphagie', 'amaigrissement', 'prise_poids', 'ecoulement_vulvaire', 'vomissements', 'distension_abdo', 'alopecie', 'abattement', 'anorexie'] },
    { id: 'abat', label: 'Abattement, anorexie', signs: ['abattement', 'anorexie'], sugg: ['vomissements', 'ictere', 'urines_foncees', 'tiques', 'amaigrissement', 'pupd', 'ecoulement_vulvaire', 'adenomegalie', 'hemorragies', 'non_vaccine', 'toxique'] },
    { id: 'resp', label: 'Toux, dyspnée', sugg: ['toux', 'dyspnee', 'jetage', 'eternuements', 'souffle', 'intolerance_effort', 'syncope', 'collectivite', 'non_vaccine', 'conjonctivite'] },
    { id: 'uri', label: 'Troubles urinaires', sugg: ['dysurie', 'anurie', 'hematurie', 'vomissements', 'abattement', 'douleur_abdo', 'pupd'] },
    { id: 'neuro', label: 'Convulsions, neuro', sugg: ['convulsions', 'tremblements', 'ataxie', 'paresie', 'tete_penchee', 'douleur_rachis', 'comportement', 'ptyalisme', 'cecite', 'toxique'] },
    { id: 'loco', label: 'Boiterie, douleur', sugg: ['boiterie', 'boiterie_aigue_1', 'raideur_lever', 'douleur_rachis', 'paresie', 'traumatisme', 'arthrite', 'tiques'] },
    { id: 'peau', label: 'Peau, prurit, oreilles', signs: [], sugg: ['prurit', 'puces', 'otite', 'alopecie', 'lesions_cutanees', 'nodules_cutanes', 'conjonctivite', 'contact_sanglier'] },
    { id: 'repro', label: 'Mise bas, mamelles', sugg: ['ecoulement_vulvaire', 'mammite', 'tremblements', 'convulsions', 'avortement', 'abattement'] },
    { id: 'urg', label: 'Urgence : trauma, intox, chaleur', sugg: ['traumatisme', 'toxique', 'chaleur_ambiante', 'syncope', 'dyspnee', 'hemorragies', 'convulsions', 'tremblements', 'ptyalisme', 'distension_abdo', 'vomissements_improductifs'] },
    BILAN,
  ],
  rum: [
    { id: 'couche', label: 'Décubitus', signs: ['decubitus'], sugg: ['tremblements', 'mammite', 'arret_rumination', 'deshydratation', 'diarrhee', 'paresie', 'ataxie', 'meteorisation'] },
    { id: 'lait', label: 'Baisse de lait, appétit', signs: ['chute_lait', 'anorexie'], sugg: ['haleine_cetonique', 'ping_gauche', 'ping_droit', 'arret_rumination', 'mammite', 'douleur_garrot', 'amaigrissement', 'constipation', 'diarrhee'] },
    { id: 'mam', label: 'Mammite', signs: ['mammite'], sugg: ['abattement', 'decubitus', 'deshydratation', 'chute_lait', 'diarrhee', 'mammite_induree'] },
    { id: 'post', label: 'Post-partum', signs: ['mise_bas_recente'], sugg: ['retention_placentaire', 'ecoulement_vulvaire', 'decubitus', 'mammite', 'anorexie', 'chute_lait'] },
    { id: 'resp', label: 'Toux, dyspnée', sugg: ['toux', 'dyspnee', 'jetage', 'conjonctivite', 'abattement', 'anorexie'] },
    { id: 'dig', label: 'Digestif, rumination', sugg: ['diarrhee', 'diarrhee_hemorragique', 'diarrhee_chronique', 'meteorisation', 'arret_rumination', 'distension_abdo', 'douleur_abdo', 'changement_aliment', 'douleur_garrot', 'constipation', 'amaigrissement', 'paturage_humide'] },
    { id: 'neuro', label: 'Neuro, convulsions', sugg: ['convulsions', 'tremblements', 'ataxie', 'cecite', 'pousser_mur', 'tete_penchee', 'paralysie_faciale', 'opisthotonos', 'hyperesthesie', 'comportement', 'ptyalisme', 'ensilage', 'paturage', 'toxique'] },
    { id: 'loco', label: 'Boiterie', sugg: ['boiterie', 'lesions_podales', 'arthrite', 'pouls_digites', 'raideur', 'plaie_recente'] },
    { id: 'peau', label: 'Peau, bouche, yeux', sugg: ['lesions_buccales', 'ptyalisme', 'nodules_cutanes', 'lesions_cutanees', 'oedeme_face', 'conjonctivite', 'prurit', 'croutes_levres'] },
    { id: 'maigre', label: 'Amaigrissement, anémie', sugg: ['amaigrissement', 'muqueuses_pales', 'oedeme', 'diarrhee', 'diarrhee_chronique', 'paturage', 'paturage_humide', 'adenomegalie'] },
    { id: 'avort', label: 'Avortement', signs: ['avortement'], sugg: ['retention_placentaire', 'arthrite'] },
    { id: 'mort', label: 'Mort subite', signs: ['mort_subite'], sugg: ['hemorragies', 'meteorisation', 'changement_aliment', 'paturage', 'toxique', 'convulsions'] },
    BILAN,
  ],
  equ: [
    { id: 'colique', label: 'Colique', signs: ['douleur_abdo'], sugg: ['colique_severe', 'reflux_gastrique', 'distension_abdo', 'constipation', 'sueurs', 'changement_aliment', 'diarrhee'] },
    { id: 'loco', label: 'Boiterie, fourbure', sugg: ['boiterie', 'boiterie_aigue_1', 'pouls_digites', 'lesions_podales', 'raideur_lever', 'prise_poids', 'paturage', 'plaie_recente'] },
    { id: 'muscle', label: 'Myopathie, urines foncées', sugg: ['myalgie', 'urines_foncees', 'sueurs', 'effort_recent', 'raideur', 'decubitus', 'paturage', 'plaie_recente'] },
    { id: 'resp', label: 'Toux, jetage', sugg: ['toux', 'jetage', 'dyspnee', 'adenomegalie', 'aliment_naseaux', 'intolerance_effort', 'non_vaccine'] },
    { id: 'abat', label: 'Abattement, fièvre', signs: ['abattement', 'anorexie'], sugg: ['ictere', 'oedeme', 'urines_foncees', 'tiques', 'amaigrissement', 'diarrhee'] },
    { id: 'dig', label: 'Diarrhée, amaigrissement', sugg: ['diarrhee', 'amaigrissement', 'anorexie', 'abattement', 'poil_long', 'pupd'] },
    { id: 'neuro', label: 'Neuro', sugg: ['ataxie', 'tremblements', 'paresie', 'comportement', 'pousser_mur', 'cecite', 'raideur', 'convulsions', 'decubitus'] },
    { id: 'peau', label: 'Peau, poil', sugg: ['lesions_cutanees', 'nodules_cutanes', 'prurit', 'poil_long', 'alopecie', 'conjonctivite'] },
    { id: 'repro', label: 'Poulinage, avortement', sugg: ['avortement', 'ecoulement_vulvaire', 'retention_placentaire', 'mise_bas_recente'] },
    BILAN,
  ],
  porc: [
    { id: 'dig', label: 'Diarrhée, vomissements', sugg: ['diarrhee', 'diarrhee_hemorragique', 'vomissements', 'retard_croissance', 'changement_aliment', 'anorexie'] },
    { id: 'resp', label: 'Toux, dyspnée', sugg: ['toux', 'dyspnee', 'jetage', 'eternuements'] },
    { id: 'neuro', label: 'Neuro', sugg: ['convulsions', 'ataxie', 'tremblements', 'opisthotonos', 'oedeme'] },
    { id: 'abat', label: 'Abattement, fièvre', signs: ['abattement'], sugg: ['anorexie', 'cyanose', 'hemorragies', 'lesions_cutanees', 'boiterie'] },
    { id: 'peau', label: 'Peau, boiterie', sugg: ['lesions_cutanees', 'boiterie', 'arthrite', 'prurit'] },
    { id: 'repro', label: 'Avortement, mise bas', sugg: ['avortement', 'mise_bas_recente', 'mammite'] },
    { id: 'mort', label: 'Mort subite', signs: ['mort_subite'], sugg: ['hemorragies', 'cyanose', 'muqueuses_pales'] },
    BILAN,
  ],
};

export const motifsFor = (species: SpeciesId): Motif[] => MOTIFS[family(species)];
export const motifById = (species: SpeciesId, id?: string): Motif | undefined => motifsFor(species).find((m) => m.id === id);

/** Motifs choisis (plusieurs possibles ; les cas enregistrés avant n'en ont qu'un, dans « motif ») */
export const motifsOf = (c: { motif?: string; motifs?: string[] }): string[] => c.motifs ?? (c.motif ? [c.motif] : []);

/** Motifs choisis, dans l'ordre de la liste de l'espèce */
export function selectedMotifs(c: { species: SpeciesId; motif?: string; motifs?: string[] }): Motif[] {
  const ids = new Set(motifsOf(c));
  return motifsFor(c.species).filter((m) => ids.has(m.id));
}

/** Signes proposés à l'étape des signes : ceux des motifs choisis, sans doublon */
export function motifSuggestions(c: { species: SpeciesId; motif?: string; motifs?: string[] }): { preset: string[]; sugg: string[] } {
  const ms = selectedMotifs(c);
  const preset = [...new Set(ms.flatMap((m) => m.signs ?? []))];
  const sugg = [...new Set(ms.flatMap((m) => m.sugg))].filter((x) => !preset.includes(x));
  return { preset, sugg };
}

// ——— Signalement ———

const AGE_NAMES: Partial<Record<SpeciesId, [string, string]>> = {
  chien: ['Chiot', 'Adulte'], chat: ['Chaton', 'Adulte'], bovin: ['Veau', 'Adulte ou jeune bovin'], ovin: ['Agneau', 'Adulte ou antenais'],
  caprin: ['Chevreau', 'Adulte ou chevrette'], cheval: ['Poulain', 'Adulte'], porc: ['Porcelet', 'Porc à l’engrais ou adulte'],
};

function ageOptions(species: SpeciesId): Option[] {
  const v = vitalsFor(species);
  const [young, adult] = AGE_NAMES[species] ?? ['Jeune', 'Adulte'];
  const youngM = v?.young ?? 6;
  const out: Option[] = [{ id: 'jeune', label: young, detail: `moins de ${youngM} mois`, signs: ['jeune'] }];
  if (v?.senior) {
    out.push({ id: 'adulte', label: adult, detail: `${youngM} mois à ${v.senior} ans` }, { id: 'age', label: 'Âgé', detail: `${v.senior} ans et plus`, signs: ['age'] });
  } else if (family(species) === 'carn' || !v) {
    out.push({ id: 'adulte', label: adult }, { id: 'age', label: 'Âgé', signs: ['age'] });
  } else {
    out.push({ id: 'adulte', label: adult, detail: `${youngM} mois et plus` });
  }
  return out;
}

function sexOptions(species: SpeciesId): Option[] {
  if (family(species) === 'carn' && species !== 'macaque') {
    return [
      { id: 'fe', label: 'Femelle entière' }, { id: 'fs', label: 'Femelle stérilisée' },
      { id: 'me', label: 'Mâle entier', signs: ['male'] }, { id: 'mc', label: 'Mâle castré', signs: ['male'] },
    ];
  }
  return [{ id: 'f', label: 'Femelle' }, { id: 'm', label: species === 'cheval' ? 'Mâle (hongre ou entier)' : 'Mâle', signs: ['male'] }];
}

/** Libellé enregistré dans le cas (PDF, historique) */
export const SEX_LABEL: Record<string, string> = { fe: 'Femelle', fs: 'Femelle stérilisée', me: 'Mâle', mc: 'Mâle castré', f: 'Femelle', m: 'Mâle' };

/** Stade reproducteur d'une femelle adulte : décisif pour pyomètre, éclampsie, fièvre de lait, cétose, toxémie de gestation… */
function stageOptions(species: SpeciesId, sex?: string): Option[] {
  const f = family(species);
  if (f === 'carn') {
    if (sex !== 'fe') return [];
    return [
      { id: 'chaleurs', label: 'Chaleurs il y a moins de 2 mois', signs: ['femelle_entiere'] },
      { id: 'misebas', label: 'A mis bas, allaite', detail: 'moins de 6 semaines', signs: ['mise_bas_recente'] },
      { id: 'gestante', label: 'Gestante', signs: ['gestation_avancee'] },
      { id: 'rien', label: 'Rien de récent', detail: 'ou ne sait pas' },
    ];
  }
  if (sex !== 'f') return [];
  const out: Option[] = [{ id: 'misebas', label: 'Mise bas il y a moins de 2 semaines', signs: f === 'rum' ? ['mise_bas_recente', 'debut_lactation'] : ['mise_bas_recente'] }];
  if (f === 'rum') out.push({ id: 'lactation', label: 'Début de lactation', detail: '2 semaines à 2 mois', signs: ['debut_lactation'] });
  out.push({ id: 'gestante', label: 'Fin de gestation', signs: ['gestation_avancee'] }, { id: 'autre', label: 'Autre stade', detail: 'tarie, vide, milieu de lactation…' });
  return out;
}

const fr = (n: number) => String(n).replace('.', ',');

/** Plages de température, FC ou FR : basse, normale, élevée, très élevée */
function bandOptions(kind: 'temp' | 'hr' | 'rr', species: SpeciesId): Option[] {
  const v = vitalsFor(species);
  if (!v) return [];
  const [lo, hi] = v[kind];
  if (kind === 'temp') {
    const top = Math.round((hi + 1) * 10) / 10;
    return [
      { id: 'bas', label: 'Hypothermie', detail: `< ${fr(lo)} °C`, signs: ['hypothermie'], abnormal: true },
      { id: 'normal', label: 'Normale', detail: `${fr(lo)} – ${fr(hi)} °C`, normal: true },
      { id: 'haut', label: 'Fièvre', detail: `${fr(hi)} – ${fr(top)} °C`, signs: ['fievre'], abnormal: true },
      { id: 'tres_haut', label: 'Forte fièvre', detail: `> ${fr(top)} °C`, signs: ['fievre'], abnormal: true },
    ];
  }
  if (kind === 'hr') {
    const top = Math.round(hi * 1.25);
    return [
      { id: 'bas', label: 'Bradycardie', detail: `< ${lo}/min`, signs: ['bradycardie'], abnormal: true },
      { id: 'normal', label: 'Normale', detail: `${lo} – ${hi}/min`, normal: true },
      { id: 'haut', label: 'Tachycardie', detail: `${hi} – ${top}/min`, signs: ['tachycardie'], abnormal: true },
      { id: 'tres_haut', label: 'Tachycardie marquée', detail: `> ${top}/min`, signs: ['tachycardie'], abnormal: true },
    ];
  }
  const top = Math.round(hi * 1.5);
  return [
    { id: 'normal', label: 'Normale', detail: `${lo} – ${hi}/min`, normal: true },
    { id: 'haut', label: 'Rapide', detail: `${hi} – ${top}/min`, signs: ['dyspnee'], abnormal: true },
    { id: 'tres_haut', label: 'Très rapide ou difficile', detail: `> ${top}/min, bouche ouverte, discordance`, signs: ['dyspnee'], abnormal: true },
  ];
}

const MUCOUS: Option[] = [
  { id: 'roses', label: 'Roses', detail: 'TRC < 2 s', normal: true },
  { id: 'pales', label: 'Pâles', detail: 'ou blanches', signs: ['muqueuses_pales'], abnormal: true },
  { id: 'jaunes', label: 'Jaunes', detail: 'ictère', signs: ['ictere'], abnormal: true },
  { id: 'congestives', label: 'Congestives', detail: 'rouges, TRC allongé', signs: ['muqueuses_congestives'], abnormal: true },
  { id: 'cyanose', label: 'Cyanosées', detail: 'bleues', signs: ['cyanose'], abnormal: true },
];

const HYDRATION: Option[] = [
  { id: 'normale', label: 'Normale', detail: 'moins de 5 %', normal: true },
  { id: 'moderee', label: 'Déshydratation légère à modérée', detail: '5 à 8 % : pli de peau lent, muqueuses collantes', signs: ['deshydratation'], abnormal: true },
  { id: 'severe', label: 'Déshydratation sévère', detail: 'plus de 8 % : œil enfoncé, pli persistant, extrémités froides', signs: ['deshydratation'], abnormal: true },
];

const HERD: Option[] = [
  { id: 'seul', label: 'Un seul animal' },
  { id: 'plusieurs', label: 'Plusieurs animaux malades', signs: ['plusieurs_animaux'] },
  { id: 'morts', label: 'Plusieurs malades, morts subites', signs: ['plusieurs_animaux', 'mort_subite'] },
];

const QUESTION_TEXT: Record<string, string> = {
  ecoulement_vulvaire: 'Écoulement vulvaire ?', pupd: 'Boit et urine plus que d’habitude ?', polyphagie: 'Mange plus que d’habitude ?',
  douleur_abdo: 'Douleur à la palpation abdominale ?', diarrhee_hemorragique: 'Du sang dans les selles ?', anurie: 'N’urine plus, vessie dure et distendue ?',
  vomissements_improductifs: 'Efforts de vomissement sans rien rendre ?', distension_abdo: 'Ventre distendu ?', corps_etranger_ingere: 'A pu avaler un objet ?',
  ecart_alimentaire: 'Écart alimentaire récent (poubelles, restes) ?', non_vaccine: 'Vaccins pas à jour ?', urines_foncees: 'Urines foncées (rouges, marron) ?',
  tiques: 'Tiques, ou promenade en forêt récente ?', souffle: 'Souffle à l’auscultation ?', collectivite: 'Pension, chenil ou exposition récents ?',
  amaigrissement: 'A maigri ?', alopecie: 'Perte de poils symétrique ?', ictere: 'Muqueuses ou sclères jaunes ?', mise_bas_recente: 'Mise bas il y a moins de 2 semaines ?',
  debut_lactation: 'En début de lactation (moins de 2 mois) ?', haleine_cetonique: 'Odeur d’acétone (haleine, lait) ?', ping_gauche: 'Ping à gauche à la percussion-auscultation ?',
  ping_droit: 'Ping à droite ?', mammite: 'Lait anormal ou quartier enflammé ?', retention_placentaire: 'Non délivrée ?', douleur_garrot: 'Épreuve du garrot positive ?',
  arret_rumination: 'Ne rumine plus ?', plusieurs_animaux: 'D’autres animaux atteints ?', changement_aliment: 'Changement de ration ou excès de concentrés ?',
  decubitus: 'Couché(e), ne se relève pas ?', chute_lait: 'Baisse de lait ?', toxique: 'Accès possible à un toxique ?', grand_chien: 'Grande race à thorax profond ?',
  femelle_entiere: 'Femelle non stérilisée, chaleurs il y a moins de 2 mois ?', male: 'Est-ce un mâle ?', contact_sanglier: 'Contact avec un sanglier (chasse, abats crus) ?',
  paturage: 'Au pâturage (herbe jeune, printemps) ?', paturage_humide: 'Pâtures humides, zones à limnées ?', puces: 'Des puces ou des déjections de puces ?',
  chaleur_ambiante: 'Exposé à la chaleur (soleil, voiture, effort) ?', traumatisme: 'Chute ou accident récent ?', effort_recent: 'Effort intense ou reprise du travail récente ?',
  colique_severe: 'Douleur violente, qui ne cède pas aux antalgiques ?', reflux_gastrique: 'Reflux au sondage naso-gastrique ?', pouls_digites: 'Pouls digités frappants ?',
  abattement: 'Abattu, léthargique ?', anorexie: 'Mange moins, ou plus du tout ?', vomissements: 'Vomit ?', diarrhee: 'Diarrhée ?',
  toux: 'Tousse ?', dyspnee: 'Respire mal ou vite ?', jetage: 'Jetage nasal ?', boiterie: 'Boite ?', convulsions: 'Convulsions ?', tremblements: 'Tremblements ?',
  muqueuses_pales: 'Muqueuses pâles ?', deshydratation: 'Déshydraté ?', fievre: 'Fièvre ?', prurit: 'Se gratte ?', adenomegalie: 'Gros nœuds lymphatiques ?',
  plaie_recente: 'Plaie, castration ou mise bas récente ?', ensilage: 'Nourri à l’ensilage ?', jeune: 'Est-ce un jeune ?', age: 'Animal âgé ?',
};

/** Question posée pour un signe : texte dédié, sinon le libellé du signe */
export const questionText = (sign: string, label: string) => QUESTION_TEXT[sign] ?? `${label} ?`;

// ——— Parcours ———

export interface WizardCase {
  species: SpeciesId;
  motif?: string;
  motifs?: string[];
  answers?: Record<string, string>;
  questions?: { id: string; label: string; supports: string[] }[];
}

export function buildSteps(c: WizardCase): Step[] {
  const sp = speciesById(c.species);
  const f = family(c.species);
  const a = c.answers ?? {};
  const v = vitalsFor(c.species);
  const steps: Step[] = [];
  steps.push({ id: 'motif', kind: 'motifs', name: 'Motif', title: 'Motifs de consultation', sub: 'Plusieurs choix possibles, puis Suivant.',
    options: motifsFor(c.species).map((m) => ({ id: m.id, label: m.label, detail: m.detail })) });
  const bilan = motifsOf(c).includes('bilan');
  if (bilan) steps.push({ id: 'labs', kind: 'labs', name: 'Analyses', title: 'Valeurs d’analyses' });
  if (f !== 'carn' || sp.group === 'faune') steps.push({ id: 'herd', kind: 'choice', name: 'Effectif', title: 'Un ou plusieurs animaux ?', options: HERD });
  steps.push({ id: 'age', kind: 'choice', name: 'Âge', title: 'Âge', norms: v?.senior ? `Considéré comme âgé à partir de ${v.senior} ans.` : undefined, options: ageOptions(c.species) });
  steps.push({ id: 'sex', kind: 'choice', name: 'Sexe', title: 'Sexe', options: sexOptions(c.species) });
  const stage = a.age === 'jeune' ? [] : stageOptions(c.species, a.sex);
  if (stage.length) {
    steps.push({ id: 'stage', kind: 'choice', name: 'Stade', title: f === 'carn' ? 'Chaleurs, gestation ou mise bas ?' : 'Stade', options: stage,
      norms: f === 'carn' ? 'Pyomètre : surtout 4 à 8 semaines après les chaleurs. Éclampsie : dans les 4 semaines qui suivent la mise bas.' : undefined });
  }
  steps.push({ id: 'temp', kind: 'measure', measure: 'temp', unit: '°C', name: 'Température', title: 'Température rectale',
    norms: v ? `Normale chez l’adulte au repos : ${fr(v.temp[0])} – ${fr(v.temp[1])} °C.` : 'Pas de valeur de référence intégrée pour cette espèce.', options: bandOptions('temp', c.species) });
  steps.push({ id: 'signs', kind: 'signs', name: 'Signes', title: 'Autres signes ?', sub: 'Touchez tout ce qui s’applique, puis Suivant.' });
  for (const q of c.questions ?? []) {
    steps.push({ id: `q:${q.id}`, kind: 'question', name: 'Question ciblée', title: questionText(q.id, q.label), sign: q.id, supports: q.supports });
  }
  steps.push({ id: 'hr', kind: 'measure', measure: 'hr', unit: '/min', name: 'FC', title: 'Fréquence cardiaque',
    norms: v ? `Au repos : ${v.hr[0]} – ${v.hr[1]} battements/min.` : undefined, options: bandOptions('hr', c.species) });
  steps.push({ id: 'rr', kind: 'measure', measure: 'rr', unit: '/min', name: 'FR', title: 'Fréquence respiratoire', sub: 'Au repos, hors halètement.',
    norms: v ? `Au repos : ${v.rr[0]} – ${v.rr[1]} mouvements/min.${f === 'carn' ? ' Au-delà de 40 au repos chez un cardiaque : œdème pulmonaire probable.' : ''}` : undefined,
    options: bandOptions('rr', c.species) });
  steps.push({ id: 'muq', kind: 'choice', name: 'Muqueuses', title: 'Muqueuses', norms: 'Normales : roses, temps de recoloration capillaire inférieur à 2 secondes.', options: MUCOUS });
  steps.push({ id: 'hyd', kind: 'choice', name: 'Hydratation', title: 'Hydratation', norms: 'Pli de peau qui s’efface aussitôt, œil non enfoncé, muqueuses humides.', options: HYDRATION });
  if (breedsFor(c.species).length) steps.push({ id: 'breed', kind: 'breed', name: 'Race', title: 'Race', sub: 'Prédispositions, gabarit.' });
  steps.push({ id: 'weight', kind: 'weight', name: 'Poids', title: 'Poids', sub: 'Indispensable pour calculer les doses.' });
  if (!bilan) steps.push({ id: 'labs', kind: 'labs', name: 'Analyses', title: 'Des analyses ?' });
  return steps;
}

/** Éléments apportés par les réponses du parcours (hors signes cochés) */
export function answerSigns(c: WizardCase): { present: string[]; absent: string[] } {
  const a = c.answers ?? {};
  const present = new Set<string>(motifSuggestions(c).preset);
  const absent = new Set<string>();
  for (const s of buildSteps(c)) {
    const ans = a[s.id];
    if (!ans) continue;
    if (s.kind === 'question' && s.sign) {
      if (ans === 'oui') present.add(s.sign);
      else if (ans === 'non') absent.add(s.sign);
      continue;
    }
    s.options?.find((o) => o.id === ans)?.signs?.forEach((x) => present.add(x));
  }
  return { present: [...present], absent: [...absent] };
}

/** Libellé court d'une réponse, pour le récapitulatif */
export function answerLabel(step: Step, answer?: string): string | undefined {
  if (!answer) return undefined;
  if (step.kind === 'question') return answer === 'oui' ? step.title.replace(/\s*\?$/, '') : undefined;
  const o = step.options?.find((x) => x.id === answer);
  if (!o) return undefined;
  if (step.kind === 'measure' && o.normal) return `${step.name} normale`;
  return o.label;
}
