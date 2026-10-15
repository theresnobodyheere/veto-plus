// Intervalles de référence, adultes, unités SI (unités canoniques de analytes.ts).
// Sources : Merck Veterinary Manual — Reference Guides (Hematologic & Serum Biochemical Reference Ranges) ;
// Kaneko, Harvey & Bruss, Clinical Biochemistry of Domestic Animals, 6e éd. ; intervalles constructeurs
// usuels (IDEXX Catalyst / ProCyte) pour chien et chat. Pression artérielle : consensus ACVIM 2018 (Acierno et al.).
// IMPORTANT : chaque laboratoire et chaque automate a ses propres intervalles. Le vétérinaire peut les
// remplacer dans Réglages → Intervalles de la clinique ; ses valeurs sont alors prioritaires.

import type { SpeciesId } from './species';

export type Range = [number, number];
export type RangeTable = Partial<Record<string, Range>>;

export const RANGE_SOURCES: Partial<Record<SpeciesId, string>> = {
  chien: 'Merck Vet Manual ; IDEXX (chien adulte)',
  chat: 'Merck Vet Manual ; IDEXX (chat adulte)',
  bovin: 'Merck Vet Manual ; Kaneko 6e éd. (bovin adulte)',
  ovin: 'Merck Vet Manual ; Kaneko 6e éd. (ovin adulte)',
  caprin: 'Merck Vet Manual ; Kaneko 6e éd. (caprin adulte)',
  cheval: 'Merck Vet Manual ; Kaneko 6e éd. (cheval adulte)',
  porc: 'Merck Vet Manual ; Kaneko 6e éd. (porc)',
  macaque: 'Littérature primatologique (Macaca mulatta / fascicularis), valeurs indicatives — à valider',
};

