import { describe, expect, it } from 'vitest';
import { interpretLab, deriveFindings, type LabValue } from '../src/engine/interpret';
import { computeAlerts } from '../src/engine/alerts';
import { rankDiseases } from '../src/engine/ddx';
import { parseLabText } from '../src/ocr/parse';
import { normalizeUnit, ANALYTES } from '../src/data/analytes';
import { DISEASES } from '../src/data/diseases';
import { SIGNS, LAB_FINDINGS } from '../src/data/signs';
import type { SpeciesId } from '../src/data/species';

const lab = (o: Record<string, number>): LabValue[] => Object.entries(o).map(([analyte, value]) => ({ analyte, value, source: 'manuel' }));

function run(species: SpeciesId, values: Record<string, number>, signs: string[]) {
  const rows = interpretLab(species, lab(values));
  const findings = [...signs, ...deriveFindings(species, rows)];
  return { rows, findings, ddx: rankDiseases(species, findings), alerts: computeAlerts(species, rows, signs) };
}

describe('base de connaissances', () => {
  it('chaque élément cité par une maladie existe', () => {
    const known = new Set([...SIGNS.map((s) => s.id), ...Object.keys(LAB_FINDINGS)]);
    for (const d of DISEASES) {
      for (const f of Object.keys(d.f)) expect(known.has(f), `${d.id} → ${f}`).toBe(true);
      for (const k of d.key ?? []) expect(d.f[k], `${d.id} clé ${k}`).toBeDefined();
    }
  });
  it('identifiants uniques', () => {
    expect(new Set(DISEASES.map((d) => d.id)).size).toBe(DISEASES.length);
    expect(new Set(SIGNS.map((s) => s.id)).size).toBe(SIGNS.length);
    expect(new Set(ANALYTES.map((a) => a.id)).size).toBe(ANALYTES.length);
  });
});

describe('cas cliniques', () => {
  it('chat — maladie rénale chronique', () => {
    const r = run('chat', { crea: 350, uree: 25, p: 2.8, ht: 24, du: 1.012 }, ['pupd', 'amaigrissement', 'age']);
    expect(r.findings).toEqual(expect.arrayContaining(['azotemie', 'hyperphosphatemie', 'anemie', 'isosthenurie']));
    expect(r.ddx[0].disease.id).toBe('irc');
  });

  it('vache — fièvre de lait', () => {
    const r = run('bovin', { ca: 1.2, p: 0.9 }, ['decubitus', 'mise_bas_recente', 'hypothermie']);
    expect(r.ddx[0].disease.id).toBe('fievre_lait');
    expect(r.alerts[0]).toMatchObject({ level: 'critique' });
    expect(r.alerts[0].title).toMatch(/Hypocalcémie/);
  });

  it('cheval — colique chirurgicale', () => {
    const r = run('cheval', { lact: 9, ht: 55 }, ['douleur_abdo', 'colique_severe', 'tachycardie']);
    expect(r.ddx[0].disease.id).toBe('colique_chir');
    expect(r.alerts.some((a) => a.level === 'critique' && /lactat/i.test(a.title))).toBe(true);
  });

  it('chien — Addison', () => {
    const r = run('chien', { na: 128, k: 7.1, uree: 20, lympho: 5.5 }, ['vomissements', 'abattement']);
    expect(r.findings).toContain('na_k_bas');
    expect(r.ddx[0].disease.id).toBe('addison');
    expect(r.alerts.some((a) => /Hyperkaliémie sévère/.test(a.title))).toBe(true);
  });

  it('chèvre — toxémie de gestation', () => {
    const r = run('caprin', { bhb: 4.2, glu: 2.0 }, ['gestation_avancee', 'anorexie', 'decubitus']);
    expect(r.ddx[0].disease.id).toBe('toxemie_gestation');
    expect(r.alerts.some((a) => a.level === 'critique' && /BHB/.test(a.title))).toBe(true);
  });

  it('chien de chasse — Aujeszky en tête si contact sanglier + prurit', () => {
    const r = run('chien', {}, ['contact_sanglier', 'prurit', 'ptyalisme']);
    expect(r.ddx[0].disease.id).toBe('aujeszky_chien');
  });

  it('faune : le loup utilise les intervalles du chien avec mention', () => {
    const rows = interpretLab('loup', lab({ crea: 300 }));
    expect(rows[0].status).toBe('high');
    expect(rows[0].rangeSource).toMatch(/Approximation/);
  });

  it("l'intervalle du compte rendu est prioritaire", () => {
    const rows = interpretLab('chien', [{ analyte: 'crea', value: 150, source: 'ocr', reportRange: [40, 160] }]);
    expect(rows[0].status).toBe('normal');
  });
});

