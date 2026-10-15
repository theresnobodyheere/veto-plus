import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { doseOptions, concentration, matchesSpecies, CATEGORIES, FORMS, type DrugProduct } from '../src/data/drugs';

const db = JSON.parse(readFileSync(new URL('../public/data/drugs.json', import.meta.url), 'utf8'));
const find = (re: RegExp) => db.products.find((p: DrugProduct) => re.test(p.n) && p.poso) as DrugProduct;

describe('médicaments', () => {
  it('concentration de la substance principale', () => {
    expect(concentration({ n: 'X 100 MG/ML SOLUTION' } as DrugProduct)).toBe(100);
    expect(concentration({ n: 'BIMECTIN D 10/100 MG/ML SOLUTION' } as DrugProduct)).toBe(10);
  });
  it('dose usuelle lue dans le RCP, selon l’espèce', () => {
    const cartaxx = find(/^CARTAXX 50/);
    expect(doseOptions(cartaxx, 'chien')[0].mgkg).toBe(4);
    const cronyxin = find(/^CRONYXIN/);
    const bov = doseOptions(cronyxin, 'bovin');
    expect(bov.length).toBeGreaterThan(0);
    expect([2.2, 1.1]).toContain(bov[0].mgkg);
  });
  it('dose en mL convertie avec la concentration', () => {
    const boflox = find(/^BOFLOX 100/);
    const o = doseOptions(boflox, 'bovin');
    expect(o.some((x) => x.mlkg && Math.abs(x.mgkg! - x.mlkg * 100) < 1e-9)).toBe(true);
  });
  it('chaque médicament reçoit une classe et une forme', () => {
    expect(CATEGORIES.at(-1)!.re.test('QV03AX')).toBe(true);
    expect(FORMS.find((f) => f.re.test('Solution injectable'))!.id).toBe('injectable');
    expect(FORMS.find((f) => f.re.test('Suspension intramammaire'))!.id).toBe('intramammaire');
  });
  it('couverture de la lecture de dose', () => {
    const withPoso = db.products.filter((p: DrugProduct) => p.poso);
    const ok = withPoso.filter((p: DrugProduct) => doseOptions(p).length > 0).length;
    console.log(`dose lue pour ${ok}/${withPoso.length} RCP`);
    expect(ok / withPoso.length).toBeGreaterThan(0.5);
  });
});

describe('filtre espèce', () => {
  it('« bovins » ne compte pas comme ovins', () => {
    const p = { n: 'X', esp: 'Bovins, porcins et chevaux.', ta: [] } as unknown as DrugProduct;
    expect(matchesSpecies(db, p, 'ovin')).toBe(false);
    expect(matchesSpecies(db, p, 'bovin')).toBe(true);
    expect(matchesSpecies(db, { ...p, esp: 'Ovins.' }, 'ovin')).toBe(true);
  });
});

describe('recherche', () => {
  it('les noms commençant par le texte saisi passent en premier', async () => {
    const { filterDrugs } = await import('../src/data/drugs');
    const { norm } = await import('../src/engine/textSigns');
    const d = { ...db, idx: db.products.map((p: DrugProduct) => norm(`${p.n} ${p.sa.map((s) => s[0]).join(' ')} ${p.atc.join(' ')}`)), cat: [], form: [], sub: [] };
    const names = filterDrugs(d, { q: 'amo' }).map((i) => db.products[i].n as string);
    const firstOther = names.findIndex((n) => !norm(n).startsWith('amo'));
    expect(firstOther).toBeGreaterThan(0);
    expect(names.slice(firstOther).some((n) => norm(n).startsWith('amo'))).toBe(false);
  });
});
