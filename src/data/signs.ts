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
  /** Mots-clés supplémentaires pour la recherche */
  kw?: string[];
  /** Élément ajouté automatiquement (saison, toxique précisé) : absent des listes, de la recherche et des questions */
  auto?: boolean;
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
  { id: 'fievre', label: 'Fièvre / hyperthermie', group: 'general', kw: ['hyperthermie', 'fébrile', 'fiévreux', 'hyperthermique', 'température élevée', 'forte température', 'de la température', 'de la fièvre'] },
  { id: 'hypothermie', label: 'Hypothermie', group: 'general', kw: ['extrémités froides', 'oreilles froides', 'température basse', 'hypotherme', 'hypothermique', 'pattes froides', 'coussinets froids', 'corps froid'] },
  { id: 'abattement', label: 'Abattement / léthargie', group: 'general', kw: ['apathie', 'faiblesse', 'léthargie', 'prostration', 'abattu', 'apathique', 'léthargique', 'prostré', 'amorphe', 'mou', 'fatigué', 'ne bouge plus', 'ne bouge pas', 'reste couché', 'pas en forme', 'patraque', 'déprimé', 'dépression', 'aeg', 'altération de l’état général', 'triste', 'abattue'] },
  { id: 'anorexie', label: 'Anorexie / dysorexie', group: 'general', kw: ['ne mange pas', 'inappétence', 'anorexique', 'ne mange plus', 'mange peu', 'mange moins', 'refuse de manger', 'refuse la nourriture', 'dysorexique', 'dysorexie', 'inappétent', 'perte d’appétit', 'boude sa gamelle', 'ne s’alimente plus', 'manque d’appétit', 'peu d’appétit', 'pas d’appétit', 'plus d’appétit', 'ne tète plus', 'tète mal', 'ne tète pas', 'ne boit plus son lait'] },
  { id: 'polyphagie', label: 'Polyphagie', group: 'general', kw: ['mange beaucoup', 'faim', 'affamé', 'vorace', 'mange tout le temps'] },
  { id: 'amaigrissement', label: 'Amaigrissement', group: 'general', kw: ['perte de poids', 'maigre', 'cachexie', 'maigrit', 'a maigri', 'amaigri', 'cachectique', 'fonte musculaire', 'perd du poids', 'a perdu du poids', 'émacié'] },
  { id: 'prise_poids', label: 'Prise de poids / obésité', group: 'general', kw: ['obèse', 'surpoids', 'grossit', 'a grossi', 'embonpoint'] },
  { id: 'deshydratation', label: 'Déshydratation', group: 'general', kw: ['pli de peau', 'enophtalmie', 'déshydraté', 'pli cutané', 'yeux enfoncés', 'muqueuses sèches'] },
  { id: 'pupd', label: 'Polyuro-polydipsie', group: 'general', kw: ['boit beaucoup', 'urine beaucoup', 'pupd', 'polydipsie', 'polyurie', 'boit énormément', 'boit plus', 'boit davantage', 'soif', 'urine plus', 'urine souvent', 'pipi partout', 'pu pd', 'pd pu'] },
  { id: 'muqueuses_pales', label: 'Muqueuses pâles', group: 'general', kw: ['pâleur', 'anémie', 'muqueuses pâles', 'gencives blanches', 'gencives pâles', 'pâle', 'anémié', 'muqueuses blanches', 'muqueuses porcelaine', 'anémiée', 'anémiés', 'anémiées'] },
  { id: 'ictere', label: 'Ictère', group: 'general', kw: ['jaune', 'jaunisse', 'subictère', 'ictérique', 'muqueuses jaunes', 'yeux jaunes', 'sclères jaunes'] },
  { id: 'muqueuses_congestives', label: 'Muqueuses congestives (rouges, injectées)', group: 'general', kw: ['congestion', 'muqueuses rouges', 'muqueuses violacées', 'muqueuses injectées', 'choc septique'] },
  { id: 'trc_allonge', label: 'TRC allongé (> 2 s)', group: 'general', kw: ['trc', 'temps de recoloration', 'état de choc', 'choc hypovolémique', 'choc hémorragique', 'pouls filant', 'pouls faible'] },
  { id: 'stupeur_coma', label: 'Stupeur / coma', group: 'neuro', kw: ['coma', 'comateux', 'stupeur', 'stuporeux', 'inconscient', 'ne réagit plus', 'ne répond plus', 'obnubilé'] },
  { id: 'cyanose', label: 'Cyanose', group: 'general', kw: ['bleu', 'cyanosé', 'cyanotique', 'muqueuses bleues'] },
  { id: 'hemorragies', label: 'Saignements / pétéchies', group: 'general', kw: ['hémorragie', 'saigne', 'pétéchies', 'ecchymoses', 'épistaxis', 'saignement', 'hématome', 'hématomes'] },
  { id: 'adenomegalie', label: 'Adénomégalie', group: 'general', kw: ['ganglions', 'nœuds lymphatiques', 'abcès ganglionnaire', 'gros ganglions', 'ganglions gonflés', 'lymphadénopathie', 'adénopathie'] },
  { id: 'oedeme', label: 'Œdèmes (déclives, sous-glossien…)', group: 'general', kw: ['œdème', 'oedème', 'sous-glossien', 'bouteille', 'œdème sous la mâchoire', 'œdème de l’auge', 'œdèmes déclives'] },
  { id: 'mort_subite', label: 'Mort subite / mortalité', group: 'general', kw: ['mort', 'trouvé mort', 'décès', 'retrouvé mort', 'mort brutale', 'mortalité'] },
  { id: 'urines_foncees', label: 'Urines foncées (hémoglobinurie / myoglobinurie)', group: 'general', kw: ['urine rouge', 'urine marron', 'hémoglobinurie', 'pissat rouge'] },
  { id: 'sueurs', label: 'Sueurs', group: 'general', species: ['cheval'], kw: ['transpire'] },
  { id: 'chute_lait', label: 'Chute de production laitière', group: 'general', species: ['bovin', 'ovin', 'caprin'], kw: ['baisse de lait', 'chute de lait', 'moins de lait', 'perte de lait', 'baisse de production', 'chute de production', 'production en baisse'] },
  { id: 'retard_croissance', label: 'Retard de croissance', group: 'general', kw: ['croissance', 'chétif'] },

  // Digestif
  { id: 'vomissements', label: 'Vomissements', group: 'digestif', species: [...CARN, 'porc', 'macaque'], kw: ['vomit', 'vomi', 'vomissement', 'vomir', 'vomissait', 'rejette', 'rejette la nourriture', 'vomitif', 'hématémèse'] },
  { id: 'vomissements_improductifs', label: 'Efforts de vomissement improductifs', group: 'digestif', species: ['chien'], kw: ['nausée', 'essaie de vomir', 'essaie de vomir sans rien', 'efforts de vomissement', 'vomissements improductifs', 'veut vomir', 'haut-le-cœur'] },
  { id: 'regurgitation', label: 'Régurgitations', group: 'digestif', species: CARN, kw: ['régurgite', 'régurgitation'] },
  { id: 'diarrhee', label: 'Diarrhée', group: 'digestif', kw: ['selles molles', 'bouse liquide', 'diarrhéique', 'selles liquides', 'fèces molles', 'crottes molles', 'chiasse', 'bouse molle'] },
  { id: 'diarrhee_hemorragique', label: 'Diarrhée hémorragique / méléna', group: 'digestif', kw: ['méléna', 'selles noires', 'hématochézie', 'sang dans les selles', 'selles sanglantes', 'diarrhée sanglante', 'diarrhée hémorragique', 'selles avec du sang', 'diarrhée avec du sang', 'sang en gelée', 'selles rouges', 'diarrhée rouge'] },
  { id: 'diarrhee_chronique', label: 'Diarrhée chronique', group: 'digestif', kw: ['diarrhée depuis des semaines', 'diarrhée depuis des mois', 'diarrhée depuis plusieurs mois', 'diarrhée persistante', 'diarrhée récidivante', 'diarrhée qui dure'] },
  { id: 'constipation', label: 'Constipation / absence de crottins', group: 'digestif', kw: ['pas de bouses', 'pas de crottins', 'fèces sèches', 'constipé', 'ne fait plus ses besoins', 'ne défèque plus', 'pas de selles', 'ténesme'] },
  { id: 'douleur_abdo', label: 'Douleur abdominale / coliques', group: 'digestif', kw: ['colique', 'se roule', 'gratte le sol', 'regarde ses flancs', 'ventre dur', 'mal au ventre', 'ventre douloureux', 'abdomen douloureux', 'douleur abdominale', 'douleur au ventre', 'position de prière', 'abdomen tendu', 'coliques', 'se couche et se relève'] },
  { id: 'colique_severe', label: 'Coliques sévères / réfractaires aux antalgiques', group: 'digestif', species: ['cheval'], kw: ['violente', 'ne répond pas'] },
  { id: 'reflux_gastrique', label: 'Reflux gastrique au sondage', group: 'digestif', species: ['cheval'], kw: ['sonde naso-gastrique', 'reflux'] },
  { id: 'distension_abdo', label: 'Distension abdominale', group: 'digestif', kw: ['ballonnement', 'ventre gonflé', 'ascite', 'gros ventre', 'ventre gros', 'ventre distendu', 'ventre tendu', 'ventre ballonné', 'abdomen distendu', 'abdomen gonflé', 'abdomen dilaté', 'ballonné', 'ventre rond', 'ventre qui gonfle', 'dilatation abdominale', 'distension'] },
  { id: 'ascite', label: 'Ascite / épanchement', group: 'digestif', kw: ['flot', 'épanchement', 'liquide dans le ventre', 'épanchement abdominal', 'ascitique', 'signe du flot'] },
  { id: 'ptyalisme', label: 'Ptyalisme / salivation', group: 'digestif', kw: ['bave', 'salive', 'hypersalivation', 'bave beaucoup', 'salivation', 'salive beaucoup', 'hypersialorrhée'] },
  { id: 'arret_rumination', label: 'Arrêt de rumination / atonie ruminale', group: 'digestif', species: RUM, kw: ['ne rumine pas', 'ne rumine plus', 'rumine plus', 'panse'] },
  { id: 'meteorisation', label: 'Météorisation (flanc gauche distendu)', group: 'digestif', species: RUM, kw: ['flanc gauche', 'panse gonflée', 'flanc gonflé', 'flanc gauche gonflé', 'rumen distendu', 'météorisée', 'météorisé'] },
  { id: 'ping_gauche', label: 'Ping à gauche (percussion-auscultation)', group: 'digestif', species: ['bovin'], kw: ['caillette gauche', 'dcg', 'tintement'] },
  { id: 'ping_droit', label: 'Ping à droite', group: 'digestif', species: ['bovin'], kw: ['caillette droite', 'dcd', 'volvulus'] },
  { id: 'douleur_garrot', label: 'Dos voussé / épreuve du garrot positive', group: 'digestif', species: ['bovin'], kw: ['réticulo', 'corps étranger', 'grunt', 'plainte'] },
  { id: 'haleine_cetonique', label: 'Odeur cétonique (haleine, lait)', group: 'digestif', species: [...RUM, 'chien', 'chat'], kw: ['acétone', 'pomme reinette', 'cétone'] },
  { id: 'grincement_dents', label: 'Grincement de dents (bruxisme)', group: 'digestif', species: [...RUM, 'cheval'], kw: ['bruxisme'] },

  // Respiratoire
  { id: 'toux', label: 'Toux', group: 'respiratoire', kw: ['tousse', 'toussait', 'toussote', 'toux sèche', 'toux grasse', 'quinte'] },
  { id: 'dyspnee', label: 'Dyspnée', group: 'respiratoire', kw: ['difficulté respiratoire', 'respire mal', 'détresse respiratoire', 'polypnée', 'dyspnéique', 'respire vite', 'respiration rapide', 'essoufflé', 'halète', 'tachypnée', 'tachypnéique', 'respire difficilement', 'gêne respiratoire', 'discordance', 'orthopnée', 'bouche ouverte', 'respire avec le ventre', 'respiration abdominale', 'respire fort', 'souffle court', 'poussif', 'pousse du flanc'] },
  { id: 'jetage', label: 'Jetage nasal', group: 'respiratoire', kw: ['nez qui coule', 'écoulement nasal', 'mucopurulent', 'morve', 'écoulement du nez'] },
  { id: 'eternuements', label: 'Éternuements', group: 'respiratoire', kw: ['éternue'] },
  { id: 'epistaxis', label: 'Épistaxis', group: 'respiratoire', kw: ['saigne du nez'] },

  // Cardio
  { id: 'souffle', label: 'Souffle cardiaque', group: 'cardio' },
  { id: 'tachycardie', label: 'Tachycardie', group: 'cardio', kw: ['cœur rapide', 'fc élevée', 'pouls rapide', 'tachycarde', 'tachycardique', 'cœur qui bat vite'] },
  { id: 'bradycardie', label: 'Bradycardie', group: 'cardio', kw: ['cœur lent', 'bradycarde'] },
  { id: 'arythmie', label: 'Arythmie', group: 'cardio', kw: ['irrégulier'] },
  { id: 'syncope', label: 'Syncope / collapsus', group: 'cardio', kw: ['malaise', 'collapse', 'évanouissement', 'syncopes', 's’effondre', 'perte de connaissance', 'évanoui'] },
  { id: 'intolerance_effort', label: "Intolérance à l'effort / contre-performance", group: 'cardio', kw: ['fatigue', 'essoufflé', 'performance', 'fatigable', 'se fatigue vite', 'ne suit plus en promenade', 'essoufflé à l’effort'] },

  // Urinaire
  { id: 'dysurie', label: 'Dysurie / strangurie', group: 'urinaire', kw: ['pousse pour uriner', 'strangurie', 'efforts urinaires', 'du mal à uriner', 'urine goutte à goutte', 'difficultés à uriner', 'pollakiurie', 'force pour uriner', 'va souvent à la litière', 'va souvent uriner', 'pleure en urinant', 'miaule en urinant', 'urine peu', 'urine par petites quantités', 'petites quantités d’urine', 'reste longtemps dans la litière'] },
  { id: 'anurie', label: 'Anurie / oligurie', group: 'urinaire', kw: ["n'urine plus", 'bloqué', 'oligurie', 'n’urine pas', 'ne fait plus pipi', 'pas d’urine', 'oligo-anurie'] },
  { id: 'hematurie', label: 'Hématurie', group: 'urinaire', kw: ['sang dans les urines', 'urine rouge', 'sang dans l’urine', 'pipi rouge', 'urine du sang', 'urines rouges', 'urines sanglantes'] },

  // Neuro
  { id: 'convulsions', label: 'Convulsions', group: 'neuro', kw: ['crise', 'épilepsie', 'convulse', 'convulsion', 'crises', 'crise convulsive', 'crise d’épilepsie', 'épileptique'] },
  { id: 'tremblements', label: 'Tremblements / fasciculations', group: 'neuro', kw: ['tremble', 'fasciculations', 'tremblement', 'tremblote', 'frissons'] },
  { id: 'ataxie', label: 'Ataxie', group: 'neuro', kw: ['titube', 'incoordination', 'démarche ébrieuse', 'ataxique', 'marche bizarre', 'démarche chancelante', 'tombe sur le côté', 'chancelant', 'ébrieux'] },
  { id: 'paresie', label: 'Parésie / paralysie', group: 'neuro', kw: ['paralysé', 'faiblesse des membres', 'paraplégie', 'parésie', 'paralysie', 'paraparésie', 'tétraparésie', 'ne marche plus', 'traîne les pattes', 'arrière-train faible'] },
  { id: 'decubitus', label: 'Décubitus (couché, ne se relève pas)', group: 'neuro', kw: ['couchée', 'vache couchée', 'ne se lève pas', 'couché', 'reste couché', 'ne se relève pas', 'ne se lève plus', 'ne se relève plus', 'décubitus sternal', 'décubitus latéral', 'à terre'] },
  { id: 'hyperesthesie', label: 'Hyperesthésie / hyperexcitabilité', group: 'neuro', kw: ['hyperexcitable', 'sensible au bruit', 'agressif'] },
  { id: 'comportement', label: 'Troubles du comportement', group: 'neuro', kw: ['comportement anormal', 'agressivité', 'léchage', 'furieuse', 'changement de comportement', 'désorienté', 'confus', 'hagard'] },
  { id: 'cecite', label: 'Cécité', group: 'neuro', kw: ['aveugle', 'ne voit pas', 'ne voit plus', 'cécité'] },
  { id: 'pousser_mur', label: 'Pousser au mur / tête appuyée', group: 'neuro', kw: ['head pressing', 'appuie la tête'] },
  { id: 'tete_penchee', label: 'Tête penchée / tourner en rond', group: 'neuro', kw: ['tourne en rond', 'tête de travers', 'syndrome vestibulaire', 'tête penchée', 'port de tête penché', 'nystagmus', 'vestibulaire'] },
  { id: 'paralysie_faciale', label: 'Paralysie faciale (oreille, paupière, lèvre)', group: 'neuro', kw: ['oreille tombante', 'ptose'] },
  { id: 'opisthotonos', label: 'Opisthotonos', group: 'neuro', kw: ['tête en arrière', 'regard au ciel'] },
  { id: 'raideur', label: 'Raideur généralisée (tétanique) / procidence de la 3e paupière', group: 'neuro', kw: ['rigide', 'tétanos', 'membrane nictitante', 'chevalet'] },
  { id: 'prurit', label: 'Prurit', group: 'peau', kw: ['démangeaisons', 'se frotte', 'se gratte', 'démange', 'se lèche', 'prurigineux', 'se gratte beaucoup', 'se mordille'] },

  // Examen par espèce
  { id: 'ileus', label: 'Bruits digestifs absents (iléus)', group: 'digestif', species: ['cheval'], kw: ['pas de bruits digestifs', 'silence digestif', 'iléus', 'bruits digestifs absents'] },
  { id: 'anses_distendues', label: 'Palpation transrectale : anses distendues, déplacement', group: 'digestif', species: ['cheval'], kw: ['anses distendues', 'déplacement du côlon', 'accrochement néphrosplénique', 'torsion'] },

  // Locomoteur
  { id: 'boiterie', label: 'Boiterie', group: 'locomoteur', kw: ['boite', 'boitait', 'boiteux', 'boiterie', 'boitille', 'ne pose pas la patte', 'suppression d’appui'] },
  { id: 'pouls_digites', label: 'Pouls digités frappants / attitude campée', group: 'locomoteur', species: ['cheval', 'bovin'], kw: ['fourbure', 'campé', 'pieds chauds'] },
  { id: 'myalgie', label: 'Douleur musculaire / induration musculaire', group: 'locomoteur', kw: ['muscles durs', 'myosite', 'coup de sang'] },
  { id: 'lesions_podales', label: 'Lésions podales / interdigitées', group: 'locomoteur', kw: ['pied', 'onglons', 'piétin', 'panaris'] },
  { id: 'arthrite', label: 'Arthrite / articulations gonflées', group: 'locomoteur', kw: ['gros genoux', 'articulations', 'polyarthrite'] },

  // Repro
  { id: 'avortement', label: 'Avortement', group: 'repro', kw: ['avorte', 'mise bas prématurée', 'mort-né'] },
  { id: 'ecoulement_vulvaire', label: 'Écoulement vulvaire', group: 'repro', species: FEM_REPRO, kw: ['métrite', 'pus', 'écoulement vulvaire', 'pertes vaginales', 'pertes vulvaires', 'vulve qui coule'] },
  { id: 'mammite', label: 'Lait anormal / mamelle inflammée', group: 'repro', kw: ['mammite', 'grumeaux', 'quartier', 'mamelle chaude', 'lait aqueux', 'quartier gonflé', 'quartier dur', 'quartier chaud', 'mamelle gonflée', 'mamelle dure', 'lait avec des grumeaux', 'caillots dans le lait'] },
  { id: 'mammite_induree', label: 'Mamelle indurée (« pis de bois »)', group: 'repro', species: ['ovin', 'caprin'], kw: ['pis de bois', 'mamelle dure'] },
  { id: 'retention_placentaire', label: 'Rétention placentaire', group: 'repro', species: ['bovin', 'ovin', 'caprin', 'cheval'], kw: ['délivrance', 'non délivrée'] },

  // Peau / yeux / bouche
  { id: 'alopecie', label: 'Alopécie', group: 'peau', kw: ['perte de poils', 'dépilation'] },
  { id: 'lesions_cutanees', label: 'Lésions cutanées (croûtes, ulcères, squames)', group: 'peau', kw: ['croûtes', 'squames', 'dermatite', 'plaies', 'plaie', 'pyodermite', 'losange', 'losanges', 'taches rouges', 'plaques rouges', 'rougeurs', 'érythème'] },
  { id: 'nodules_cutanes', label: 'Nodules cutanés', group: 'peau', kw: ['nodules', 'boutons', 'bosses'] },
  { id: 'lesions_buccales', label: 'Lésions buccales (vésicules, ulcères, érosions)', group: 'peau', kw: ['aphtes', 'ulcères buccaux', 'vésicules', 'érosions', 'stomatite'] },
  { id: 'croutes_levres', label: 'Croûtes sur les lèvres', group: 'peau', species: ['ovin', 'caprin'], kw: ['ecthyma', 'boutons de lèvres'] },
  { id: 'oedeme_face', label: 'Œdème de la face / langue bleue', group: 'peau', species: RUM, kw: ['tête gonflée', 'langue bleue'] },
  { id: 'conjonctivite', label: 'Conjonctivite / kérato-conjonctivite', group: 'peau', kw: ['œil rouge', 'larmoiement', 'kératite', 'yeux rouges', 'yeux qui coulent', 'écoulement oculaire'] },
  { id: 'poil_long', label: 'Hirsutisme / poil long qui ne mue pas', group: 'peau', species: ['cheval'], kw: ['ne mue pas', 'poil frisé', 'hirsutisme'] },
  { id: 'onychogryphose', label: 'Griffes trop longues (onychogryphose)', group: 'peau', species: ['chien'] },
  { id: 'polyurie_glycosurie', label: 'Glycosurie (bandelette)', group: 'urinaire', kw: ['glucose urinaire', 'sucre dans les urines'] },
  { id: 'cetonurie', label: 'Cétonurie (bandelette)', group: 'urinaire', kw: ['cétones urinaires'] },

  { id: 'puces', label: 'Puces / déjections de puces', group: 'peau', species: CARN, kw: ['puce', 'puces', 'crottes de puces', 'déjections de puces'] },
  { id: 'otite', label: 'Otite (secoue la tête, oreille sale ou odorante)', group: 'peau', species: CARN, kw: ['secoue la tête', 'secoue les oreilles', 'se gratte l’oreille', 'se gratte les oreilles', 'oreille sale', 'oreilles sales', 'oreille qui sent', 'odeur des oreilles', 'cérumen', 'otite', 'oreille rouge', 'oreilles rouges', 'conduit auditif'] },
  { id: 'douleur_rachis', label: 'Douleur dorsale / cervicale (crie quand on le prend)', group: 'neuro', species: CARN, kw: ['crie quand on le prend', 'crie quand on le porte', 'crie quand on le touche', 'douleur au dos', 'mal au dos', 'douleur dorsale', 'douleur cervicale', 'douleur au cou', 'ne veut plus sauter', 'ne saute plus', 'ne monte plus les escaliers', 'tête basse', 'dos rond'] },
  { id: 'raideur_lever', label: 'Raideur au lever, après le repos', group: 'locomoteur', species: [...CARN, 'cheval'], kw: ['raide au lever', 'raideur au lever', 'raideur au réveil', 'raideur matinale', 'se lève difficilement', 'difficultés à se lever', 'du mal à se lever', 'ankylosé', 'se dérouille'] },
  { id: 'aliment_naseaux', label: 'Aliment ressortant par les naseaux / étouffement', group: 'digestif', species: ['cheval'], kw: ['par les naseaux', 'par le nez', 'nourriture par les naseaux', 'jetage alimentaire', 's’étouffe', 'étouffement', 'bouchon œsophagien', 'obstruction œsophagienne', 'tousse en mangeant'] },
  { id: 'vers_selles', label: 'Vers visibles dans les selles ou les vomissements', group: 'digestif', kw: ['des vers', 'ascaris', 'ténia', 'tænia', 'vers dans les selles', 'vomit des vers', 'grains de riz'] },
  { id: 'boiterie_aigue_1', label: 'Boiterie aiguë d’un seul membre, suppression d’appui', group: 'locomoteur', kw: ['ne pose plus la patte', 'ne pose pas la patte', 'suppression d’appui', 'boiterie brutale', 'boite brutalement', 'boite d’un coup', 'patte en l’air', 'sur trois pattes', 'ne pose plus le pied', 'pied chaud', 'un seul pied'] },

  // Contexte
  { id: 'introduction', label: 'Achat ou introduction récente d’animaux', group: 'contexte', species: ['bovin', 'ovin', 'caprin', 'porc', 'cheval'], kw: ['achat', 'acheté', 'introduction', 'introduit', 'nouvel animal', 'nouveaux animaux', 'nouvelle génisse', 'nouveau cheval', 'marché', 'foire'] },
  { id: 'estive', label: 'Retour d’estive, pâture commune, concours', group: 'contexte', species: ['bovin', 'ovin', 'caprin', 'cheval'], kw: ['estive', 'transhumance', 'pâture commune', 'pension', 'concours', 'rassemblement'] },
  { id: 'contact_faune', label: 'Contact avec la faune sauvage (sangliers, blaireaux, cervidés)', group: 'contexte', species: ['bovin', 'ovin', 'caprin', 'porc'], kw: ['sanglier', 'sangliers', 'blaireau', 'blaireaux', 'cerf', 'chevreuil', 'faune sauvage'] },
  { id: 'velage_difficile', label: 'Mise bas difficile (extraction forcée, gros veau)', group: 'repro', species: ['bovin', 'ovin', 'caprin', 'cheval'], kw: ['vêlage difficile', 'extraction forcée', 'dystocie', 'gros veau', 'veau trop gros', 'tiré le veau', 'vêlage dur'] },
  { id: 'primipare', label: 'Primipare (génisse, 1re lactation)', group: 'contexte', species: ['bovin'], kw: ['génisse', 'primipare', 'première lactation', 'premier vêlage'] },
  { id: 'multipare', label: '3e lactation ou plus', group: 'contexte', species: ['bovin'], kw: ['vieille vache', 'multipare', 'troisième lactation', '3e lactation'] },
  { id: 'aigu', label: 'Évolution aiguë (moins d’une semaine)', group: 'contexte', kw: ['depuis hier', 'depuis ce matin', 'depuis cette nuit', 'brutalement', 'd’un coup', 'soudain', 'soudainement', 'brutal'] },
  { id: 'chronique', label: 'Évolution chronique (plus d’un mois)', group: 'contexte', kw: ['depuis des mois', 'depuis plusieurs mois', 'depuis longtemps', 'chronique', 'depuis des semaines', 'progressivement'] },
  { id: 'neonatal', label: 'Nouveau-né (moins d’un mois)', group: 'contexte', species: ['bovin', 'ovin', 'caprin', 'porc'], kw: ['nouveau-né', 'quelques jours', 'sous la mère'] },
  { id: 'ains_cortico', label: 'AINS ou corticoïdes récents', group: 'contexte', kw: ['anti-inflammatoire', 'anti-inflammatoires', 'ains', 'cortisone', 'corticoïde', 'corticoïdes', 'prednisolone', 'méloxicam', 'phénylbutazone', 'ibuprofène', 'aspirine', 'dexaméthasone'] },
  { id: 'non_vermifuge', label: 'Vermifugation absente ou ancienne', group: 'contexte', kw: ['pas vermifugé', 'jamais vermifugé', 'non vermifugé', 'pas de vermifuge', 'pas traité contre les parasites'] },
  { id: 'jeune', label: 'Jeune / nouveau-né', group: 'contexte', kw: ['chiot', 'chaton', 'veau', 'agneau', 'chevreau', 'poulain', 'porcelet', 'nouveau-né', 'juvénile'] },
  { id: 'age', label: 'Animal âgé', group: 'contexte', kw: ['vieux', 'âgé', 'senior', 'gériatrique', 'vieille', 'âgée'] },
  { id: 'femelle_entiere', label: 'Femelle non stérilisée, chaleurs < 2 mois', group: 'contexte', species: ['chien', 'chat'], kw: ['chaleurs', 'pas stérilisée', 'non stérilisée', 'chienne entière', 'chatte entière', 'chaleurs récentes', 'en chaleur', 'était en chaleur'] },
  { id: 'male', label: 'Mâle (castré ou non)', group: 'contexte', kw: ['mâle', 'bélier', 'bouc', 'matou'] },
  { id: 'mise_bas_recente', label: 'Mise bas récente (< 2 semaines)', group: 'contexte', kw: ['vêlage', 'agnelage', 'mise bas', 'post-partum', 'poulinage', 'allaite', 'a mis bas', 'vient de mettre bas', 'a vêlé', 'vient de vêler', 'a agnelé', 'a pouliné', 'vêlée', 'vêlé', 'agnelée', 'agnelé', 'pouliné', 'mis bas', 'vient d’agneler', 'vient de pouliner', 'a chevreté', 'chevretée'] },
  { id: 'gestation_avancee', label: 'Fin de gestation', group: 'contexte', kw: ['gestante', 'portante', 'jumeaux', 'fin de gestation', 'gravide', 'va mettre bas', 'proche du terme', 'à terme', 'va vêler', 'prête à vêler'] },
  { id: 'debut_lactation', label: 'Début de lactation (< 2 mois)', group: 'contexte', species: ['bovin', 'ovin', 'caprin'], kw: ['fraîche vêlée'] },
  { id: 'non_vaccine', label: 'Vaccination absente ou non à jour', group: 'contexte', kw: ['pas vacciné', 'non vacciné', 'non vaccinée', 'pas vaccinée', 'vaccins pas à jour', 'pas de vaccin'] },
  { id: 'changement_aliment', label: "Changement d'alimentation / excès de concentrés", group: 'contexte', kw: ['céréales', 'concentré', 'pain', 'changement d’aliment', 'changement de ration', 'changement alimentaire', 'nouvel aliment', 'excès de concentré', 'transition alimentaire', 'orge', 'blé'] },
  { id: 'paturage', label: 'Pâturage (herbe jeune, printemps)', group: 'contexte', kw: ['herbe', 'mise à l’herbe', 'pré', 'printemps'] },
  { id: 'paturage_humide', label: 'Pâtures humides / zones à limnées', group: 'contexte', species: RUM, kw: ['humide', 'mare', 'douve'] },
  { id: 'tiques', label: 'Tiques / saison à tiques', group: 'contexte', kw: ['tique', 'forêt', 'bois'] },
  { id: 'toxique', label: 'Accès possible à un toxique', group: 'contexte', kw: ['poison', 'raticide', 'antigel', 'intoxication', 'plomb', 'batterie', 'plante', 'ingestion', 'mort-aux-rats', 'anticoagulant', 'chocolat', 'lys', 'xylitol', 'limaces', 'anti-limaces', 'métaldéhyde', 'crapaud', 'raisin', 'raisins secs', 'ibuprofène', 'paracétamol', 'anti-inflammatoire', 'médicament humain', 'herbicide', 'insecticide', 'feuilles d’if'] },
  { id: 'plusieurs_animaux', label: "Plusieurs animaux atteints dans l'élevage", group: 'contexte', kw: ['troupeau', 'plusieurs', 'cheptel', 'lot'] },
  { id: 'contact_sanglier', label: 'Contact avec sanglier (chasse, abats)', group: 'contexte', species: ['chien', 'porc'], kw: ['chasse', 'sanglier', 'abats crus'] },
  { id: 'ensilage', label: "Ensilage (mauvaise qualité)", group: 'contexte', species: RUM, kw: ['ensilage', 'enrubanné'] },
  { id: 'grand_chien', label: 'Chien de grande race, thorax profond', group: 'contexte', species: ['chien'], kw: ['grande race', 'grande taille', 'thorax profond', 'race géante'] },
  { id: 'effort_recent', label: 'Effort intense récent / reprise du travail', group: 'contexte', species: ['cheval', 'chien'], kw: ['effort', 'travail', 'course', 'concours'] },
  { id: 'plaie_recente', label: 'Plaie récente / castration / mise bas', group: 'contexte', kw: ['plaie', 'blessure', 'castration', 'clou', 'coupure', 'morsure', 'griffure', 'opéré récemment'] },
  { id: 'ecart_alimentaire', label: 'Écart alimentaire (poubelles, restes, charogne)', group: 'contexte', species: CARN, kw: ['poubelle', 'poubelles', 'restes de table', 'charogne', 'a mangé des restes', 'fouillé les poubelles', 'barbecue', 'a mangé n’importe quoi'] },
  { id: 'corps_etranger_ingere', label: 'Ingestion possible d’un corps étranger', group: 'contexte', species: CARN, kw: ['a avalé', 'avalé', 'corps étranger', 'chaussette', 'jouet', 'noyau', 'ficelle', 'épi', 'caillou', 'os de poulet', 'a mangé un os'] },
  { id: 'collectivite', label: 'Collectivité récente (pension, chenil, refuge, exposition)', group: 'contexte', species: CARN, kw: ['pension', 'chenil', 'refuge', 'garderie', 'exposition canine', 'élevage canin', 'retour de pension'] },
  { id: 'chaleur_ambiante', label: 'Exposition à la chaleur (soleil, voiture, effort par temps chaud)', group: 'contexte', species: [...CARN, 'cheval'], kw: ['plein soleil', 'canicule', 'voiture fermée', 'enfermé dans la voiture', 'coup de chaleur', 'forte chaleur', 'temps chaud', 'au soleil'] },
  { id: 'traumatisme', label: 'Traumatisme récent (chute, accident)', group: 'contexte', species: [...CARN, 'cheval'], kw: ['fait une chute', 'après une chute', 'suite à une chute', 'est tombé', 'accident', 'renversé', 'percuté', 'heurté par une voiture', 'traumatisme', 'faux mouvement', 'en jouant', 'a sauté'] },
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
  hypertension: 'Hypertension artérielle (PAS ≥ 160 mmHg)',
  na_k_bas: 'Rapport Na/K < 27',
  ag_bas: 'Rapport albumine/globulines < 0,4',
};

