// Cas de référence : motifs de consultation fréquents saisis comme dans le parcours de l'appli.
// Chaque cas vérifie l'hypothèse attendue en tête et, pour quelques-uns, ce qui ne doit pas y figurer.
import { describe, expect, it } from 'vitest';
import { newCase, setAnswer, setMeasure, toggleSign, toggleMotif, setLab, patch, freezeQuestions, analysis, canAnalyse, draft } from '../src/state/case';
import { buildSteps, flatSteps, MOTIFS, answerSigns, motifSuggestions } from '../src/data/wizard';
import { SIGNS, LAB_FINDINGS } from '../src/data/signs';
import { DISEASES } from '../src/data/diseases';
import { discriminants } from '../src/engine/ddx';
import { TREATMENTS, treatmentFor, lineDose } from '../src/data/treatments';
import { SPECIES, type SpeciesId } from '../src/data/species';

interface Input {
  motif: string | string[]; herd?: string; age?: string; sex?: string; stage?: string; temp?: string; hr?: string; muq?: string; hyd?: string;
  signs?: string[]; yes?: string[]; no?: string[]; labs?: Record<string, number>; breed?: string; weight?: number;
  /** Autres réponses du parcours (durée, TRC, conscience, traitements…) */
  ans?: Record<string, string>;
  /** Mois du cas (0 = janvier, par défaut : hiver, sans repère saisonnier) */
  month?: number;
}

function run(species: SpeciesId, x: Input) {
  newCase(species);
  // Date fixe : la saison du cas pèse dans le classement
  patch({ createdAt: new Date(2026, x.month ?? 0, 15).getTime() });
  for (const m of [x.motif].flat()) toggleMotif(m);
  for (const k of ['herd', 'age', 'sex', 'stage', 'temp', 'hr', 'muq', 'hyd'] as const) if (x[k]) setAnswer(k, x[k]);
  for (const [k, v] of Object.entries(x.ans ?? {})) setAnswer(k, v);
  for (const s of x.signs ?? []) toggleSign(s);
  for (const [analyte, value] of Object.entries(x.labs ?? {})) setLab({ analyte, value, source: 'manuel' });
  if (x.breed) patch({ breed: x.breed });
  if (x.weight) patch({ weight: x.weight });
  for (const s of x.yes ?? []) setAnswer(`q:${s}`, 'oui');
  for (const s of x.no ?? []) setAnswer(`q:${s}`, 'non');
  // Les questions ciblées comptent si elles font partie du parcours
  if (x.yes?.length || x.no?.length) patch({ questions: [...(x.yes ?? []), ...(x.no ?? [])].map((id) => ({ id, label: id, supports: [] })) });
  return analysis.value!;
}

const top = (a: ReturnType<typeof run>) => a.ddx[0]?.disease.id;

