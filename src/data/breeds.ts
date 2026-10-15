// Races courantes en France, par espèce : proposées à la saisie.
// « large » : chien de grande race à thorax profond (repère du signe « grand_chien », ex. dilatation-torsion de l'estomac).
import type { SpeciesId } from './species';
import { hasPhrase, norm } from '../engine/textSigns';

export interface Breed {
  name: string;
  /** Autres façons de l'écrire ou de la dire */
  kw?: string[];
  large?: boolean;
}

const DOGS: Breed[] = [
  // Grandes races, thorax profond
  { name: 'Dogue allemand', kw: ['grand danois'], large: true },
  { name: 'Saint-Bernard', kw: ['saint bernard'], large: true },
  { name: 'Braque de Weimar', kw: ['weimaraner', 'weimar'], large: true },
  { name: 'Braque allemand', kw: ['braque'], large: true },
  { name: 'Setter irlandais', kw: ['irish setter'], large: true },
  { name: 'Setter anglais', kw: ['english setter'], large: true },
  { name: 'Setter Gordon', kw: ['gordon'], large: true },
  { name: 'Berger allemand', large: true },
  { name: 'Berger belge (Malinois)', kw: ['malinois', 'berger belge', 'tervueren', 'groenendael'], large: true },
  { name: 'Beauceron', large: true },
  { name: 'Dobermann', kw: ['doberman'], large: true },
  { name: 'Rottweiler', kw: ['rottweil'], large: true },
  { name: 'Bouvier bernois', kw: ['bernois'], large: true },
  { name: 'Bouvier des Flandres', large: true },
  { name: 'Terre-neuve', kw: ['terre neuve', 'terreneuve'], large: true },
  { name: 'Leonberg', kw: ['leonberger'], large: true },
  { name: 'Montagne des Pyrénées', kw: ['patou', 'chien des pyrenees'], large: true },
  { name: 'Dogue de Bordeaux', large: true },
  { name: 'Mâtin de Naples', kw: ['matin napolitain'], large: true },
  { name: 'Cane corso', large: true },
  { name: 'Mastiff', kw: ['bullmastiff'], large: true },
  { name: 'Lévrier', kw: ['greyhound', 'levrier', 'barzoi', 'whippet', 'sloughi', 'galgo'], large: true },
  { name: 'Irish wolfhound', kw: ['levrier irlandais'], large: true },
  { name: 'Akita', kw: ['akita inu'], large: true },
  { name: 'Caniche royal', large: true },
  { name: 'Labrador', kw: ['labrador retriever'], large: true },
  { name: 'Golden retriever', kw: ['golden'], large: true },
  { name: 'Boxer', large: true },
  { name: 'Malamute', kw: ['malamute de l alaska'], large: true },
  // Autres races
  { name: 'Husky', kw: ['husky siberien'] },
  { name: 'Berger australien', kw: ['aussie'] },
  { name: 'Border collie', kw: ['border'] },
  { name: 'Berger blanc suisse' },
  { name: 'Épagneul breton', kw: ['breton'] },
  { name: 'Cocker', kw: ['cocker spaniel'] },
  { name: 'Springer', kw: ['springer spaniel'] },
  { name: 'Beagle' },
  { name: 'Basset', kw: ['basset hound'] },
  { name: 'Griffon' },
  { name: 'Teckel', kw: ['dachshund'] },
  { name: 'Jack Russell', kw: ['jack russel', 'jack'] },
  { name: 'Fox terrier', kw: ['fox'] },
  { name: 'Yorkshire', kw: ['yorkshire terrier', 'yorki', 'yorkie'] },
  { name: 'West Highland', kw: ['westie'] },
  { name: 'Cairn terrier', kw: ['cairn'] },
  { name: 'Bull terrier' },
  { name: 'Staffordshire', kw: ['staffie', 'staff', 'american staff', 'amstaff'] },
  { name: 'Bouledogue français', kw: ['bouledogue', 'bulldog francais'] },
  { name: 'Bulldog anglais', kw: ['bulldog'] },
  { name: 'Carlin', kw: ['pug'] },
  { name: 'Shih tzu', kw: ['shih tsu', 'shitzu'] },
  { name: 'Lhassa apso', kw: ['lhasa apso'] },
  { name: 'Pékinois', kw: ['pekinois'] },
  { name: 'Cavalier King Charles', kw: ['cavalier', 'king charles'] },
  { name: 'Chihuahua' },
  { name: 'Bichon', kw: ['bichon frise', 'bichon maltais', 'maltais'] },
  { name: 'Coton de Tuléar', kw: ['coton de tulear'] },
  { name: 'Caniche', kw: ['caniche nain', 'caniche toy'] },
  { name: 'Schnauzer' },
  { name: 'Spitz', kw: ['loulou de pomeranie', 'pomeranien'] },
  { name: 'Shiba', kw: ['shiba inu'] },
  { name: 'Pinscher' },
  { name: 'Shar-pei', kw: ['shar pei', 'sharpei'] },
  { name: 'Chow-chow', kw: ['chow chow'] },
];

const CATS: Breed[] = [
  { name: 'Européen', kw: ['europeen', 'gouttiere', 'chat de gouttiere'] },
  { name: 'Persan' }, { name: 'Exotic shorthair', kw: ['exotic'] }, { name: 'Maine coon' },
  { name: 'Siamois' }, { name: 'Oriental' }, { name: 'Sacré de Birmanie', kw: ['birman', 'sacre de birmanie'] },
  { name: 'British shorthair', kw: ['british'] }, { name: 'Chartreux' }, { name: 'Bengal' }, { name: 'Ragdoll' },
  { name: 'Norvégien', kw: ['chat des forets norvegiennes', 'norvegien'] }, { name: 'Sphynx' },
  { name: 'Scottish fold', kw: ['scottish'] }, { name: 'Abyssin' }, { name: 'Devon rex' }, { name: 'Bleu russe' },
];

