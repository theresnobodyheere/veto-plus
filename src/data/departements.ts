// Départements français (code officiel INSEE) et régions. Liste nationale : le département choisi
// par le vétérinaire est enregistré uniquement sur l'iPhone (Réglages), jamais dans ce dépôt.

export type Region =
  | 'Auvergne-Rhône-Alpes' | 'Bourgogne-Franche-Comté' | 'Bretagne' | 'Centre-Val de Loire' | 'Corse'
  | 'Grand Est' | 'Hauts-de-France' | 'Île-de-France' | 'Normandie' | 'Nouvelle-Aquitaine' | 'Occitanie'
  | 'Pays de la Loire' | 'Provence-Alpes-Côte d’Azur' | 'Outre-mer';

export interface Departement { code: string; nom: string; region: Region }

const R: Record<string, Region> = {
  ara: 'Auvergne-Rhône-Alpes', bfc: 'Bourgogne-Franche-Comté', bre: 'Bretagne', cvl: 'Centre-Val de Loire', cor: 'Corse',
  ges: 'Grand Est', hdf: 'Hauts-de-France', idf: 'Île-de-France', nor: 'Normandie', naq: 'Nouvelle-Aquitaine', occ: 'Occitanie',
  pdl: 'Pays de la Loire', pac: 'Provence-Alpes-Côte d’Azur', om: 'Outre-mer',
};

const LIST: [string, string, keyof typeof R][] = [
  ['01', 'Ain', 'ara'], ['02', 'Aisne', 'hdf'], ['03', 'Allier', 'ara'], ['04', 'Alpes-de-Haute-Provence', 'pac'],
  ['05', 'Hautes-Alpes', 'pac'], ['06', 'Alpes-Maritimes', 'pac'], ['07', 'Ardèche', 'ara'], ['08', 'Ardennes', 'ges'],
  ['09', 'Ariège', 'occ'], ['10', 'Aube', 'ges'], ['11', 'Aude', 'occ'], ['12', 'Aveyron', 'occ'],
  ['13', 'Bouches-du-Rhône', 'pac'], ['14', 'Calvados', 'nor'], ['15', 'Cantal', 'ara'], ['16', 'Charente', 'naq'],
  ['17', 'Charente-Maritime', 'naq'], ['18', 'Cher', 'cvl'], ['19', 'Corrèze', 'naq'], ['2A', 'Corse-du-Sud', 'cor'],
  ['2B', 'Haute-Corse', 'cor'], ['21', 'Côte-d’Or', 'bfc'], ['22', 'Côtes-d’Armor', 'bre'], ['23', 'Creuse', 'naq'],
  ['24', 'Dordogne', 'naq'], ['25', 'Doubs', 'bfc'], ['26', 'Drôme', 'ara'], ['27', 'Eure', 'nor'],
  ['28', 'Eure-et-Loir', 'cvl'], ['29', 'Finistère', 'bre'], ['30', 'Gard', 'occ'], ['31', 'Haute-Garonne', 'occ'],
  ['32', 'Gers', 'occ'], ['33', 'Gironde', 'naq'], ['34', 'Hérault', 'occ'], ['35', 'Ille-et-Vilaine', 'bre'],
  ['36', 'Indre', 'cvl'], ['37', 'Indre-et-Loire', 'cvl'], ['38', 'Isère', 'ara'], ['39', 'Jura', 'bfc'],
  ['40', 'Landes', 'naq'], ['41', 'Loir-et-Cher', 'cvl'], ['42', 'Loire', 'ara'], ['43', 'Haute-Loire', 'ara'],
  ['44', 'Loire-Atlantique', 'pdl'], ['45', 'Loiret', 'cvl'], ['46', 'Lot', 'occ'], ['47', 'Lot-et-Garonne', 'naq'],
  ['48', 'Lozère', 'occ'], ['49', 'Maine-et-Loire', 'pdl'], ['50', 'Manche', 'nor'], ['51', 'Marne', 'ges'],
  ['52', 'Haute-Marne', 'ges'], ['53', 'Mayenne', 'pdl'], ['54', 'Meurthe-et-Moselle', 'ges'], ['55', 'Meuse', 'ges'],
  ['56', 'Morbihan', 'bre'], ['57', 'Moselle', 'ges'], ['58', 'Nièvre', 'bfc'], ['59', 'Nord', 'hdf'],
  ['60', 'Oise', 'hdf'], ['61', 'Orne', 'nor'], ['62', 'Pas-de-Calais', 'hdf'], ['63', 'Puy-de-Dôme', 'ara'],
  ['64', 'Pyrénées-Atlantiques', 'naq'], ['65', 'Hautes-Pyrénées', 'occ'], ['66', 'Pyrénées-Orientales', 'occ'], ['67', 'Bas-Rhin', 'ges'],
  ['68', 'Haut-Rhin', 'ges'], ['69', 'Rhône', 'ara'], ['70', 'Haute-Saône', 'bfc'], ['71', 'Saône-et-Loire', 'bfc'],
  ['72', 'Sarthe', 'pdl'], ['73', 'Savoie', 'ara'], ['74', 'Haute-Savoie', 'ara'], ['75', 'Paris', 'idf'],
  ['76', 'Seine-Maritime', 'nor'], ['77', 'Seine-et-Marne', 'idf'], ['78', 'Yvelines', 'idf'], ['79', 'Deux-Sèvres', 'naq'],
  ['80', 'Somme', 'hdf'], ['81', 'Tarn', 'occ'], ['82', 'Tarn-et-Garonne', 'occ'], ['83', 'Var', 'pac'],
  ['84', 'Vaucluse', 'pac'], ['85', 'Vendée', 'pdl'], ['86', 'Vienne', 'naq'], ['87', 'Haute-Vienne', 'naq'],
  ['88', 'Vosges', 'ges'], ['89', 'Yonne', 'bfc'], ['90', 'Territoire de Belfort', 'bfc'], ['91', 'Essonne', 'idf'],
  ['92', 'Hauts-de-Seine', 'idf'], ['93', 'Seine-Saint-Denis', 'idf'], ['94', 'Val-de-Marne', 'idf'], ['95', 'Val-d’Oise', 'idf'],
  ['971', 'Guadeloupe', 'om'], ['972', 'Martinique', 'om'], ['973', 'Guyane', 'om'], ['974', 'La Réunion', 'om'], ['976', 'Mayotte', 'om'],
];

export const DEPARTEMENTS: Departement[] = LIST.map(([code, nom, r]) => ({ code, nom, region: R[r] }));

export function departementByCode(code?: string | null): Departement | undefined {
  return code ? DEPARTEMENTS.find((d) => d.code === code) : undefined;
}

/** Recherche de la DDPP / DDETSPP du département dans l'annuaire officiel de l'administration */
export function annuaireUrl(d: Departement): string {
  return `https://lannuaire.service-public.gouv.fr/recherche?whoWhat=${encodeURIComponent('protection des populations')}&where=${encodeURIComponent(d.nom)}`;
}