const CASES: [string, SpeciesId, Input, string][] = [
  ['pyomètre', 'chien', { motif: 'pupd', age: 'age', sex: 'fe', stage: 'chaleurs', signs: ['abattement', 'vomissements', 'ecoulement_vulvaire'] }, 'pyometre'],
  ['parvovirose', 'chien', { motif: 'dig', age: 'jeune', sex: 'me', temp: 'haut', signs: ['diarrhee_hemorragique', 'vomissements', 'abattement', 'non_vaccine'] }, 'parvovirose'],
  ['dilatation-torsion', 'chien', { motif: 'urg', age: 'adulte', sex: 'me', signs: ['vomissements_improductifs', 'distension_abdo', 'ptyalisme'], breed: 'Berger allemand' }, 'sdte'],
  ['obstruction urétrale', 'chat', { motif: 'uri', age: 'adulte', sex: 'mc', signs: ['dysurie', 'anurie', 'vomissements'], labs: { k: 7.8 } }, 'obstruction_uretrale'],
  ['cystite de la chienne', 'chien', { motif: 'uri', age: 'adulte', sex: 'fs', temp: 'normal', signs: ['dysurie', 'hematurie'] }, 'cystite'],
  ['hyperthyroïdie', 'chat', { motif: 'pupd', age: 'age', sex: 'mc', signs: ['amaigrissement', 'polyphagie'], labs: { t4: 85 } }, 'hyperthyroidie'],
  ['maladie rénale', 'chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement', 'vomissements'], labs: { crea: 380, uree: 25 } }, 'irc'],
  ['Addison', 'chien', { motif: 'dig', age: 'adulte', signs: ['vomissements', 'diarrhee', 'abattement'], labs: { na: 128, k: 7.2 } }, 'addison'],
  ['gastro-entérite', 'chien', { motif: 'dig', age: 'adulte', sex: 'me', temp: 'normal', signs: ['diarrhee', 'vomissements', 'ecart_alimentaire'] }, 'gastro_aigue'],
  ['diarrhée hémorragique de l’adulte', 'chien', { motif: 'dig', age: 'adulte', signs: ['diarrhee_hemorragique', 'vomissements'], labs: { ht: 64 } }, 'sdha'],
  ['dermatite allergique', 'chien', { motif: 'peau', age: 'adulte', signs: ['prurit', 'puces', 'lesions_cutanees'] }, 'dermatite_allergique'],
  ['otite', 'chien', { motif: 'peau', signs: ['otite', 'prurit'] }, 'otite'],
  ['arthrose', 'chien', { motif: 'loco', age: 'age', signs: ['raideur_lever', 'boiterie'] }, 'arthrose'],
  ['hernie discale', 'chien', { motif: 'neuro', age: 'adulte', signs: ['douleur_rachis', 'paresie'] }, 'hernie_discale'],
  ['toux de chenil', 'chien', { motif: 'resp', age: 'adulte', temp: 'normal', signs: ['toux', 'collectivite'] }, 'toux_chenil'],
  ['insuffisance cardiaque', 'chien', { motif: 'resp', age: 'age', signs: ['toux', 'souffle', 'intolerance_effort'], hr: 'haut' }, 'icc_chien'],
  ['coup de chaleur', 'chien', { motif: 'urg', temp: 'tres_haut', signs: ['chaleur_ambiante', 'dyspnee'] }, 'coup_chaleur'],
  ['raticide', 'chien', { motif: 'urg', signs: ['toxique', 'hemorragies'], muq: 'pales' }, 'avk'],
  ['éclampsie', 'chien', { motif: 'repro', age: 'adulte', sex: 'fe', stage: 'misebas', temp: 'tres_haut', signs: ['tremblements', 'convulsions'] }, 'eclampsie'],
  ['babésiose', 'chien', { motif: 'abat', age: 'adulte', temp: 'haut', signs: ['tiques', 'urines_foncees'] }, 'babesiose_chien'],
  ['fièvre de lait', 'bovin', { motif: 'couche', herd: 'seul', age: 'adulte', sex: 'f', stage: 'misebas', temp: 'bas', signs: ['tremblements'] }, 'fievre_lait'],
  ['cétose', 'bovin', { motif: 'lait', herd: 'seul', age: 'adulte', sex: 'f', stage: 'lactation', signs: ['haleine_cetonique'], labs: { bhb: 3.5 } }, 'cetose_bovin'],
  ['déplacement de caillette', 'bovin', { motif: 'lait', age: 'adulte', sex: 'f', stage: 'lactation', signs: ['ping_gauche'] }, 'dcg'],
  ['mammite simple', 'bovin', { motif: 'mam', herd: 'seul', age: 'adulte', sex: 'f', stage: 'autre', temp: 'normal' }, 'mammite_clinique'],
  ['mammite colibacillaire', 'bovin', { motif: 'mam', age: 'adulte', sex: 'f', stage: 'misebas', temp: 'haut', signs: ['abattement', 'decubitus', 'deshydratation'] }, 'mammite_coli'],
  ['diarrhée du veau', 'bovin', { motif: 'dig', age: 'jeune', signs: ['diarrhee'], hyd: 'moderee' }, 'diarrhee_neonatale'],
  ['bronchopneumonie', 'bovin', { motif: 'resp', herd: 'plusieurs', age: 'jeune', temp: 'haut', signs: ['toux', 'jetage'] }, 'bpie'],
  ['réticulo-péritonite', 'bovin', { motif: 'dig', age: 'adulte', sex: 'f', temp: 'haut', signs: ['arret_rumination', 'douleur_garrot'] }, 'rpt'],
  ['tétanie d’herbage', 'bovin', { motif: 'neuro', age: 'adulte', signs: ['convulsions', 'paturage'], labs: { mg: 0.4 } }, 'tetanie'],
  ['toxémie de gestation', 'ovin', { motif: 'couche', age: 'adulte', sex: 'f', stage: 'gestante', signs: ['cecite', 'tremblements'] }, 'toxemie_gestation'],
  ['listériose', 'caprin', { motif: 'neuro', age: 'adulte', signs: ['tete_penchee', 'paralysie_faciale', 'ensilage'] }, 'listeriose'],
  ['colique chirurgicale', 'cheval', { motif: 'colique', signs: ['colique_severe', 'reflux_gastrique'], hr: 'tres_haut', muq: 'congestives' }, 'colique_chir'],
  ['colique médicale', 'cheval', { motif: 'colique', hr: 'normal', signs: ['constipation'] }, 'colique_med'],
  ['fourbure', 'cheval', { motif: 'loco', signs: ['pouls_digites', 'boiterie', 'prise_poids', 'paturage'] }, 'fourbure'],
  ['abcès de pied', 'cheval', { motif: 'loco', signs: ['boiterie_aigue_1', 'lesions_podales'] }, 'abces_pied'],
  ['rhabdomyolyse', 'cheval', { motif: 'muscle', signs: ['myalgie', 'urines_foncees', 'effort_recent'], labs: { ck: 25000 } }, 'rhabdomyolyse'],
  ['asthme équin', 'cheval', { motif: 'resp', age: 'age', temp: 'normal', signs: ['toux', 'dyspnee'] }, 'asthme_equin'],
  ['obstruction œsophagienne', 'cheval', { motif: 'resp', signs: ['aliment_naseaux', 'ptyalisme'] }, 'obstruction_oeso'],
  ['gourme', 'cheval', { motif: 'resp', age: 'jeune', temp: 'haut', signs: ['adenomegalie', 'jetage'] }, 'gourme'],
];

