// Intoxications guidées : toxique précisé, délai depuis l'exposition, conduite à tenir.
// Sources : Merck Veterinary Manual (Toxicology) ; Plumb's Veterinary Drug Handbook ; CNITV (Lyon) ;
// Gwaltney-Brant, Small Animal Toxicology ; Smith pour les grands animaux. À faire valider par le vétérinaire.
import type { Family } from './wizard';

export interface Toxic {
  id: string;
  label: string;
  /** Familles concernées */
  fam: Family[];
  /** Éléments ajoutés au diagnostic */
  signs: string[];
  /** Organe cible, signes attendus et délai d'apparition */
  effect: string;
  /** Antidote ou traitement spécifique */
  antidote: string;
  /** Faire vomir est contre-indiqué (caustique, convulsions, toxique déjà absorbé) */
  noEmesis?: boolean;
}

export const TOXICS: Toxic[] = [
  { id: 'avk', label: 'Raticide anticoagulant', fam: ['carn', 'equ', 'porc'], signs: ['tox_avk'],
    effect: 'Saignements retardés de 3 à 5 jours (hémothorax, hématomes, épistaxis).',
    antidote: 'Vitamine K1 par voie orale, 3 à 6 semaines selon la molécule ; temps de Quick 48 à 72 h après l’arrêt.' },
  { id: 'antigel', label: 'Antigel (éthylène glycol)', fam: ['carn'], signs: ['tox_antigel'],
    effect: 'Ébriété dans l’heure, puis insuffisance rénale aiguë en 24 à 72 h (cristaux d’oxalate de calcium).',
    antidote: 'Fomépizole ou éthanol IV : efficace seulement avant 8 h chez le chien, 3 h chez le chat.' },
  { id: 'metaldehyde', label: 'Anti-limaces (métaldéhyde)', fam: ['carn'], signs: ['tox_domestique'], noEmesis: true,
    effect: 'Tremblements, hyperthermie et convulsions en 1 à 3 h.',
    antidote: 'Pas d’antidote : contrôle des convulsions (diazépam, propofol), refroidissement, lavage gastrique sous anesthésie.' },
  { id: 'chocolat', label: 'Chocolat (théobromine)', fam: ['carn'], signs: ['tox_domestique'],
    effect: 'Vomissements, agitation, tachycardie et arythmies, convulsions ; effet prolongé (24 à 72 h).',
    antidote: 'Pas d’antidote : charbon activé répété, perfusion, ECG ; vidange gastrique utile jusqu’à 4 à 6 h.' },
  { id: 'xylitol', label: 'Xylitol (chewing-gum, pâtisserie)', fam: ['carn'], signs: ['tox_domestique'],
    effect: 'Chien : hypoglycémie en 30 à 60 min, insuffisance hépatique en 24 à 72 h.',
    antidote: 'Glycémie répétée, glucose IV ; bilan hépatique. Le charbon activé est inefficace.' },
  { id: 'raisin', label: 'Raisin, raisins secs', fam: ['carn'], signs: ['tox_domestique'],
    effect: 'Chien : insuffisance rénale aiguë en 24 à 72 h, sans relation nette avec la dose.',
    antidote: 'Pas d’antidote : vomissement, charbon activé, perfusion 48 à 72 h, créatinine à J0, J1 et J3.' },
  { id: 'ains', label: 'AINS ou paracétamol humains', fam: ['carn'], signs: ['tox_domestique', 'ains_cortico'],
    effect: 'AINS : ulcère digestif, insuffisance rénale. Paracétamol (chat surtout) : méthémoglobinémie, œdème de la face.',
    antidote: 'Paracétamol : N-acétylcystéine. AINS : protecteurs gastriques, perfusion, fonction rénale à 24 et 48 h.' },
  { id: 'permethrine', label: 'Perméthrine (antiparasitaire pour chien) chez le chat', fam: ['carn'], signs: ['tox_domestique'], noEmesis: true,
    effect: 'Chat : tremblements, hyperesthésie, convulsions dans les heures qui suivent l’application.',
    antidote: 'Pas d’antidote : lavage au liquide vaisselle et à l’eau tiède, méthocarbamol ou diazépam, émulsion lipidique IV, maintien au chaud.' },
  { id: 'lys', label: 'Lys (chat)', fam: ['carn'], signs: ['tox_domestique', 'tox_plante'],
    effect: 'Chat : insuffisance rénale aiguë en 24 à 72 h ; toute la plante, pollen et eau du vase.',
    antidote: 'Pas d’antidote : vomissement, charbon activé, perfusion 48 h, créatinine répétée.' },
  { id: 'op', label: 'Insecticide organophosphoré ou carbamate', fam: ['carn', 'rum', 'equ', 'porc'], signs: ['tox_op'],
    effect: 'Ptyalisme, myosis, tremblements, diarrhée, bradycardie, détresse respiratoire.',
    antidote: 'Atropine jusqu’à disparition du ptyalisme ; pralidoxime précoce (organophosphorés) ; lavage cutané.' },
  { id: 'plomb', label: 'Plomb (batteries, peintures, huiles de vidange)', fam: ['rum', 'equ', 'carn'], signs: ['tox_plomb'],
    effect: 'Cécité, convulsions, pousser au mur ; jeunes bovins surtout.',
    antidote: 'Chélation (EDTA calcique), thiamine. Animaux de rente : lait et viande non commercialisables, prévenir la DDETSPP.' },
  { id: 'if', label: 'If (taxine)', fam: ['rum', 'equ'], signs: ['tox_plante'],
    effect: 'Cardiotoxique : bradycardie, arythmie, mort subite souvent sans signe préalable.',
    antidote: 'Pas d’antidote : charbon activé, atropine si bradycardie, calme absolu. Rechercher les branches accessibles.' },
  { id: 'gland', label: 'Glands, feuilles de chêne', fam: ['rum', 'equ'], signs: ['tox_plante'],
    effect: 'Tanins : constipation puis diarrhée hémorragique, insuffisance rénale (automne).',
    antidote: 'Pas d’antidote : retirer de la parcelle, perfusion, fonction rénale.' },
  { id: 'erable', label: 'Érable sycomore (graines, plantules)', fam: ['equ'], signs: ['tox_erable'],
    effect: 'Hypoglycine A : myopathie atypique (urines foncées, décubitus), automne et printemps.',
    antidote: 'Pas d’antidote : retirer de la pâture tout le groupe, perfusion glucosée, soins intensifs ; mortalité élevée.' },
  { id: 'senecon', label: 'Séneçon (foin, pâture)', fam: ['equ', 'rum'], signs: ['tox_senecon'],
    effect: 'Alcaloïdes pyrrolizidiniques : insuffisance hépatique chronique (amaigrissement, ictère, troubles nerveux).',
    antidote: 'Pas d’antidote : retirer la source (foin compris), pronostic réservé si signes nerveux.' },
  { id: 'ionophore', label: 'Monensin, ionophores (aliment de bovins)', fam: ['equ'], signs: ['tox_plante'],
    effect: 'Cheval très sensible : nécrose myocardique, sueurs, coliques, mort subite.',
    antidote: 'Pas d’antidote : charbon activé, repos strict, troponine et échocardiographie.' },
  { id: 'nitrates', label: 'Nitrates, nitrites (engrais, betteraves, eau)', fam: ['rum'], signs: ['tox_plante'],
    effect: 'Méthémoglobinémie : muqueuses brun chocolat, dyspnée, mort rapide.',
    antidote: 'Bleu de méthylène IV lent.' },
  { id: 'inconnu', label: 'Inconnu, autre', fam: ['carn', 'rum', 'equ', 'porc'], signs: [],
    effect: 'Identifier le produit (emballage, étiquette), la quantité et l’heure.',
    antidote: 'Appeler le CNITV : conduite à tenir selon le toxique.' },
];

export const toxicById = (id?: string) => TOXICS.find((t) => t.id === id);

/** Conseil selon le délai depuis l'exposition */
export function decontamination(t: Toxic, delay: string | undefined, fam: Family): string | undefined {
  if (fam !== 'carn') return delay === 'h2' ? 'Exposition récente : charbon activé par sonde selon le toxique.' : undefined;
  if (t.noEmesis) return 'Ne pas faire vomir : risque de convulsions ou de fausse déglutition.';
  if (delay === 'h2') return 'Moins de 2 h : faire vomir si l’animal est conscient et sans convulsions (chien : apomorphine ; chat : dexmédétomidine ou xylazine), puis charbon activé.';
  if (delay === 'h6') return '2 à 6 h : vomissement encore utile pour certains toxiques (chocolat, raisin) ; charbon activé.';
  if (delay === 'plus') return 'Plus de 6 h : traitement symptomatique et surveillance des organes cibles.';
  return undefined;
}
