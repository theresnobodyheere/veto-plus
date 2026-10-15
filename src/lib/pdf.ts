// Rapport PDF du cas, partagé via la feuille de partage iOS (ou téléchargé).
// Présentation alignée sur l'appli : titres de section discrets, encadrés gris clair, filets fins, couleurs système.
import { jsPDF } from 'jspdf';
import { draft, analysis } from '../state/case';
import { speciesById } from '../data/species';
import { signLabel } from '../data/signs';
import { formatValue } from '../engine/interpret';
import { likelihood, confidence } from '../engine/ddx';
import { settings } from '../state/settings';
import { departementByCode } from '../data/departements';
import { motifById } from '../data/wizard';
import { treatmentFor, lineDose } from '../data/treatments';

type RGB = [number, number, number];
const C = {
  text: [28, 28, 30] as RGB, muted: [110, 110, 115] as RGB, line: [209, 209, 214] as RGB, fill: [242, 242, 247] as RGB,
  brand: [10, 124, 114] as RGB, crit: [215, 0, 21] as RGB, critSoft: [253, 236, 238] as RGB,
  warn: [201, 52, 0] as RGB, warnSoft: [252, 240, 235] as RGB, info: [0, 102, 204] as RGB,
};

// Les polices standard du PDF (WinAnsi) n'ont ni exposants, ni indices, ni flèches, ni pictogrammes
const SUP: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁺': '+', '⁻': '-', '₃': '3', '₂': '2' };
export const safe = (s: string) => s
  .replace(/10([¹²³⁴⁵⁶⁷⁸⁹⁰]+)/g, (_, e: string) => `10^${[...e].map((c) => SUP[c]).join('')}`)
  .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻₃₂]/g, (c) => SUP[c])
  .replace(/↑/g, '(H)').replace(/↓/g, '(B)').replace(/↔/g, '<->').replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/≈/g, '~')
  .replace(/\p{Extended_Pictographic}/gu, '')
  .replace(/[^\x00-\xFF’‘“”–—…€•]/g, '');