describe('cas de référence', () => {
  for (const [label, sp, input, expected] of CASES) {
    it(`${label} (${sp})`, () => {
      const a = run(sp, input);
      expect(top(a), `classement : ${a.ddx.slice(0, 4).map((r) => r.disease.id).join(' > ')}`).toBe(expected);
    });
  }

  it('un chien qui se gratte n’évoque pas la maladie d’Aujeszky sans contact avec un sanglier', () => {
    const a = run('chien', { motif: 'peau', signs: ['prurit'] });
    expect(a.ddx.slice(0, 3).map((r) => r.disease.id)).not.toContain('aujeszky_chien');
  });
  it('« raideur au lever » n’évoque pas le tétanos', () => {
    const a = run('chien', { motif: 'loco', age: 'age', signs: ['raideur_lever'] });
    expect(a.ddx.map((r) => r.disease.id)).not.toContain('tetanos');
  });
  it('un « Non » à une question ciblée fait reculer l’hypothèse', () => {
    const base = run('chien', { motif: 'pupd', age: 'age', sex: 'fe', stage: 'chaleurs', signs: ['abattement'] });
    const s1 = base.ddx.find((r) => r.disease.id === 'pyometre')!.score;
    const after = run('chien', { motif: 'pupd', age: 'age', sex: 'fe', stage: 'chaleurs', signs: ['abattement'], no: ['ecoulement_vulvaire'] });
    expect(after.ddx.find((r) => r.disease.id === 'pyometre')!.score).toBeLessThan(s1);
    expect(after.absent).toContain('ecoulement_vulvaire');
  });
  it('la température mesurée prime sur la plage choisie', () => {
    run('chien', { motif: 'abat', temp: 'haut' });
    expect(analysis.value!.findings).toContain('fievre');
    setMeasure('temp', 38.6);
    expect(analysis.value!.findings).not.toContain('fievre');
    setAnswer('temp', 'bas');
    expect(draft.value!.temp).toBeUndefined();
    expect(analysis.value!.findings).toContain('hypothermie');
  });
});