describe('lecture OCR', () => {
  const text = `IDEXX Catalyst One  Résultats
CREA 4.0 mg/dL 0.5 - 1.8 H
BUN 80 mg/dL 7 - 27
GLU 110 mg/dL 74 - 143
ALKP 450 U/L 23 - 212 H
Ca 9,5
K+ 7.2 mmol/L
Na 140 mmol/L
Neutrophiles 75 % 9,5 10^9/L
Hématocrite 0,35 L/L
Page 1 / 2`;
  const out = parseLabText(text, 'chien');
  const get = (id: string) => out.find((v) => v.analyte === id);

  it('convertit mg/dL en SI', () => {
    expect(get('crea')!.value).toBeCloseTo(353.6, 0);
    expect(get('uree')!.value).toBeCloseTo(28.56, 1); // BUN
    expect(get('glu')!.value).toBeCloseTo(6.1, 1);
  });
  it("lit l'intervalle imprimé", () => {
    expect(get('crea')!.reportRange![1]).toBeCloseTo(159.1, 0);
  });
  it("devine l'unité manquante", () => {
    expect(get('ca')!.value).toBeCloseTo(2.37, 1);
    expect(get('ca')!.unitGuessed).toBe(true);
  });
  it('ignore les pourcentages du différentiel', () => {
    expect(get('neutro')!.value).toBeCloseTo(9.5, 2);
  });
  it('hématocrite en L/L', () => {
    expect(get('ht')!.value).toBeCloseTo(35, 0);
  });
  it('électrolytes courts', () => {
    expect(get('k')!.value).toBe(7.2);
    expect(get('na')!.value).toBe(140);
    expect(get('pal')!.value).toBe(450);
  });
  it('ne lit pas de faux positifs', () => {
    expect(get('p')).toBeUndefined();
  });
});

describe('unités', () => {
  it('normalise les notations courantes', () => {
    expect(normalizeUnit('umol/L')).toBe('µmol/l');
    expect(normalizeUnit('x10^9/L')).toBe('10^9/l');
    expect(normalizeUnit('10⁹/L')).toBe('10^9/l');
    expect(normalizeUnit('K/uL')).toBe('k/µl');
    expect(normalizeUnit('UI/L')).toBe('u/l');
  });
});

import { matchSigns } from '../src/engine/textSigns';
describe('dictée → signes', () => {
  it('reconnaît les signes dans une phrase', () => {
    const s = matchSigns('Vache couchée depuis le vêlage, oreilles froides, ne rumine pas', 'bovin');
    expect(s).toEqual(expect.arrayContaining(['decubitus', 'mise_bas_recente', 'arret_rumination']));
  });
  it('chien : vomit et boit beaucoup', () => {
    const s = matchSigns('il vomit depuis 2 jours et boit beaucoup', 'chien');
    expect(s).toEqual(expect.arrayContaining(['vomissements', 'pupd']));
  });
});

import { fluidPlan, transfusion, rer, anionGap, bicarbonate, calfBaseDeficit } from '../src/engine/calc';
describe('calculateurs', () => {
  it('fluidothérapie chien 20 kg, 8 %', () => {
    const p = fluidPlan({ species: 'chien', kg: 20, dehydPct: 8, lossesMl: 0, correctH: 24, young: false, dropsPerMl: 20 });
    expect(p.deficit).toBe(1600);
    expect(p.maint).toBeCloseTo(1248, 0); // 132 × 20^0,75
    expect(p.rateFirst).toBeCloseTo((1600 + 1248.3) / 24, 0);
  });
  it('transfusion chien 20 kg, Ht 12 → 25, donneur 45', () => {
    expect(transfusion(20, 90, 12, 25, 45)).toBeCloseTo(520, 0);
  });
  it('RER 10 kg', () => { expect(rer(10)).toBeCloseTo(393.6, 0); });
  it('trou anionique', () => { expect(anionGap(145, 4, 110, 22)).toBe(17); });
  it('bicarbonate veau 45 kg en décubitus latéral, > 8 j', () => {
    const b = bicarbonate(45, calfBaseDeficit('lateral', true), 0.6);
    expect(b.mmol).toBe(540);
    expect(b.grams).toBeCloseTo(45.4, 1);
  });
});

describe('OCR réel (Tesseract)', () => {
  it('texte lu sur une capture IDEXX', () => {
    const text = 'GLU 7.9 mmol/L 4.11 -7.95\nCREA 312 umol/L 44-159 H\nBUN 24.1 mmol/L  25-9.6 H\nALT 88 uL 10-125\nALKP 150 uL 23-212\nCl 112 mmol/L 109-122';
    const v = parseLabText(text, 'chien');
    const alt = v.find((x) => x.analyte === 'alat')!;
    expect(alt.unitGuessed).toBe(false);
    expect(alt.value).toBe(88);
    expect(v.find((x) => x.analyte === 'uree')!.reportRange).toBeUndefined(); // intervalle illisible rejeté
    expect(v).toHaveLength(6);
  });
});