export const RANGES: Partial<Record<SpeciesId, RangeTable>> = {
  chien: {
    ht: [37, 55], hb: [120, 180], gr: [5.5, 8.5], vgm: [60, 77], ccmh: [32, 36], retic: [10, 110],
    gb: [6, 17], neutro: [3, 11.5], lympho: [1, 4.8], mono: [0.15, 1.35], eosino: [0.1, 1.25], plaq: [175, 500],
    fibri: [2, 4],
    glu: [3.9, 7.5], uree: [2.5, 9.6], crea: [44, 140], sdma: [0, 14], pt: [52, 76], alb: [23, 40], glob: [25, 45],
    alat: [10, 125], pal: [20, 210], ggt: [0, 11], asat: [0, 50], ck: [10, 200], bili: [0, 15], ab: [0, 15],
    chol: [2.8, 8.3], tg: [0.1, 1.2], lipase: [24, 140], amyl: [500, 1500], lact: [0.5, 2.5], fructo: [225, 365],
    na: [144, 160], k: [3.5, 5.8], cl: [109, 122], ca: [2.0, 3.0], cai: [1.18, 1.40], p: [0.8, 2.2], mg: [0.7, 1.0],
    hco3: [17, 24], ph: [7.31, 7.42], pco2: [32, 44], t4: [13, 51], du: [1.015, 1.045], rpcu: [0, 0.5], pas: [90, 140],
  },
  chat: {
    ht: [30, 45], hb: [90, 150], gr: [5, 10], vgm: [39, 55], ccmh: [30, 36], retic: [3, 50],
    gb: [5.5, 19.5], neutro: [2.5, 12.5], lympho: [1.5, 7], mono: [0, 0.85], eosino: [0, 1.5], plaq: [300, 800],
    fibri: [1, 3],
    glu: [3.9, 8.3], uree: [5.7, 12.9], crea: [71, 212], sdma: [0, 14], pt: [57, 89], alb: [22, 40], glob: [28, 51],
    alat: [12, 130], pal: [14, 111], ggt: [0, 4], asat: [0, 48], ck: [50, 450], bili: [0, 15], ab: [0, 10],
    chol: [1.7, 5.8], tg: [0.1, 1.1], lipase: [8, 26], amyl: [500, 1500], lact: [0.5, 2.5], fructo: [190, 350],
    na: [150, 165], k: [3.5, 5.8], cl: [112, 129], ca: [1.95, 2.83], cai: [1.10, 1.40], p: [1.0, 2.4], mg: [0.7, 1.1],
    hco3: [16, 25], ph: [7.31, 7.41], pco2: [30, 40], t4: [10, 60], du: [1.035, 1.060], rpcu: [0, 0.4], pas: [90, 140],
  },
  bovin: {
    ht: [24, 46], hb: [80, 150], gr: [5, 10], vgm: [40, 60], ccmh: [30, 36],
    gb: [4, 12], neutro: [0.6, 4], lympho: [2.5, 7.5], mono: [0.03, 0.84], eosino: [0, 2.4], plaq: [100, 800],
    fibri: [2, 7],
    glu: [2.5, 4.2], uree: [2.8, 8.8], crea: [88, 177], pt: [60, 80], alb: [25, 38], glob: [30, 50],
    asat: [60, 125], ggt: [6, 30], gldh: [0, 30], ck: [35, 280], pal: [0, 250], bili: [0.2, 8.6], chol: [1.5, 6.0],
    lact: [0.5, 2.2], bhb: [0, 1.2], agne: [0, 0.7],
    na: [132, 152], k: [3.9, 5.8], cl: [97, 111], ca: [2.1, 2.8], cai: [1.06, 1.26], p: [1.4, 2.6], mg: [0.74, 1.10],
    hco3: [20, 30], ph: [7.35, 7.50], pco2: [35, 45],
  },
  ovin: {
    ht: [27, 45], hb: [90, 150], gr: [9, 15], vgm: [28, 40], ccmh: [31, 34],
    gb: [4, 12], neutro: [0.7, 6], lympho: [2, 9], mono: [0, 0.75], eosino: [0, 1], plaq: [250, 750],
    fibri: [1, 5],
    glu: [2.8, 4.4], uree: [2.9, 7.1], crea: [106, 168], pt: [60, 79], alb: [24, 30], glob: [35, 57],
    asat: [60, 280], ggt: [20, 52], gldh: [0, 20], ck: [0, 200], bili: [1.7, 7.2], chol: [1.3, 2.0],
    lact: [0.5, 2.2], bhb: [0, 0.8], agne: [0, 0.4],
    na: [139, 152], k: [3.9, 5.4], cl: [95, 103], ca: [2.1, 2.9], p: [1.6, 2.4], mg: [0.9, 1.3],
    hco3: [21, 28],
  },
  caprin: {
    ht: [22, 38], hb: [80, 120], gr: [8, 18], vgm: [16, 25], ccmh: [30, 36],
    gb: [4, 13], neutro: [1.2, 7.2], lympho: [2, 9], mono: [0, 0.55], eosino: [0.05, 0.65], plaq: [300, 600],
    fibri: [1, 4],
    glu: [2.8, 4.2], uree: [3.6, 10.0], crea: [88, 159], pt: [60, 75], alb: [27, 39], glob: [27, 41],
    asat: [60, 280], ggt: [20, 56], gldh: [0, 20], ck: [0, 200], bili: [0, 7], chol: [1.6, 3.4],
    lact: [0.5, 2.2], bhb: [0, 0.8], agne: [0, 0.4],
    na: [142, 155], k: [3.5, 6.7], cl: [99, 110], ca: [2.2, 2.9], p: [1.4, 2.9], mg: [1.1, 1.5],
    hco3: [21, 28],
  },
  cheval: {
    ht: [32, 53], hb: [110, 190], gr: [6.8, 12.9], vgm: [37, 58], ccmh: [31, 39],
    gb: [5.4, 14.3], neutro: [2.3, 8.6], lympho: [1.5, 7.7], mono: [0, 1], eosino: [0, 1], plaq: [100, 350],
    fibri: [1, 4], saa: [0, 20],
    glu: [4.2, 6.4], uree: [3.6, 8.6], crea: [88, 177], pt: [52, 79], alb: [26, 37], glob: [26, 40],
    asat: [150, 450], ggt: [5, 40], gldh: [0, 12], ck: [50, 400], pal: [140, 400], bili: [7, 34], ab: [0, 20],
    tg: [0.1, 0.6], lact: [0.5, 2.0],
    na: [128, 142], k: [2.9, 4.6], cl: [97, 105], ca: [2.6, 3.3], cai: [1.4, 1.7], p: [0.9, 1.7], mg: [0.7, 1.0],
    hco3: [24, 32], ph: [7.32, 7.44], pco2: [38, 46],
  },
  porc: {
    ht: [32, 50], hb: [100, 160], gr: [5, 8], vgm: [50, 68], ccmh: [30, 34],
    gb: [11, 22], neutro: [3, 10.5], lympho: [4, 13.5], mono: [0.2, 2.2], eosino: [0.05, 2], plaq: [200, 500],
    fibri: [1, 5],
    glu: [4.7, 8.3], uree: [3.6, 10.7], crea: [88, 239], pt: [60, 85], alb: [19, 39], glob: [26, 50],
    alat: [31, 58], asat: [32, 84], ggt: [10, 60], ck: [100, 1500], bili: [0, 17], chol: [1.0, 3.0],
    na: [135, 150], k: [4.4, 6.7], cl: [94, 106], ca: [2.0, 2.9], p: [1.7, 3.1], mg: [0.9, 1.4],
  },
  macaque: {
    ht: [35, 48], hb: [110, 150], gr: [4.5, 6.5], vgm: [65, 85],
    gb: [4, 15], neutro: [1.5, 9], lympho: [1.5, 7.5], plaq: [200, 550],
    glu: [2.8, 5.5], uree: [3.5, 9.0], crea: [50, 110], pt: [65, 85], alb: [35, 50],
    alat: [15, 80], asat: [20, 60], pal: [100, 600], ggt: [20, 100], ck: [100, 800], bili: [0, 10], chol: [2.5, 5.0],
    na: [140, 155], k: [3.5, 5.0], cl: [100, 115], ca: [2.2, 2.7], p: [1.0, 2.2],
  },
};