describe('réponses normales', () => {
  it('chienne stérilisée en PU-PD : pas de pyomètre en tête, pas de question sur les chaleurs ou le sexe', () => {
    const a = run('chien', { motif: 'pupd', age: 'age', sex: 'fs', signs: ['abattement', 'vomissements'] });
    expect(a.absent).toEqual(expect.arrayContaining(['male', 'femelle_entiere']));
    expect(a.ddx.slice(0, 3).map((r) => r.disease.id)).not.toContain('pyometre');
    freezeQuestions();
    const asked = draft.value!.questions!.map((q) => q.id);
    expect(asked).not.toContain('femelle_entiere');
    expect(asked).not.toContain('male');
    expect(asked).not.toContain('age');
  });
  it('normotherme, muqueuses roses : les hypothèses fébriles ou anémiques reculent', () => {
    const base = run('chien', { motif: 'abat', age: 'adulte', signs: ['tiques', 'urines_foncees'] });
    const s0 = base.ddx.find((r) => r.disease.id === 'babesiose_chien')!.score;
    const after = run('chien', { motif: 'abat', age: 'adulte', temp: 'normal', muq: 'roses', signs: ['tiques', 'urines_foncees'] });
    expect(after.absent).toEqual(expect.arrayContaining(['fievre', 'muqueuses_pales', 'ictere']));
    expect(after.ddx.find((r) => r.disease.id === 'babesiose_chien')!.score).toBeLessThan(s0);
  });
  it('une température mesurée normale écarte la fièvre ; un signe coché prime', () => {
    run('chat', { motif: 'abat' });
    setMeasure('temp', 38.6);
    expect(analysis.value!.absent).toContain('fievre');
    toggleSign('hypothermie');
    setMeasure('temp', 36);
    expect(analysis.value!.absent).not.toContain('hypothermie');
  });
});

describe('analyses dans les normes', () => {
  it('chat âgé en PU-PD : créatinine, SDMA et densité normales font reculer la maladie rénale', () => {
    const base = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'] });
    const s0 = base.ddx.find((r) => r.disease.id === 'irc')!.score;
    const after = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'], labs: { crea: 120, sdma: 10, du: 1.045 } });
    expect(after.absent).toEqual(expect.arrayContaining(['azotemie', 'sdma_haut', 'isosthenurie']));
    expect(after.ddx.find((r) => r.disease.id === 'irc')?.score ?? 0).toBeLessThan(s0);
    expect(top(after)).not.toBe('irc');
  });
  it('une valeur dans l’autre sens écarte aussi ; une glycémie de stress du chat n’écarte rien', () => {
    expect(run('chien', { motif: 'abat', labs: { glu: 2.5 } }).absent).toContain('hyperglycemie');
    const stress = run('chat', { motif: 'abat', labs: { glu: 9 } });
    expect(stress.findings).not.toContain('hyperglycemie');
    expect(stress.absent).not.toContain('hyperglycemie');
  });
  it('une valeur dosée normale n’est plus proposée « à doser »', () => {
    const before = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'] });
    expect(discriminants('chat', before.ddx, before.findings, 8, before.absent).labs.map((x) => x.id)).toContain('azotemie');
    const a = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'], labs: { crea: 120 } });
    expect(discriminants('chat', a.ddx, a.findings, 8, a.absent).labs.map((x) => x.id)).not.toContain('azotemie');
  });
});

describe('pression artérielle', () => {
  it('chat âgé aveugle, PAS 190 : hypertension en tête et alerte', () => {
    const a = run('chat', { motif: 'neuro', age: 'age', signs: ['cecite'], labs: { pas: 190 } });
    expect(a.findings).toContain('hypertension');
    expect(top(a)).toBe('hypertension');
    expect(a.alerts.some((x) => x.level === 'critique' && /Hypertension sévère/.test(x.title))).toBe(true);
  });
  it('sans mesure, l’hypertension n’est qu’une piste faible et la PAS est proposée', () => {
    const a = run('chat', { motif: 'neuro', age: 'age', signs: ['cecite'] });
    const h = a.ddx.find((r) => r.disease.id === 'hypertension');
    expect(h?.missingKey).toBe(true);
    expect(discriminants('chat', a.ddx, a.findings, 8, a.absent).labs.map((x) => x.id)).toContain('hypertension');
  });
  it('PAS normale : hypertension écartée ; préhypertension (150) : ni l’un ni l’autre', () => {
    const base = run('chat', { motif: 'neuro', age: 'age', signs: ['cecite'] });
    const s0 = base.ddx.find((r) => r.disease.id === 'hypertension')?.score ?? 0;
    const n = run('chat', { motif: 'neuro', age: 'age', signs: ['cecite'], labs: { pas: 125 } });
    expect(n.absent).toContain('hypertension');
    expect(n.ddx.find((r) => r.disease.id === 'hypertension')?.score ?? 0).toBeLessThan(s0);
    const pre = run('chat', { motif: 'neuro', age: 'age', signs: ['cecite'], labs: { pas: 150 } });
    expect(pre.findings).not.toContain('hypertension');
    expect(pre.absent).not.toContain('hypertension');
  });
});

