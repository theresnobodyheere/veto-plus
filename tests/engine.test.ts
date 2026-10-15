import { describe, expect, it } from 'vitest';
import { interpretLab, deriveFindings, type LabValue } from '../src/engine/interpret';
import { computeAlerts } from '../src/engine/alerts';
import { rankDiseases, likelihood, confidence, discriminants, strength } from '../src/engine/ddx';
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

describe('unités', () => {
  it('normalise les notations courantes', () => {
    expect(normalizeUnit('umol/L')).toBe('µmol/l');
    expect(normalizeUnit('x10^9/L')).toBe('10^9/l');
    expect(normalizeUnit('10⁹/L')).toBe('10^9/l');
    expect(normalizeUnit('K/uL')).toBe('k/µl');
    expect(normalizeUnit('UI/L')).toBe('u/l');
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

describe('solidité du classement', () => {
  it('un seul signe vague : insuffisant, jamais « forte », barre courte', () => {
    const r = run('chien', {}, ['decubitus']);
    expect(confidence(r.ddx)).toBe('insuffisant');
    expect(r.ddx.every((x) => likelihood(x, r.ddx[0].score) !== 'forte')).toBe(true);
    expect(strength(r.ddx[0])).toBeLessThan(0.1);
  });

  it('tableau franc : solide', () => {
    const r = run('chat', { crea: 350, uree: 25, p: 2.8, ht: 24, du: 1.012 }, ['pupd', 'amaigrissement', 'age']);
    expect(confidence(r.ddx)).toBe('solide');
    expect(likelihood(r.ddx[0], r.ddx[0].score)).toBe('forte');
  });

  it('propose les signes cardinaux manquants, sans reprendre ceux déjà présents', () => {
    const r = run('chien', {}, ['decubitus']);
    const { signs } = discriminants('chien', r.ddx, r.findings);
    expect(signs.map((s) => s.id)).toContain('raideur');
    expect(signs.map((s) => s.id)).not.toContain('decubitus');
  });

  it('ajouter un signe proposé fait progresser le classement', () => {
    const before = run('chien', {}, ['vomissements']);
    const { signs } = discriminants('chien', before.ddx, before.findings);
    const after = run('chien', {}, ['vomissements', signs[0].id]);
    expect(after.ddx[0].score).toBeGreaterThan(before.ddx[0].score);
  });

  it('suggère des analyses distinctes des signes cliniques', () => {
    const r = run('chien', {}, ['vomissements', 'abattement']);
    const { signs, labs } = discriminants('chien', r.ddx, r.findings);
    expect(labs.length).toBeGreaterThan(0);
    expect(labs.some((l) => signs.some((s) => s.id === l.id))).toBe(false);
  });

  it('pas de maladie propre aux femelles chez un mâle', () => {
    const r = run('chien', {}, ['male', 'abattement', 'anorexie', 'distension_abdo', 'pupd']);
    expect(r.ddx.map((x) => x.disease.id)).not.toContain('pyometre');
  });

  it('la race renseigne le gabarit : grande race à thorax profond', async () => {
    const { newCase, patch, analysis } = await import('../src/state/case');
    newCase('chien');
    patch({ breed: 'Dogue allemand', signs: ['distension_abdo', 'vomissements_improductifs'] });
    expect(analysis.value!.findings).toContain('grand_chien');
    patch({ breed: 'Chihuahua' });
    expect(analysis.value!.findings).not.toContain('grand_chien');
  });
});