export async function buildPdf(): Promise<Blob> {
  const d = draft.value!;
  const a = analysis.value!;
  const s = settings.value;
  const sp = speciesById(d.species);
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, H = 297, M = 18, maxW = W - 2 * M, BOTTOM = H - 18;
  let y = M;

  const font = (size: number, style: 'normal' | 'bold' = 'normal', color: RGB = C.text) => {
    doc.setFont('helvetica', style); doc.setFontSize(size); doc.setTextColor(...color);
  };
  const lh = (size: number) => size * 0.42;
  const ensure = (h: number) => { if (y + h > BOTTOM) { doc.addPage(); y = M; } };
  const lines = (str: string, size: number, width = maxW) => { font(size); return doc.splitTextToSize(safe(str), width) as string[]; };
  /** Paragraphe avec retour à la ligne ; x et largeur facultatifs (retrait des listes) */
  const para = (str: string, size = 10, style: 'normal' | 'bold' = 'normal', color: RGB = C.text, x = M, width = maxW - (x - M)) => {
    font(size, style, color);
    for (const l of doc.splitTextToSize(safe(str), width) as string[]) { ensure(lh(size)); doc.text(l, x, y + lh(size) * 0.8); y += lh(size); }
  };
  const hair = (x1 = M, x2 = W - M) => { doc.setDrawColor(...C.line); doc.setLineWidth(0.2); doc.line(x1, y, x2, y); };
  /** Titre de section en petites capitales grises, comme les listes groupées de l'appli */
  const section = (t: string) => {
    y += 6; ensure(14);
    font(8.5, 'normal', C.muted); doc.setCharSpace(0.3); doc.text(safe(t.toUpperCase()), M, y); doc.setCharSpace(0);
    y += 3;
  };

  // ——— En-tête ———
  font(9, 'bold', C.brand); doc.text('Véto+', M, y + 3);
  font(8.5, 'normal', C.muted);
  doc.text(safe(new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })), W - M, y + 3, { align: 'right' });
  y += 10;
  font(18, 'bold'); doc.text('Compte rendu d’aide au diagnostic', M, y); y += 5;
  const author = [s.clinicName, s.vetName].filter(Boolean).join(' · ');
  if (author) { font(10, 'normal', C.muted); doc.text(safe(author), M, y + 1); y += 5; }
  y += 3;

  // ——— Animal : encadré gris clair, libellé à gauche, valeur à droite ———
  const dept = departementByCode(s.departement);
  const rows: [string, string][] = [
    ['Espèce', sp.label], ['Référence', d.ref ?? ''], ['Race', d.breed ?? ''], ['Âge', d.age ?? ''], ['Sexe', d.sex ?? ''],
    ['Poids', d.weight ? `${d.weight.toLocaleString('fr-FR')} kg` : ''],
    ['Température', d.temp != null ? `${d.temp.toLocaleString('fr-FR')} °C` : ''],
    ['FC', d.hr != null ? `${d.hr} /min` : ''], ['FR', d.rr != null ? `${d.rr} /min` : ''],
    ['Cas collectif', d.herd && (d.herd.effectif || d.herd.malades || d.herd.morts) ? `effectif ${d.herd.effectif ?? '?'} · malades ${d.herd.malades ?? '?'} · morts ${d.herd.morts ?? '?'}` : ''],
    ['Département', dept ? `${dept.nom} (${dept.code})` : ''],
  ].filter((r): r is [string, string] => !!r[1]);
  const rowH = 6.4;
  const boxH = rows.length * rowH + 2;
  ensure(boxH);
  doc.setFillColor(...C.fill); doc.roundedRect(M, y, maxW, boxH, 2.5, 2.5, 'F');
  rows.forEach(([k, v], i) => {
    const ry = y + 1 + i * rowH;
    if (i) { doc.setDrawColor(...C.line); doc.setLineWidth(0.2); doc.line(M + 4, ry, W - M, ry); }
    font(10, 'normal'); doc.text(safe(k), M + 4, ry + 4.3);
    font(10, 'normal', C.muted); doc.text(safe(v), W - M - 4, ry + 4.3, { align: 'right' });
  });
  y += boxH;

  // ——— Alertes vitales : encadrés teintés ———
  if (a.alerts.length) {
    section('Alertes');
    for (const al of a.alerts) {
      const crit = al.level === 'critique';
      const body = lines(al.detail, 9.5, maxW - 10);
      const title = lines(al.title, 10.5, maxW - 10);
      const h = 5 + title.length * lh(10.5) + body.length * lh(9.5) + 1.5;
      ensure(h + 2);
      doc.setFillColor(...(crit ? C.critSoft : C.warnSoft)); doc.roundedRect(M, y, maxW, h, 2.5, 2.5, 'F');
      doc.setFillColor(...(crit ? C.crit : C.warn)); doc.roundedRect(M, y, 1.4, h, 0.7, 0.7, 'F');
      let ty = y + 3.2;
      font(10.5, 'bold', crit ? C.crit : C.warn);
      for (const l of title) { doc.text(l, M + 5, ty + lh(10.5) * 0.8); ty += lh(10.5); }
      font(9.5, 'normal');
      for (const l of body) { doc.text(l, M + 5, ty + lh(9.5) * 0.8); ty += lh(9.5); }
      y += h + 2;
    }
  }

  // ——— Clinique : motif, signes cochés et réponses du parcours ———
  const motif = motifById(d.species, d.motif)?.label;
  const clinical = a.findings.filter((f) => !a.labFindings.includes(f));
  if (motif || clinical.length || d.notes.trim()) {
    section('Motif et signes cliniques');
    if (motif) para(`Motif : ${motif}`, 10, 'bold');
    if (clinical.length) para(clinical.map(signLabel).join(' · '), 10);
    if (a.absent.length) para(`Absents : ${a.absent.map(signLabel).join(' · ')}`, 9, 'normal', C.muted);
    if (d.notes.trim()) { y += 1.5; para(d.notes.trim(), 9.5, 'normal', C.muted); }
  }

  // ——— Analyses : tableau à filets fins ———
  if (a.rows.length) {
    section('Analyses');
    const xVal = M + 92, xUnit = M + 96, xRef = W - M;
    font(8, 'normal', C.muted);
    doc.text('Analyte', M, y + 3); doc.text('Valeur', xVal, y + 3, { align: 'right' }); doc.text('Unité', xUnit, y + 3); doc.text('Référence', xRef, y + 3, { align: 'right' });
    y += 4.5; hair();
    for (const r of a.rows) {
      ensure(6.2);
      const hi = r.status === 'high', lo = r.status === 'low';
      const color = hi ? C.crit : lo ? C.info : C.text;
      font(9.5, 'normal'); doc.text(safe(r.analyte.label), M, y + 4.2);
      font(9.5, hi || lo ? 'bold' : 'normal', color);
      doc.text(safe(`${formatValue(r.analyte, r.value)}${hi ? ' H' : lo ? ' B' : ''}`), xVal, y + 4.2, { align: 'right' });
      font(9, 'normal', C.muted); doc.text(safe(r.analyte.unit), xUnit, y + 4.2);
      doc.text(r.range ? safe(`${formatValue(r.analyte, r.range[0])} – ${formatValue(r.analyte, r.range[1])}`) : '—', xRef, y + 4.2, { align: 'right' });
      y += 6.2; hair();
    }
    y += 1.5;
    font(8, 'normal', C.muted);
    const sources = [...new Set(a.rows.map((r) => r.rangeSource).filter(Boolean))];
    para(`H = au-dessus, B = au-dessous de l’intervalle de référence.${sources.length ? ` Références : ${sources.join(' ; ')}.` : ''}`, 8, 'normal', C.muted);
  }

  // ——— Diagnostic différentiel ———
  if (a.ddx.length) {
    section('Diagnostic différentiel');
    const best = a.ddx[0].score;
    const conf = confidence(a.ddx);
    if (conf !== 'solide') para(conf === 'insuffisant' ? 'Éléments insuffisants pour orienter : liste indicative.' : 'Orientation à confirmer.', 9, 'normal', C.warn);
    a.ddx.slice(0, 8).forEach((r, i) => {
      ensure(14);
      // Filet entre deux hypothèses, sauf en haut d'une nouvelle page
      if (i && y > M) { y += 1.5; hair(M + 7); y += 1.5; }
      font(10, 'bold', i === 0 ? C.brand : C.muted); doc.text(String(i + 1), M + 1.5, y + 3.6, { align: 'center' });
      para(r.disease.name, 10.5, 'bold', C.text, M + 7);
      const tags = [`Probabilité ${likelihood(r, best)}`, r.disease.urgent && 'urgence', r.disease.zoonose && 'zoonose', r.disease.regulated && 'réglementé'].filter(Boolean).join(' · ');
      para(tags, 8.5, 'normal', r.disease.urgent ? C.crit : C.muted, M + 7);
      if (r.matched.length) para(`Éléments retrouvés : ${r.matched.map(signLabel).join(', ')}`, 9, 'normal', C.text, M + 7);
      para(`Examens à envisager : ${r.disease.tests.join(' ; ')}`, 9, 'normal', C.muted, M + 7);
      if (r.disease.regulated) para(`Réglementation : ${r.disease.regulated}`, 9, 'normal', C.info, M + 7);
    });

    // Conduite à tenir pour l'hypothèse en tête, si un protocole existe
    const top = a.ddx[0];
    const tx = treatmentFor(top.disease.id, d.species);
    if (tx) {
      section(`Conduite à tenir : ${top.disease.name}`);
      if (tx.note) para(tx.note, 9.5, 'normal', C.warn);
      for (const l of tx.lines) {
        ensure(10);
        const dose = lineDose(l, d.weight);
        para(`${l.phase} — ${l.what}${dose ? ` : ${dose}` : ''}`, 10, 'bold');
        para(l.how, 9, 'normal', C.muted);
        y += 1;
      }
      para(`${d.weight ? `Quantités calculées pour ${String(d.weight).replace('.', ',')} kg. ` : ''}Vérifier chaque posologie dans le RCP${sp.food ? ' ainsi que les temps d’attente' : ''}.`, 8.5, 'normal', C.muted);
    }
  }

  // ——— Pied de page sur chaque page ———
  const n = doc.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.2); doc.line(M, H - 12, W - M, H - 12);
    font(7.5, 'normal', C.muted);
    doc.text('Aide à la décision : ne remplace ni l’examen clinique ni le jugement du vétérinaire. Posologies : se référer au RCP (ANMV).', M, H - 8);
    doc.text(`${p} / ${n}`, W - M, H - 8, { align: 'right' });
  }
  return doc.output('blob');
}

export async function sharePdf() {
  const d = draft.value!;
  const blob = await buildPdf();
  const name = `veto-plus-${(d.ref || speciesById(d.species).label).replace(/[^\w-]+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`;
  const file = new File([blob], name, { type: 'application/pdf' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if ((e as Error).name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