describe('données de l’examen et de l’anamnèse', () => {
  it('veau de 4 jours en diarrhée : diarrhée néonatale devant la coccidiose', () => {
    const a = run('bovin', { motif: 'dig', herd: 'seul', age: 'nn', signs: ['diarrhee'], hyd: 'moderee' });
    const ids = a.ddx.map((r) => r.disease.id);
    expect(ids[0]).toBe('diarrhee_neonatale');
    expect(ids.indexOf('coccidiose')).not.toBe(0);
  });
  it('veau de 2 mois en diarrhée : la diarrhée néonatale recule', () => {
    const nn = run('bovin', { motif: 'dig', age: 'nn', signs: ['diarrhee'] }).ddx.find((r) => r.disease.id === 'diarrhee_neonatale')!.score;
    const older = run('bovin', { motif: 'dig', age: 'jeune', signs: ['diarrhee'] }).ddx.find((r) => r.disease.id === 'diarrhee_neonatale')!.score;
    expect(older).toBeLessThan(nn);
  });
  it('chien en choc : pâle, TRC allongé, tachycarde, aigu → hémoabdomen et alerte', () => {
    const a = run('chien', { motif: 'urg', age: 'age', muq: 'pales', hr: 'tres_haut', ans: { trc: 'long', duree: 'h24', consc: 'abattu' } });
    expect(a.ddx[0].disease.id).toBe('hemoabdomen');
    expect(a.alerts.some((x) => x.title === 'Signes de choc' && x.level === 'critique')).toBe(true);
  });
  it('coma : alerte critique', () => {
    const a = run('chat', { motif: 'abat', ans: { consc: 'stupeur' } });
    expect(a.alerts[0].title).toMatch(/conscience/);
  });
  it('AINS récents et méléna : ulcère proposé ; jamais sans exposition', () => {
    const a = run('chien', { motif: 'dig', age: 'age', signs: ['vomissements', 'diarrhee_hemorragique'], ans: { ains: 'oui' } });
    expect(a.ddx.slice(0, 3).map((r) => r.disease.id)).toContain('ulcere_ains');
    const b = run('chien', { motif: 'dig', age: 'age', signs: ['vomissements', 'diarrhee_hemorragique'], ans: { ains: 'non' } });
    expect(b.ddx.map((r) => r.disease.id)).not.toContain('ulcere_ains');
  });
  it('durée : une évolution chronique fait monter les maladies chroniques', () => {
    const base = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'] }).ddx.find((r) => r.disease.id === 'hyperthyroidie')!.score;
    const chronic = run('chat', { motif: 'pupd', age: 'age', signs: ['amaigrissement'], ans: { duree: 'mois' } }).ddx.find((r) => r.disease.id === 'hyperthyroidie')!.score;
    expect(chronic).toBeGreaterThan(base);
  });
  it('troupeau : l’étape des effectifs n’apparaît que pour un cas collectif', () => {
    newCase('ovin');
    toggleMotif('resp');
    setAnswer('herd', 'seul');
    expect(buildSteps(draft.value!).some((s) => s.id === 'herdInfo')).toBe(false);
    setAnswer('herd', 'plusieurs');
    expect(buildSteps(draft.value!).some((s) => s.id === 'herdInfo')).toBe(true);
  });
});

