// Signes cliniques, éléments de contexte et anomalies biologiques utilisés par le diagnostic différentiel.
import type { SpeciesId } from './species';

export type SignGroup =
  | 'general' | 'digestif' | 'respiratoire' | 'cardio' | 'urinaire' | 'neuro'
  | 'locomoteur' | 'repro' | 'peau' | 'contexte' | 'bio';

export interface Sign {
  id: string;
  label: string;
  group: SignGroup;
  /** Restreint l'affichage à certaines espèces (familles ddx). Absent = toutes. */
  species?: SpeciesId[];
  /** Mots-clés supplémentaires pour la recherche et la dictée vocale */
  kw?: string[];
}

const RUM: SpeciesId[] = ['bovin', 'ovin', 'caprin'];
const CARN: SpeciesId[] = ['chien', 'chat'];
const FEM_REPRO: SpeciesId[] = ['chien', 'chat', 'bovin', 'ovin', 'caprin', 'cheval', 'porc'];

export const SIGN_GROUPS: Record<SignGroup, string> = {
  general: 'Général', digestif: 'Digestif', respiratoire: 'Respiratoire', cardio: 'Cardio-vasculaire',
  urinaire: 'Urinaire', neuro: 'Neurologique', locomoteur: 'Locomoteur', repro: 'Reproduction / mamelle',
  peau: 'Peau, yeux, bouche', contexte: 'Contexte', bio: 'Biologie (automatique)',
};

