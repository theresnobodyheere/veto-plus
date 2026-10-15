import { describe, expect, it } from 'vitest';
import { newCase, patch, analysis, ai } from '../src/state/case';
import { buildPdf } from '../src/lib/pdf';

describe('rapport PDF', () => {
  it('génère un PDF lisible avec caractères spéciaux', async () => {
    newCase('chien');
    patch({ ref: 'Rex', weight: 32, signs: ['vomissements', 'pupd'], notes: 'Vomit depuis 3 jours — boit beaucoup, « abattu »', labs: [
      { analyte: 'crea', value: 450, source: 'manuel' }, { analyte: 'k', value: 7.4, source: 'manuel' }, { analyte: 'gb', value: 22, source: 'manuel' },
    ] });
    ai.value = { status: 'done', text: '## Synthèse\n**Hyperkaliémie** ↑ et azotémie\n- Point 1', provider: 'Test', model: 'x' };
    expect(analysis.value!.alerts[0].title).toMatch(/7,4/);
    const blob = await buildPdf();
    const txt = Buffer.from(await blob.arrayBuffer()).toString('latin1');
    expect(blob.size).toBeGreaterThan(3000);
    expect(txt).toContain('10^9/L');
    expect(txt).not.toMatch(/[⁹↑]/);
  });
});