describe('terrain', () => {
  it('saison : la piroplasmose bovine monte au printemps, sans être proposée sur la saison seule', () => {
    const winter = run('bovin', { motif: 'lait', signs: ['fievre', 'urines_foncees'] });
    const spring = run('bovin', { motif: 'lait', signs: ['fievre', 'urines_foncees'], month: 4 });
    const sc = (a: typeof winter) => a.ddx.find((r) => r.disease.id === 'babesiose_bovin')!.score;
    expect(sc(spring)).toBeGreaterThan(sc(winter));
    expect(spring.findings).toContain('printemps');
    const onlySeason = run('cheval', { motif: 'loco', month: 9 });
    expect(onlySeason.ddx.map((r) => r.disease.id)).not.toContain('myopathie_atypique');
  });
  it('vache primipare couchée après vêlage : la fièvre de lait recule, la paralysie obstétricale apparaît', () => {
    const base = { motif: 'couche', herd: 'seul', age: 'adulte', sex: 'f', stage: 'misebas', temp: 'normal', signs: ['velage_difficile', 'paresie'] };
    const old = run('bovin', { ...base, ans: { parite: 'l3' } });
    const heifer = run('bovin', { ...base, ans: { parite: 'l1' } });
    const sc = (a: typeof old, id: string) => a.ddx.find((r) => r.disease.id === id)?.score ?? 0;
    expect(sc(heifer, 'fievre_lait')).toBeLessThan(sc(old, 'fievre_lait'));
    expect(heifer.ddx[0].disease.id).toBe('paralysie_obstetricale');
    expect(buildSteps(draft.value!).some((s) => s.id === 'parite')).toBe(true);
  });
  it('toxique coché : étapes toxique et délai ; le raticide précisé place l’intoxication aux AVK en tête', () => {
    run('chien', { motif: 'urg', signs: ['toxique'] });
    expect(buildSteps(draft.value!).map((s) => s.id)).toEqual(expect.arrayContaining(['tox', 'toxdelai']));
    setAnswer('tox', 'avk');
    expect(analysis.value!.ddx[0].disease.id).toBe('avk');
    const chat = run('chat', { motif: 'urg', signs: ['toxique'] });
    void chat;
    expect(flatSteps(buildSteps(draft.value!)).find((s) => s.id === 'tox')!.options!.map((o) => o.id)).toContain('permethrine');
  });
  it('introduction récente d’un cheval en collectivité : gourme en tête', () => {
    const a = run('cheval', { motif: 'resp', herd: 'plusieurs', temp: 'haut', signs: ['jetage', 'introduction'] });
    expect(a.ddx[0].disease.id).toBe('gourme');
  });
  it('examen par espèce : ping à gauche saisi à l’examen → déplacement de caillette', () => {
    const a = run('bovin', { motif: 'lait', age: 'adulte', sex: 'f', stage: 'lactation', ans: { ping: 'g', rumen: 'hypo' } });
    expect(a.ddx[0].disease.id).toBe('dcg');
  });
  it('colique : reflux et anses distendues à l’examen → colique chirurgicale', () => {
    const a = run('cheval', { motif: 'colique', hr: 'haut', ans: { reflux: 'oui', tr: 'anses', bruits: 'abs' } });
    expect(a.ddx[0].disease.id).toBe('colique_chir');
  });
});

