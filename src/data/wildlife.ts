// Faune du parc animalier et primates : zoonoses, maladies à surveiller, points de sécurité.
// Sources : Fowler's Zoo and Wild Animal Medicine ; EAZWV Transmissible Diseases Handbook ;
// CDC — B virus (Macacine herpesvirus 1) ; Plateforme ESA (Sylvatub, SAGIR).

export interface WildCard {
  id: string;
  title: string;
  zoonoses: string[];
  watch: string[];
  safety: string[];
}

export const HERPES_B_PROTOCOL = [
  'Dans les 5 minutes : laver la plaie (morsure, griffure, piqûre) à l’eau et au savon ou détergent, ou à la povidone iodée / chlorhexidine, pendant 15 minutes.',
  'Projection dans les yeux ou sur une muqueuse : rincer 15 minutes à l’eau ou au sérum physiologique.',
  'Puis consultation médicale immédiate (SAMU 15 ou urgences) en précisant « exposition à un macaque, risque herpèsvirus B ». La prophylaxie antivirale est décidée par le médecin.',
  'Noter l’animal en cause, l’heure, le type de blessure ; l’évaluation de l’animal (prélèvements) se fait sur avis spécialisé.',
  'Symptômes dans les semaines suivantes (vésicules au point d’exposition, fièvre, céphalées, engourdissement) : reconsulter en urgence.',
];

export const WILDLIFE: WildCard[] = [
  {
    id: 'macaque', title: 'Magots (Macaca sylvanus)',
    zoonoses: ['Herpèsvirus B : tout macaque est considéré porteur potentiel, risque MORTEL pour l’humain', 'Tuberculose (transmission dans les deux sens soigneur ↔ singe)', 'Shigellose, salmonellose, campylobactériose', 'Parasites : Balantidium, Giardia, Strongyloides', 'Rage (risque faible en parc fermé)'],
    watch: ['Diarrhée collective (entérites bactériennes)', 'Amaigrissement, toux chronique (tuberculose : intradermo des soigneurs et des animaux)', 'Morsures intra-groupe, abcès', 'Diabète et obésité chez les animaux âgés', 'Gestation et mise bas (saison de naissance : printemps-été)'],
    safety: ['Gants, lunettes ou visière, masque pour toute manipulation', 'Anesthésie à distance avant contact', 'Trousse « exposition herpès B » accessible (savon, povidone iodée, sérum physiologique)'],
  },
  {
    id: 'ours', title: 'Ours brun',
    zoonoses: ['Trichinellose (viande)', 'Échinococcose', 'Salmonellose'],
    watch: ['Problèmes dentaires et parodontaux (âge)', 'Arthrose', 'Obésité, préparation à l’hivernage', 'Hépatite de Rubarth (adénovirus canin)'],
    safety: ['Anesthésie à distance obligatoire ; ne jamais approcher un ours non endormi', 'Intervalles de référence : approximation canine, à interpréter avec prudence'],
  },
  {
    id: 'canides', title: 'Loup, lynx, renard',
    zoonoses: ['Échinococcose alvéolaire (renard, loup) : gants, lavage des mains', 'Rage', 'Leptospirose', 'Gale sarcoptique'],
    watch: ['Maladie de Carré, parvovirose (vaccination avec vaccins inactivés ou recombinants selon l’espèce)', 'Leishmaniose (loup)', 'Traumatismes intra-meute'],
    safety: ['Contention chimique, muselière, gants épais', 'Intervalles de référence : chien (loup, renard) / chat (lynx)'],
  },
  {
    id: 'bison', title: 'Bison d’Europe',
    zoonoses: ['Tuberculose', 'Brucellose', 'Fièvre Q', 'Leptospirose'],
    watch: ['Balanoposthite du bison', 'FCO, MHE (vaccination FCO possible)', 'Fièvre catarrhale maligne (contact avec ovins/caprins)', 'Parasitisme digestif, fasciolose', 'Paratuberculose'],
    safety: ['Animaux très dangereux : couloir de contention ou téléanesthésie', 'Intervalles de référence : approximation bovine'],
  },
  {
    id: 'cervides', title: 'Cervidés (cerf, daim, chevreuil)',
    zoonoses: ['Tuberculose (réservoir sauvage dans certaines zones)', 'Fièvre Q', 'Leptospirose'],
    watch: ['MHE et FCO (fièvre, œdèmes, hémorragies)', 'Maladie du dépérissement chronique (EST) : surveillance européenne', 'Myopathie de capture (stress, CK ↑↑)', 'Parasitisme (strongles, douves)'],
    safety: ['Limiter la durée de contention (myopathie de capture)', 'Bois : danger en période de rut'],
  },
  {
    id: 'bouquetin', title: 'Bouquetin, chamois, mouflon',
    zoonoses: ['Brucellose (foyers chez le bouquetin dans les Alpes)', 'Ecthyma contagieux', 'Fièvre Q'],
    watch: ['Kératoconjonctivite infectieuse (mycoplasmes)', 'Pestivirose (border disease)', 'Gale sarcoptique', 'Parasitisme pulmonaire'],
    safety: ['Approximation caprine pour les intervalles', 'Myopathie de capture'],
  },
  {
    id: 'sanglier', title: 'Sanglier',
    zoonoses: ['Trichinellose (viande crue ou peu cuite)', 'Brucellose (B. suis)', 'Tuberculose', 'Hépatite E', 'Leptospirose'],
    watch: ['PESTE PORCINE AFRICAINE : tout sanglier trouvé mort se signale (SAGIR)', 'Maladie d’Aujeszky (risque mortel pour les chiens)', 'Parasitisme'],
    safety: ['Gants, pas de contact avec les abats pour les chiens', 'Intervalles de référence : approximation porcine'],
  },
];