const CATTLE: Breed[] = [
  { name: 'Prim’Holstein', kw: ['holstein', 'prim holstein'] }, { name: 'Montbéliarde', kw: ['montbeliarde'] },
  { name: 'Normande' }, { name: 'Brune', kw: ['brune des alpes'] }, { name: 'Simmental' }, { name: 'Jersiaise', kw: ['jersey'] },
  { name: 'Pie rouge', kw: ['pie rouge des plaines'] }, { name: 'Abondance' }, { name: 'Tarentaise', kw: ['tarine'] },
  { name: 'Charolaise', kw: ['charolais'] }, { name: 'Limousine', kw: ['limousin'] }, { name: 'Blonde d’Aquitaine', kw: ['blonde'] },
  { name: 'Salers' }, { name: 'Aubrac' }, { name: 'Parthenaise' }, { name: 'Rouge des prés', kw: ['maine anjou'] },
  { name: 'Bazadaise' }, { name: 'Gasconne' }, { name: 'Highland', kw: ['highland cattle'] }, { name: 'Angus', kw: ['aberdeen angus'] },
  { name: 'Hereford' }, { name: 'Bleue du Nord', kw: ['blanc bleu', 'bbb'] },
];

const SHEEP: Breed[] = [
  { name: 'Lacaune' }, { name: 'Manech', kw: ['manech tete rousse', 'manech tete noire'] }, { name: 'Basco-béarnaise', kw: ['basco bearnaise'] },
  { name: 'Île-de-France', kw: ['ile de france'] }, { name: 'Texel' }, { name: 'Suffolk' }, { name: 'Charollais' },
  { name: 'Mérinos', kw: ['merinos d arles'] }, { name: 'Rouge de l’Ouest' }, { name: 'Vendéen', kw: ['vendeen'] },
  { name: 'Romane', kw: ['inra 401'] }, { name: 'Préalpes', kw: ['prealpes du sud'] }, { name: 'Ouessant' }, { name: 'Solognote' },
];

const GOATS: Breed[] = [
  { name: 'Alpine', kw: ['alpine chamoisee'] }, { name: 'Saanen' }, { name: 'Poitevine' }, { name: 'Angora' },
  { name: 'Boer' }, { name: 'Chèvre des Pyrénées', kw: ['pyreneenne'] }, { name: 'Rove' }, { name: 'Naine', kw: ['chevre naine'] },
];

const HORSES: Breed[] = [
  { name: 'Pur-sang', kw: ['pur sang', 'pur sang anglais'] }, { name: 'Pur-sang arabe', kw: ['arabe'] }, { name: 'Anglo-arabe', kw: ['anglo arabe'] },
  { name: 'Trotteur français', kw: ['trotteur'] }, { name: 'Selle français' }, { name: 'Quarter horse', kw: ['quarter'] },
  { name: 'Paint horse', kw: ['paint'] }, { name: 'Appaloosa' }, { name: 'Lusitanien', kw: ['lusitano'] }, { name: 'Pure race espagnole', kw: ['andalou'] },
  { name: 'Frison', kw: ['friesian'] }, { name: 'Camargue' }, { name: 'Mérens', kw: ['merens'] }, { name: 'Islandais' },
  { name: 'Percheron' }, { name: 'Breton', kw: ['trait breton'] }, { name: 'Comtois' }, { name: 'Ardennais' }, { name: 'Cheval de trait', kw: ['trait lourd'] },
  { name: 'Haflinger' }, { name: 'Connemara' }, { name: 'Welsh' }, { name: 'Shetland' }, { name: 'Poney français de selle', kw: ['poney'] },
  { name: 'Âne', kw: ['ane', 'anesse', 'baudet'] }, { name: 'Mule', kw: ['mulet'] },
];

const PIGS: Breed[] = [
  { name: 'Large white' }, { name: 'Landrace' }, { name: 'Piétrain', kw: ['pietrain'] }, { name: 'Duroc' },
  { name: 'Porc basque', kw: ['pie noir du pays basque', 'kintoa'] }, { name: 'Porc gascon', kw: ['gascon', 'noir de bigorre'] },
  { name: 'Porc blanc de l’Ouest', kw: ['blanc de l ouest'] }, { name: 'Vietnamien', kw: ['cochon vietnamien'] }, { name: 'Mini-pig', kw: ['minipig', 'mini pig', 'cochon nain'] },
];

const BREEDS: Partial<Record<SpeciesId, Breed[]>> = {
  chien: DOGS, chat: CATS, bovin: CATTLE, ovin: SHEEP, caprin: GOATS, cheval: HORSES, porc: PIGS,
};

export const breedsFor = (species: SpeciesId): Breed[] => BREEDS[species] ?? [];

/** Race connue correspondant à une saisie libre (« setter anglais », « Labrador croisé ») */
export function breedByName(species: SpeciesId, name?: string): Breed | undefined {
  const n = name?.trim().replace(/\s+crois[ée]e?$/i, '');
  if (!n) return undefined;
  return breedsFor(species).find((b) => [b.name, ...(b.kw ?? [])].some((k) => norm(k) === norm(n)))
    ?? breedsFor(species).find((b) => [b.name, ...(b.kw ?? [])].some((k) => hasPhrase(n, k)));
}
