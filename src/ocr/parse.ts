// Analyse le texte d'un compte rendu d'analyses (OCR) pour en extraire les valeurs.
// Reconnaît les abréviations IDEXX (Catalyst, ProCyte), Scil/Exigo, VetScan, Fuji et des laboratoires.
import { ANALYTES, normalizeUnit, analyteById, type Analyte } from '../data/analytes';
import type { SpeciesId } from '../data/species';
import { readValue, type LabValue } from '../engine/interpret';

interface Matcher { analyte: Analyte; alias: string; re: RegExp; startOnly: boolean }

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const MATCHERS: Matcher[] = (() => {
  const list: Matcher[] = [];
  for (const a of ANALYTES) {
    for (const al of a.aliases) {
      list.push({ analyte: a, alias: al, re: new RegExp(`(?<![\\p{L}\\d])${esc(al)}(?![\\p{L}])`, 'iu'), startOnly: false });
    }
    for (const ex of a.exact ?? []) {
      const short = ex.replace(/[+-]$/, '').length <= 2;
      list.push({ analyte: a, alias: ex, re: new RegExp(`(?<![\\p{L}\\d])${esc(ex)}(?![\\p{L}\\d])`, 'u'), startOnly: short });
    }
  }
  // Les synonymes les plus longs d'abord (« calcium ionisé » avant « calcium »)
  return list.sort((x, y) => y.alias.length - x.alias.length);
})();

const NUM = /([<>≤≥]?)\s*(\d+(?:[.,]\d+)?)/g;
const UNIT_RE = /^\s*(?:[HLhl↑↓*!]\s+)?((?:x\s?)?(?:10\s?[\^e]?\s?\d+|[a-zA-Zµμ%][a-zA-Zµμ%0-9³]*)(?:\s?\/\s?[a-zA-Zµμ0-9³]+)?)/;
const RANGE_RE = /(\d+(?:[.,]\d+)?)\s*[-–—à]\s*(\d+(?:[.,]\d+)?)/;

const toNum = (s: string) => parseFloat(s.replace(',', '.'));

function cleanLine(line: string): string {
  return line
    .replace(/[|¦]/g, ' ')
    .replace(/(?<=\d)[oO](?=\d)/g, '0')
    .replace(/(?<=\d)\s*,\s*(?=\d)/g, ',')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface ParsedLine extends LabValue { line: string; alias: string }

export function parseLabText(text: string, species: SpeciesId): ParsedLine[] {
  const found = new Map<string, ParsedLine>();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = cleanLine(rawLine);
    if (line.length < 3) continue;

    // Trouver le synonyme le plus à gauche (et le plus long à position égale)
    let best: { m: Matcher; idx: number; end: number } | null = null;
    for (const m of MATCHERS) {
      const r = m.re.exec(line);
      if (!r) continue;
      if (m.startOnly && line.slice(0, r.index).replace(/[^\p{L}\d]/gu, '') !== '') continue;
      if (!best || r.index < best.idx || (r.index === best.idx && r[0].length > best.end - best.idx)) {
        best = { m, idx: r.index, end: r.index + r[0].length };
      }
    }
    if (!best || best.idx > 30) continue;

    const rest = line.slice(best.end);
    const a = best.m.analyte;
    NUM.lastIndex = 0;
    let n: RegExpExecArray | null;
    let tries = 0;
    while ((n = NUM.exec(rest)) && tries++ < 3) {
      const value = toNum(n[2]);
      const after = rest.slice(n.index + n[0].length);
      const um = UNIT_RE.exec(after);
      let unit = um?.[1];
      // Pas une unité : début d'un intervalle de référence (« 0.5-1.8 »)
      if (unit && /^\d/.test(unit) && !/^10/.test(unit)) unit = undefined;
      const nu = normalizeUnit(unit);
      const known = nu !== '' && (nu in a.units || !!a.aliasUnits?.[best.m.alias.toLowerCase()]?.[nu]);
      // Pourcentage d'un comptage cellulaire différentiel : on cherche la valeur absolue suivante
      if (nu === '%' && !('%' in a.units)) continue;
      if (unit && !known && /[a-z]/i.test(unit) && nu.length > 1 && !/^[hl]$/i.test(unit)) {
        // Unité inconnue pour cet analyte : on garde la valeur mais l'unité sera devinée
        unit = undefined;
      }
      const conv = readValue(a.id, value, known ? unit : undefined, species, best.m.alias);
      if (!conv) break;

      // Intervalle imprimé sur la ligne (même unité que la valeur)
      let reportRange: [number, number] | undefined;
      const rr = RANGE_RE.exec(after.slice(um ? um[0].length : 0));
      if (rr) {
        const lo = toNum(rr[1]), hi = toNum(rr[2]);
        const f = conv.value / (value || 1);
        if (hi > lo && value !== 0) reportRange = [lo * f, hi * f];
      }
      const entry: ParsedLine = {
        analyte: a.id, value: conv.value, rawValue: value, rawUnit: unit, source: 'ocr',
        unitGuessed: conv.guessed, reportRange, line, alias: best.m.alias,
      };
      const prev = found.get(a.id);
      if (!prev || (prev.unitGuessed && !entry.unitGuessed)) found.set(a.id, entry);
      break;
    }
  }
  return [...found.values()];
}

/** Valeurs renvoyées par l'IA (JSON) -> LabValue, avec la même logique de conversion */
export function fromAiValues(items: { analyte: string; valeur: number; unite?: string; min?: number; max?: number }[], species: SpeciesId): LabValue[] {
  const out: LabValue[] = [];
  for (const it of items) {
    const a = analyteById(it.analyte) ?? ANALYTES.find((x) =>
      x.aliases.some((al) => al.toLowerCase() === String(it.analyte).toLowerCase()) ||
      (x.exact ?? []).includes(String(it.analyte)));
    if (!a || typeof it.valeur !== 'number') continue;
    const conv = readValue(a.id, it.valeur, it.unite, species);
    if (!conv) continue;
    const f = conv.value / (it.valeur || 1);
    out.push({
      analyte: a.id, value: conv.value, rawValue: it.valeur, rawUnit: it.unite, source: 'ia', unitGuessed: conv.guessed,
      reportRange: it.min != null && it.max != null && it.max > it.min && it.valeur !== 0 ? [it.min * f, it.max * f] : undefined,
    });
  }
  return out;
}