export const SIGNS: Sign[] = [
  // Général
  { id: 'fievre', label: 'Fièvre / hyperthermie', group: 'general', kw: ['température', 'hyperthermie', 'chaud'] },
  { id: 'hypothermie', label: 'Hypothermie', group: 'general', kw: ['froid', 'froide', 'froides', 'extrémités froides', 'oreilles froides', 'température basse'] },
  { id: 'abattement', label: 'Abattement / léthargie', group: 'general', kw: ['apathie', 'faiblesse', 'léthargie', 'prostration'] },
  { id: 'anorexie', label: 'Anorexie / dysorexie', group: 'general', kw: ['ne mange pas', 'appétit', 'inappétence'] },
  { id: 'polyphagie', label: 'Polyphagie', group: 'general', kw: ['mange beaucoup', 'faim'] },
  { id: 'amaigrissement', label: 'Amaigrissement', group: 'general', kw: ['perte de poids', 'maigre', 'cachexie'] },
  { id: 'prise_poids', label: 'Prise de poids / obésité', group: 'general', kw: ['obèse', 'surpoids'] },
  { id: 'deshydratation', label: 'Déshydratation', group: 'general', kw: ['pli de peau', 'enophtalmie', 'sec'] },
  { id: 'pupd', label: 'Polyuro-polydipsie', group: 'general', kw: ['boit beaucoup', 'urine beaucoup', 'pupd', 'polydipsie', 'polyurie'] },
  { id: 'muqueuses_pales', label: 'Muqueuses pâles', group: 'general', kw: ['pâleur', 'anémie', 'blanc'] },
  { id: 'ictere', label: 'Ictère', group: 'general', kw: ['jaune', 'jaunisse', 'subictère'] },
  { id: 'muqueuses_congestives', label: 'Muqueuses congestives / TRC allongé', group: 'general', kw: ['choc', 'congestion', 'trc', 'muqueuses rouges', 'muqueuses violacées'] },
  { id: 'cyanose', label: 'Cyanose', group: 'general', kw: ['bleu'] },
  { id: 'hemorragies', label: 'Saignements / pétéchies', group: 'general', kw: ['hémorragie', 'saigne', 'pétéchies', 'ecchymoses', 'épistaxis'] },
  { id: 'adenomegalie', label: 'Adénomégalie', group: 'general', kw: ['ganglions', 'nœuds lymphatiques', 'abcès ganglionnaire'] },
  { id: 'oedeme', label: 'Œdèmes (déclives, sous-glossien…)', group: 'general', kw: ['œdème', 'oedème', 'gonflement', 'sous-glossien', 'bouteille'] },
  { id: 'mort_subite', label: 'Mort subite / mortalité', group: 'general', kw: ['mort', 'trouvé mort', 'décès'] },
  { id: 'urines_foncees', label: 'Urines foncées (hémoglobinurie / myoglobinurie)', group: 'general', kw: ['urine rouge', 'urine marron', 'hémoglobinurie', 'pissat rouge'] },
  { id: 'sueurs', label: 'Sueurs', group: 'general', species: ['cheval'], kw: ['transpire'] },
  { id: 'chute_lait', label: 'Chute de production laitière', group: 'general', species: ['bovin', 'ovin', 'caprin'], kw: ['lait', 'production'] },
  { id: 'retard_croissance', label: 'Retard de croissance', group: 'general', kw: ['croissance', 'chétif'] },

  // Digestif
  { id: 'vomissements', label: 'Vomissements', group: 'digestif', species: [...CARN, 'porc', 'macaque'], kw: ['vomit', 'vomi'] },
  { id: 'vomissements_improductifs', label: 'Efforts de vomissement improductifs', group: 'digestif', species: ['chien'], kw: ['nausée', 'essaie de vomir'] },
  { id: 'regurgitation', label: 'Régurgitations', group: 'digestif', species: CARN },
  { id: 'diarrhee', label: 'Diarrhée', group: 'digestif', kw: ['selles molles', 'liquide', 'bouse liquide'] },
  { id: 'diarrhee_hemorragique', label: 'Diarrhée hémorragique / méléna', group: 'digestif', kw: ['sang', 'méléna', 'selles noires', 'hématochézie'] },
  { id: 'diarrhee_chronique', label: 'Diarrhée chronique', group: 'digestif', kw: ['depuis des semaines'] },
  { id: 'constipation', label: 'Constipation / absence de crottins', group: 'digestif', kw: ['pas de bouses', 'pas de crottins', 'fèces sèches'] },
  { id: 'douleur_abdo', label: 'Douleur abdominale / coliques', group: 'digestif', kw: ['colique', 'se roule', 'gratte le sol', 'regarde ses flancs', 'ventre dur'] },
  { id: 'colique_severe', label: 'Coliques sévères / réfractaires aux antalgiques', group: 'digestif', species: ['cheval'], kw: ['violente', 'ne répond pas'] },
  { id: 'reflux_gastrique', label: 'Reflux gastrique au sondage', group: 'digestif', species: ['cheval'], kw: ['sonde naso-gastrique', 'reflux'] },
  { id: 'distension_abdo', label: 'Distension abdominale', group: 'digestif', kw: ['ballonnement', 'ventre gonflé', 'ascite'] },
  { id: 'ascite', label: 'Ascite / épanchement', group: 'digestif', kw: ['flot', 'épanchement'] },
  { id: 'ptyalisme', label: 'Ptyalisme / salivation', group: 'digestif', kw: ['bave', 'salive', 'hypersalivation'] },
  { id: 'arret_rumination', label: 'Arrêt de rumination / atonie ruminale', group: 'digestif', species: RUM, kw: ['ne rumine pas', 'panse'] },
  { id: 'meteorisation', label: 'Météorisation (flanc gauche distendu)', group: 'digestif', species: RUM, kw: ['gonflée', 'météo', 'flanc gauche'] },
  { id: 'ping_gauche', label: 'Ping à gauche (percussion-auscultation)', group: 'digestif', species: ['bovin'], kw: ['caillette gauche', 'dcg', 'tintement'] },
  { id: 'ping_droit', label: 'Ping à droite', group: 'digestif', species: ['bovin'], kw: ['caillette droite', 'dcd', 'volvulus'] },
  { id: 'douleur_garrot', label: 'Dos voussé / épreuve du garrot positive', group: 'digestif', species: ['bovin'], kw: ['réticulo', 'corps étranger', 'grunt', 'plainte'] },
  { id: 'haleine_cetonique', label: 'Odeur cétonique (haleine, lait)', group: 'digestif', species: [...RUM, 'chien', 'chat'], kw: ['acétone', 'pomme reinette', 'cétone'] },
  { id: 'grincement_dents', label: 'Grincement de dents (bruxisme)', group: 'digestif', species: [...RUM, 'cheval'], kw: ['bruxisme'] },

  // Respiratoire
  { id: 'toux', label: 'Toux', group: 'respiratoire', kw: ['tousse'] },
  { id: 'dyspnee', label: 'Dyspnée', group: 'respiratoire', kw: ['difficulté respiratoire', 'respire mal', 'détresse respiratoire', 'polypnée'] },
  { id: 'jetage', label: 'Jetage nasal', group: 'respiratoire', kw: ['nez qui coule', 'écoulement nasal', 'mucopurulent'] },
  { id: 'eternuements', label: 'Éternuements', group: 'respiratoire', kw: ['éternue'] },
  { id: 'epistaxis', label: 'Épistaxis', group: 'respiratoire', kw: ['saigne du nez'] },

  // Cardio
  { id: 'souffle', label: 'Souffle cardiaque', group: 'cardio' },
  { id: 'tachycardie', label: 'Tachycardie', group: 'cardio', kw: ['cœur rapide', 'fc élevée', 'pouls rapide'] },
  { id: 'bradycardie', label: 'Bradycardie', group: 'cardio', kw: ['cœur lent'] },
  { id: 'arythmie', label: 'Arythmie', group: 'cardio', kw: ['irrégulier'] },
  { id: 'syncope', label: 'Syncope / collapsus', group: 'cardio', kw: ['malaise', 'collapse', 'évanouissement'] },
  { id: 'intolerance_effort', label: "Intolérance à l'effort / contre-performance", group: 'cardio', kw: ['fatigue', 'essoufflé', 'performance'] },

  // Urinaire
  { id: 'dysurie', label: 'Dysurie / strangurie', group: 'urinaire', kw: ['pousse pour uriner', 'strangurie', 'efforts urinaires'] },
  { id: 'anurie', label: 'Anurie / oligurie', group: 'urinaire', kw: ["n'urine plus", 'bloqué', 'oligurie'] },
  { id: 'hematurie', label: 'Hématurie', group: 'urinaire', kw: ['sang dans les urines'] },

  // Neuro
  { id: 'convulsions', label: 'Convulsions', group: 'neuro', kw: ['crise', 'épilepsie', 'convulse'] },
  { id: 'tremblements', label: 'Tremblements / fasciculations', group: 'neuro', kw: ['tremble', 'fasciculations'] },
  { id: 'ataxie', label: 'Ataxie', group: 'neuro', kw: ['titube', 'incoordination', 'démarche ébrieuse'] },
  { id: 'paresie', label: 'Parésie / paralysie', group: 'neuro', kw: ['paralysé', 'faiblesse des membres', 'paraplégie'] },
  { id: 'decubitus', label: 'Décubitus (couché, ne se relève pas)', group: 'neuro', kw: ['couchée', 'vache couchée', 'ne se lève pas'] },
  { id: 'hyperesthesie', label: 'Hyperesthésie / hyperexcitabilité', group: 'neuro', kw: ['hyperexcitable', 'sensible au bruit', 'agressif'] },
  { id: 'comportement', label: 'Troubles du comportement', group: 'neuro', kw: ['comportement anormal', 'agressivité', 'léchage', 'furieuse'] },
  { id: 'cecite', label: 'Cécité', group: 'neuro', kw: ['aveugle', 'ne voit pas'] },
  { id: 'pousser_mur', label: 'Pousser au mur / tête appuyée', group: 'neuro', kw: ['head pressing', 'appuie la tête'] },
  { id: 'tete_penchee', label: 'Tête penchée / tourner en rond', group: 'neuro', kw: ['tourne en rond', 'tête de travers', 'syndrome vestibulaire'] },
  { id: 'paralysie_faciale', label: 'Paralysie faciale (oreille, paupière, lèvre)', group: 'neuro', kw: ['oreille tombante', 'ptose'] },
  { id: 'opisthotonos', label: 'Opisthotonos', group: 'neuro', kw: ['tête en arrière', 'regard au ciel'] },
  { id: 'raideur', label: 'Raideur / procidence de la 3e paupière', group: 'neuro', kw: ['rigide', 'tétanos', 'membrane nictitante', 'chevalet'] },
  { id: 'prurit', label: 'Prurit', group: 'peau', kw: ['gratte', 'démangeaisons', 'se frotte'] },

  // Locomoteur
  { id: 'boiterie', label: 'Boiterie', group: 'locomoteur', kw: ['boite'] },
  { id: 'pouls_digites', label: 'Pouls digités frappants / attitude campée', group: 'locomoteur', species: ['cheval', 'bovin'], kw: ['fourbure', 'campé', 'pieds chauds'] },
  { id: 'myalgie', label: 'Douleur / induration musculaire', group: 'locomoteur', kw: ['muscles durs', 'myosite', 'coup de sang'] },
  { id: 'lesions_podales', label: 'Lésions podales / interdigitées', group: 'locomoteur', kw: ['pied', 'onglons', 'piétin', 'panaris'] },
  { id: 'arthrite', label: 'Arthrite / articulations gonflées', group: 'locomoteur', kw: ['gros genoux', 'articulations', 'polyarthrite'] },

  // Repro
  { id: 'avortement', label: 'Avortement', group: 'repro', kw: ['avorte', 'mise bas prématurée', 'mort-né'] },
  { id: 'ecoulement_vulvaire', label: 'Écoulement vulvaire', group: 'repro', species: FEM_REPRO, kw: ['pertes', 'métrite', 'pus'] },
  { id: 'mammite', label: 'Lait anormal / mamelle inflammée', group: 'repro', kw: ['mammite', 'grumeaux', 'quartier', 'mamelle chaude', 'lait aqueux'] },
  { id: 'mammite_induree', label: 'Mamelle indurée (« pis de bois »)', group: 'repro', species: ['ovin', 'caprin'], kw: ['pis de bois', 'mamelle dure'] },
  { id: 'retention_placentaire', label: 'Rétention placentaire', group: 'repro', species: ['bovin', 'ovin', 'caprin', 'cheval'], kw: ['délivrance', 'non délivrée'] },

  // Peau / yeux / bouche
  { id: 'alopecie', label: 'Alopécie', group: 'peau', kw: ['perte de poils', 'dépilation'] },
  { id: 'lesions_cutanees', label: 'Lésions cutanées (croûtes, ulcères, squames)', group: 'peau', kw: ['croûtes', 'squames', 'dermatite', 'plaies'] },
  { id: 'nodules_cutanes', label: 'Nodules cutanés', group: 'peau', kw: ['nodules', 'boutons', 'bosses'] },
  { id: 'lesions_buccales', label: 'Lésions buccales (vésicules, ulcères, érosions)', group: 'peau', kw: ['aphtes', 'ulcères buccaux', 'vésicules', 'érosions', 'stomatite'] },
  { id: 'croutes_levres', label: 'Croûtes sur les lèvres', group: 'peau', species: ['ovin', 'caprin'], kw: ['ecthyma', 'boutons de lèvres'] },
  { id: 'oedeme_face', label: 'Œdème de la face / langue bleue', group: 'peau', species: RUM, kw: ['tête gonflée', 'langue bleue'] },
  { id: 'conjonctivite', label: 'Conjonctivite / kérato-conjonctivite', group: 'peau', kw: ['œil rouge', 'larmoiement', 'kératite'] },
  { id: 'poil_long', label: 'Hirsutisme / poil long qui ne mue pas', group: 'peau', species: ['cheval'], kw: ['ne mue pas', 'poil frisé', 'hirsutisme'] },
  { id: 'onychogryphose', label: 'Griffes trop longues (onychogryphose)', group: 'peau', species: ['chien'] },
  { id: 'polyurie_glycosurie', label: 'Glycosurie (bandelette)', group: 'urinaire', kw: ['glucose urinaire', 'sucre dans les urines'] },
  { id: 'cetonurie', label: 'Cétonurie (bandelette)', group: 'urinaire', kw: ['cétones urinaires'] },

  // Contexte
  { id: 'jeune', label: 'Jeune / nouveau-né', group: 'contexte', kw: ['chiot', 'chaton', 'veau', 'agneau', 'chevreau', 'poulain', 'porcelet', 'nouveau-né'] },
  { id: 'age', label: 'Animal âgé', group: 'contexte', kw: ['vieux', 'âgé', 'senior'] },
  { id: 'femelle_entiere', label: 'Femelle non stérilisée, chaleurs < 2 mois', group: 'contexte', species: ['chien', 'chat'], kw: ['chaleurs', 'pas stérilisée', 'non stérilisée'] },
  { id: 'male', label: 'Mâle (castré ou non)', group: 'contexte', kw: ['mâle', 'bélier', 'bouc', 'matou'] },
  { id: 'mise_bas_recente', label: 'Mise bas récente (< 2 semaines)', group: 'contexte', kw: ['vêlage', 'agnelage', 'mise bas', 'post-partum', 'poulinage', 'allaite'] },
  { id: 'gestation_avancee', label: 'Fin de gestation', group: 'contexte', kw: ['gestante', 'pleine', 'portante', 'jumeaux'] },
  { id: 'debut_lactation', label: 'Début de lactation (< 2 mois)', group: 'contexte', species: ['bovin', 'ovin', 'caprin'], kw: ['fraîche vêlée'] },
  { id: 'non_vaccine', label: 'Vaccination absente ou non à jour', group: 'contexte', kw: ['pas vacciné', 'non vacciné'] },
  { id: 'changement_aliment', label: "Changement d'alimentation / excès de concentrés", group: 'contexte', kw: ['céréales', 'concentré', 'ration', 'aliment', 'pain'] },
  { id: 'paturage', label: 'Pâturage (herbe jeune, printemps)', group: 'contexte', kw: ['herbe', 'mise à l’herbe', 'pré', 'printemps'] },
  { id: 'paturage_humide', label: 'Pâtures humides / zones à limnées', group: 'contexte', species: RUM, kw: ['humide', 'mare', 'douve'] },
  { id: 'tiques', label: 'Tiques / saison à tiques', group: 'contexte', kw: ['tique', 'forêt', 'bois'] },
  { id: 'toxique', label: 'Accès possible à un toxique', group: 'contexte', kw: ['poison', 'raticide', 'antigel', 'intoxication', 'plomb', 'batterie', 'plante'] },
  { id: 'plusieurs_animaux', label: "Plusieurs animaux atteints dans l'élevage", group: 'contexte', kw: ['troupeau', 'plusieurs', 'cheptel', 'lot'] },
  { id: 'contact_sanglier', label: 'Contact avec sanglier (chasse, abats)', group: 'contexte', species: ['chien', 'porc'], kw: ['chasse', 'sanglier', 'abats crus'] },
  { id: 'ensilage', label: "Ensilage (mauvaise qualité)", group: 'contexte', species: RUM, kw: ['ensilage', 'enrubanné'] },
  { id: 'grand_chien', label: 'Chien de grande race, thorax profond', group: 'contexte', species: ['chien'], kw: ['grande race', 'dogue', 'berger allemand'] },
  { id: 'effort_recent', label: 'Effort intense récent / reprise du travail', group: 'contexte', species: ['cheval', 'chien'], kw: ['effort', 'travail', 'course', 'concours'] },
  { id: 'plaie_recente', label: 'Plaie récente / castration / mise bas', group: 'contexte', kw: ['plaie', 'blessure', 'castration', 'clou'] },
];