describe('parcours', () => {
  it('l’analyse se débloque après le motif et 3 réponses', () => {
    newCase('chien');
    toggleMotif('dig');
    expect(canAnalyse.value).toBe(false);
    setAnswer('age', 'adulte');
    setAnswer('sex', 'me');
    expect(canAnalyse.value).toBe(false);
    toggleSign('vomissements');
    toggleSign('diarrhee');
    expect(canAnalyse.value).toBe(true);
  });
  it('les questions ciblées s’insèrent après les signes', () => {
    run('chien', { motif: 'pupd', age: 'age', sex: 'fe', stage: 'chaleurs' });
    freezeQuestions();
    const ids = buildSteps(draft.value!).map((s) => s.id);
    const q = ids.filter((x) => x.startsWith('q:'));
    expect(q.length).toBeGreaterThan(0);
    expect(q.length).toBeLessThanOrEqual(3);
    expect(ids.indexOf(q[0])).toBe(ids.indexOf('signs') + 1);
  });
  it('le stade ne s’affiche que pour une femelle adulte', () => {
    newCase('bovin');
    toggleMotif('lait');
    setAnswer('sex', 'm');
    expect(buildSteps(draft.value!).some((s) => s.id === 'stage')).toBe(false);
    setAnswer('sex', 'f');
    expect(buildSteps(draft.value!).some((s) => s.id === 'stage')).toBe(true);
    setAnswer('stage', 'misebas');
    expect(answerSigns(draft.value!).present).toEqual(expect.arrayContaining(['mise_bas_recente', 'debut_lactation']));
    setAnswer('age', 'jeune');
    expect(draft.value!.answers?.stage).toBeUndefined();
  });
  it('un bilan sanguin fait passer les analyses en deuxième', () => {
    newCase('chat');
    toggleMotif('bilan');
    expect(buildSteps(draft.value!)[1].id).toBe('labs');
  });
  it('plusieurs motifs : leurs signes et suggestions s’additionnent', () => {
    run('chien', { motif: ['pupd', 'abat'] });
    expect(analysis.value!.findings).toEqual(expect.arrayContaining(['pupd', 'abattement', 'anorexie']));
    const { preset, sugg } = motifSuggestions(draft.value!);
    expect(preset).toEqual(['pupd', 'abattement', 'anorexie']);
    expect(sugg).toContain('polyphagie');
    expect(sugg).toContain('ictere');
    expect(sugg).not.toContain('abattement');
    toggleMotif('abat');
    expect(analysis.value!.findings).not.toContain('anorexie');
  });
  it('un motif « bilan » parmi d’autres fait passer les analyses en deuxième', () => {
    run('chat', { motif: ['dig', 'bilan'] });
    expect(buildSteps(draft.value!)[1].id).toBe('labs');
  });
  it('un cas enregistré avec un seul motif reste lisible', () => {
    newCase('chien');
    patch({ motif: 'pupd' });
    expect(analysis.value!.findings).toContain('pupd');
    toggleMotif('dig');
    expect(draft.value!.motifs).toEqual(['pupd', 'dig']);
  });
  it('tous les signes du parcours existent', () => {
    const known = new Set([...SIGNS.map((s) => s.id), ...Object.keys(LAB_FINDINGS)]);
    for (const list of Object.values(MOTIFS)) for (const m of list) for (const s of [...(m.signs ?? []), ...m.sugg]) expect(known.has(s), `${m.id} : ${s}`).toBe(true);
    for (const sp of SPECIES) {
      newCase(sp.id);
      for (const st of flatSteps(buildSteps(draft.value!))) for (const o of st.options ?? []) for (const s of [...(o.signs ?? []), ...(o.absent ?? [])]) expect(known.has(s), `${sp.id} ${st.id} : ${s}`).toBe(true);
    }
  });
});

describe('conduite à tenir', () => {
  it('chaque protocole correspond à une maladie de la base', () => {
    const ids = new Set(DISEASES.map((d) => d.id));
    for (const id of Object.keys(TREATMENTS)) expect(ids.has(id), id).toBe(true);
  });
  it('quantités calculées pour le poids', () => {
    const t = treatmentFor('pyometre', 'chien')!;
    const agl = t.lines.find((l) => l.what.startsWith('Aglépristone'))!;
    expect(lineDose(agl, 28)).toBe('280 mg = 9,3 mL');
    expect(lineDose(t.lines.find((l) => l.mlkg)!, 28)).toBe('280 mL');
    expect(lineDose(agl, undefined)).toBeUndefined();
  });
  it('les lignes propres à une espèce sont filtrées', () => {
    expect(treatmentFor('pyometre', 'chat')!.lines.some((l) => l.what.startsWith('Aglépristone'))).toBe(false);
    expect(treatmentFor('fievre_lait', 'ovin')!.lines[0].fixed).toBe('50 à 100 mL');
    // Faune : protocole de l'espèce de référence
    expect(treatmentFor('pyometre', 'loup')!.lines.some((l) => l.what.startsWith('Aglépristone'))).toBe(true);
  });
  it('une dose fixe s’affiche sans poids', () => {
    expect(lineDose(treatmentFor('cetose_bovin', 'bovin')!.lines[0])).toBe('300 mL/j');
  });
  it('petites doses lisibles', () => {
    const bup = treatmentFor('pancreatite', 'chat')!.lines.find((l) => l.q === 'buprénorphine')!;
    expect(lineDose(bup, 4)).toBe('0,08 mg = 0,27 mL');
  });
});