export const signLabel = (id: string): string =>
  SIGNS.find((s) => s.id === id)?.label ?? LAB_FINDINGS[id] ?? id;

/** Éléments ajoutés automatiquement : saison du cas, toxique précisé à l'étape dédiée */
export const AUTO_SIGNS: Sign[] = [
  { id: 'printemps', label: 'Printemps', group: 'contexte', auto: true },
  { id: 'ete', label: 'Été', group: 'contexte', auto: true },
  { id: 'automne', label: 'Automne', group: 'contexte', auto: true },
  { id: 'hiver', label: 'Hiver', group: 'contexte', auto: true },
  { id: 'tox_avk', label: 'Raticide anticoagulant ingéré', group: 'contexte', auto: true },
  { id: 'tox_antigel', label: 'Antigel (éthylène glycol) ingéré', group: 'contexte', auto: true },
  { id: 'tox_op', label: 'Insecticide organophosphoré ou carbamate', group: 'contexte', auto: true },
  { id: 'tox_domestique', label: 'Toxique domestique identifié', group: 'contexte', auto: true },
  { id: 'tox_plomb', label: 'Source de plomb', group: 'contexte', auto: true },
  { id: 'tox_erable', label: 'Graines ou plantules d’érable sycomore', group: 'contexte', auto: true },
  { id: 'tox_senecon', label: 'Séneçon (foin, pâture)', group: 'contexte', auto: true },
  { id: 'tox_plante', label: 'Plante toxique', group: 'contexte', auto: true },
];
AUTO_SIGNS.forEach((x) => SIGNS.push(x));

/** Saison d'une date (hémisphère nord) */
export function seasonOf(t: number): 'printemps' | 'ete' | 'automne' | 'hiver' {
  const m = new Date(t).getMonth();
  return m >= 2 && m <= 4 ? 'printemps' : m >= 5 && m <= 7 ? 'ete' : m >= 8 && m <= 10 ? 'automne' : 'hiver';
}
export const SEASONS = ['printemps', 'ete', 'automne', 'hiver'];