/** Anomalies biologiques dérivées automatiquement des analyses */
export const LAB_FINDINGS: Record<string, string> = {
  anemie: 'Anémie',
  polyglobulie: 'Hématocrite élevé (hémoconcentration)',
  leucocytose: 'Leucocytose',
  leucopenie: 'Leucopénie',
  neutrophilie: 'Neutrophilie',
  neutropenie: 'Neutropénie',
  lymphopenie: 'Lymphopénie',
  lymphocytose: 'Lymphocytose',
  eosinophilie: 'Éosinophilie',
  thrombopenie: 'Thrombopénie',
  inflammation: 'Marqueurs inflammatoires élevés (fibrinogène / SAA)',
  azotemie: 'Azotémie (urée et/ou créatinine ↑)',
  sdma_haut: 'SDMA élevée',
  hyperglycemie: 'Hyperglycémie',
  hypoglycemie: 'Hypoglycémie',
  hyperkaliemie: 'Hyperkaliémie',
  hypokaliemie: 'Hypokaliémie',
  hyponatremie: 'Hyponatrémie',
  hypernatremie: 'Hypernatrémie',
  hypochloremie: 'Hypochlorémie',
  hypercalcemie: 'Hypercalcémie',
  hypocalcemie: 'Hypocalcémie',
  hyperphosphatemie: 'Hyperphosphatémie',
  hypophosphatemie: 'Hypophosphatémie',
  hypomagnesemie: 'Hypomagnésémie',
  alat_haut: 'ALAT élevées',
  pal_haut: 'PAL élevées',
  ggt_haut: 'GGT élevées',
  asat_haut: 'ASAT élevées',
  gldh_haut: 'GLDH élevée',
  ck_haut: 'CK élevées',
  hyperbilirubinemie: 'Hyperbilirubinémie',
  ab_haut: 'Acides biliaires élevés',
  hypoalbuminemie: 'Hypoalbuminémie',
  hyperglobulinemie: 'Hyperglobulinémie',
  hypoproteinemie: 'Hypoprotéinémie',
  hyperproteinemie: 'Hyperprotéinémie',
  hypercholesterolemie: 'Hypercholestérolémie',
  hypertriglyceridemie: 'Hypertriglycéridémie',
  lipase_haut: 'Lipase élevée',
  lactate_haut: 'Hyperlactatémie',
  cetose: 'BHB élevé (cétose)',
  agne_haut: 'AGNE élevés (mobilisation lipidique)',
  fructo_haut: 'Fructosamine élevée',
  t4_haut: 'T4 élevée',
  t4_bas: 'T4 basse',
  acidose: 'Acidose métabolique (HCO₃⁻ ↓)',
  alcalose: 'Alcalose métabolique (HCO₃⁻ ↑)',
  isosthenurie: 'Urines peu concentrées (densité < 1,030 chat / < 1,025 chien)',
  proteinurie: 'Protéinurie (RPCU ↑)',
  na_k_bas: 'Rapport Na/K < 27',
  ag_bas: 'Rapport albumine/globulines < 0,4',
};

export const signLabel = (id: string): string =>
  SIGNS.find((s) => s.id === id)?.label ?? LAB_FINDINGS[id] ?? id;
