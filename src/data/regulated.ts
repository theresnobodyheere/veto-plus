// Maladies animales réglementées (mammifères) — règlement (UE) 2016/429 « Loi de santé animale »,
// catégorisation : règlement d'exécution (UE) 2018/1882 ; compléments nationaux (DGAL).
// A : éradication immédiate ; B : éradication obligatoire ; C : éradication volontaire ;
// D : mesures aux échanges ; E : surveillance. Toute suspicion de catégorie A/B se déclare sans délai.

export interface RegDisease { name: string; cat: string; species: string; action: string }

export const REGULATED: RegDisease[] = [
  { name: 'Fièvre aphteuse', cat: 'A', species: 'Ruminants, porcins', action: 'Suspicion : appel immédiat DDETSPP, aucun mouvement, biosécurité stricte.' },
  { name: 'Dermatose nodulaire contagieuse', cat: 'A', species: 'Bovins', action: 'Suspicion : appel immédiat DDETSPP. Foyers en France depuis 2025.' },
  { name: 'Peste porcine africaine / classique', cat: 'A', species: 'Porcins, sangliers', action: 'Suspicion : appel immédiat DDETSPP. Sanglier trouvé mort : réseau SAGIR (OFB / FDC).' },
  { name: 'Peste des petits ruminants', cat: 'A', species: 'Ovins, caprins', action: 'Suspicion : appel immédiat DDETSPP.' },
  { name: 'Clavelée et variole caprine', cat: 'A', species: 'Ovins, caprins', action: 'Suspicion : appel immédiat DDETSPP.' },
  { name: 'Péripneumonie contagieuse bovine', cat: 'A', species: 'Bovins', action: 'Suspicion : appel immédiat DDETSPP.' },
  { name: 'Fièvre de la vallée du Rift', cat: 'A', species: 'Ruminants', action: 'Suspicion : appel immédiat DDETSPP. Zoonose.' },
  { name: 'Peste équine / morve', cat: 'A', species: 'Équidés', action: 'Suspicion : appel immédiat DDETSPP.' },
  { name: 'Tuberculose (complexe M. tuberculosis)', cat: 'B', species: 'Bovins, caprins, faune (blaireau, sanglier, cervidés)', action: 'Déclaration obligatoire. Lésions à l’abattoir ou IDT positive : DDETSPP.' },
  { name: 'Brucellose', cat: 'B', species: 'Bovins, ovins, caprins, porcins', action: 'Tout avortement bovin doit être déclaré et prélevé (protocole départemental).' },
  { name: 'Rage', cat: 'B', species: 'Tous mammifères', action: 'Suspicion : DDETSPP. Morsure : protocole mordeur (3 visites), centre antirabique pour la personne.' },
  { name: 'Fièvre catarrhale ovine (FCO)', cat: 'C', species: 'Ruminants', action: 'Déclarer les suspicions cliniques selon les consignes nationales en vigueur (sérotypes 3, 8…).' },
  { name: 'IBR', cat: 'C', species: 'Bovins', action: 'Plan d’éradication via le GDS.' },
  { name: 'BVD', cat: 'C', species: 'Bovins', action: 'Plan d’éradication (boucles auriculaires de prélèvement) via le GDS.' },
  { name: 'Maladie d’Aujeszky', cat: 'C', species: 'Porcins (chiens sensibles)', action: 'Déclaration DDETSPP. Chiens de chasse : ne pas donner d’abats de sanglier crus.' },
  { name: 'Leucose bovine enzootique', cat: 'C', species: 'Bovins', action: 'Déclaration DDETSPP (lymphosarcome à l’abattoir).' },
  { name: 'Maladie hémorragique épizootique (MHE)', cat: 'D + E', species: 'Bovins, cervidés', action: 'Déclaration obligatoire des suspicions (DDETSPP).' },
  { name: 'Anémie infectieuse des équidés', cat: 'D + E', species: 'Équidés', action: 'Déclaration obligatoire ; isolement.' },
  { name: 'Charbon bactéridien', cat: 'D + E', species: 'Ruminants, équidés', action: 'Déclaration obligatoire. Ne pas autopsier ; équarrissage spécifique.' },
  { name: 'Artérite virale / métrite contagieuse équine', cat: 'D + E', species: 'Équidés reproducteurs', action: 'Déclaration DDETSPP ; arrêt de la monte.' },
  { name: 'Fièvre West Nile', cat: 'E', species: 'Équidés (oiseaux)', action: 'Déclaration obligatoire des cas cliniques.' },
  { name: 'Paratuberculose', cat: 'E', species: 'Ruminants', action: 'Surveillance, plans de maîtrise GDS.' },
  { name: 'Fièvre Q', cat: 'E', species: 'Ruminants', action: 'Surveillance ; protocole avortements (OSCAR / GDS). Zoonose.' },
  { name: 'EST : ESB, tremblante', cat: 'National', species: 'Bovins, ovins, caprins, cervidés', action: 'Déclaration obligatoire de toute suspicion ; ne pas euthanasier sans consigne.' },
];

export const CAT_HELP: Record<string, string> = {
  A: 'Maladie absente de l’UE, éradication immédiate',
  B: 'Éradication obligatoire dans tous les États membres',
  C: 'Éradication volontaire (programme national)',
  'D + E': 'Mesures aux mouvements + surveillance',
  E: 'Surveillance obligatoire',
  National: 'Réglementation nationale',
};
