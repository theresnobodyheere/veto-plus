import { describe, expect, it } from 'vitest';
import { parseNotes } from '../src/engine/notes';

describe('lecture du commentaire', () => {
  it('chien : poids, âge, sexe, signes et analyses', () => {
    const f = parseNotes('Chienne stérilisée de 8 ans, 32 kg, vomit depuis 3 jours, PUPD. K 7,8 ; créat 620 et glycémie 2,1', 'chien');
    expect(f.weight).toBe(32);
    expect(f.age).toBe('8 ans');
    expect(f.sex).toBe('Femelle stérilisée');
    expect(f.signs).toEqual(expect.arrayContaining(['vomissements', 'pupd']));
    expect(f.labs.map((l) => l.analyte)).toEqual(expect.arrayContaining(['k', 'crea', 'glu']));
    expect(f.labs.every((l) => l.source === 'texte')).toBe(true);
    // Sans unité : unité de l'appli, pas de conversion
    expect(f.labs.find((l) => l.analyte === 'glu')!.value).toBe(2.1);
    expect(f.labs.find((l) => l.analyte === 'crea')!.value).toBe(620);
  });
  it('« depuis 3 jours » n’est pas un âge', () => {
    expect(parseNotes('Abattu depuis 3 jours', 'chien').age).toBeUndefined();
    expect(parseNotes('Veau âgé de 10 jours', 'bovin').age).toBe('10 j');
  });
  it('les négations sont écartées', () => {
    const f = parseNotes('Pas de fièvre, sans diarrhée. Abattement marqué', 'chien');
    expect(f.signs).not.toContain('fievre');
    expect(f.signs).not.toContain('diarrhee');
    expect(f.signs).toContain('abattement');
  });
  it('troupeau : effectif, malades, morts', () => {
    const f = parseNotes('Troupeau de 120 brebis, 15 malades et 3 mortes en une semaine', 'ovin');
    expect(f.herd).toEqual({ effectif: 120, malades: 15, morts: 3 });
    expect(f.sex).toBe('Femelle');
  });
  it('vache après vêlage', () => {
    const f = parseNotes('Vache couchée depuis ce matin, vêlage hier. Ca 1,2 mmol/L, Mg 0,6', 'bovin');
    expect(f.signs).toEqual(expect.arrayContaining(['decubitus', 'mise_bas_recente']));
    expect(f.labs.map((l) => l.analyte)).toEqual(expect.arrayContaining(['ca', 'mg']));
    expect(f.weight).toBeUndefined();
  });
});