/** Mises en garde d'interprétation selon l'espèce (variations physiologiques fréquentes) */
export const RANGE_NOTES: Partial<Record<SpeciesId, Partial<Record<string, string>>>> = {
  chat: {
    pas: 'ACVIM 2018 : < 140 normal, 140–159 préhypertension, 160–179 hypertension, ≥ 180 sévère. Moyenne de 5 à 7 mesures au calme (effet blouse blanche).',
    glu: 'Hyperglycémie de stress fréquente (jusqu’à 15–20 mmol/L) : confirmer par fructosamine.',
    plaq: 'Agrégats plaquettaires fréquents : thrombopénie à vérifier sur frottis.',
  },
  chien: {
    pas: 'ACVIM 2018 : < 140 normal, 140–159 préhypertension, 160–179 hypertension, ≥ 180 sévère. Moyenne de 5 à 7 mesures au calme (effet blouse blanche).',
    pal: 'Isoenzyme cortico-induite et osseuse (jeune) : PAL élevées chez le jeune en croissance.',
    ht: 'Lévriers : hématocrite physiologiquement plus élevé (jusqu’à 65 %).',
    crea: 'Lévriers et chiens très musclés : créatinine physiologiquement plus haute.',
  },
  bovin: {
    pal: 'Très variable selon l’âge et la lactation.',
    glu: 'Veau : glycémie plus élevée que l’adulte (4–7 mmol/L).',
  },
  cheval: {
    bili: 'Le jeûne (même 24 h) augmente la bilirubine non conjuguée.',
    ht: 'Contraction splénique (excitation, effort) : hématocrite transitoirement élevé.',
  },
  ovin: { glu: 'Agneau : glycémie plus élevée que l’adulte.' },
  caprin: { glu: 'Chevreau : glycémie plus élevée que l’adulte.' },
};
