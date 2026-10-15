// Formules des calculateurs, avec leurs sources.

/** Entretien hydrique (mL/24 h). AAHA 2024 Fluid Therapy Guidelines (chien 132×P^0,75 ; chat 80×P^0,75) ;
 *  grands animaux : 50 mL/kg/j adulte, 80 mL/kg/j nouveau-né (Constable ; Smith). */
export function maintenance(species: string, kg: number, young: boolean): { ml: number; formula: string } {
  if (species === 'chien') return { ml: 132 * kg ** 0.75, formula: '132 × poids^0,75 (AAHA 2024)' };
  if (species === 'chat') return { ml: 80 * kg ** 0.75, formula: '80 × poids^0,75 (AAHA 2024)' };
  const perKg = young ? 80 : 50;
  return { ml: perKg * kg, formula: `${perKg} mL/kg/j (${young ? 'nouveau-né' : 'adulte'})` };
}

export interface FluidPlan { deficit: number; maint: number; losses: number; total: number; rateFirst: number; rateAfter: number; dropsPerMin: number; secPerDrop: number; formula: string }

export function fluidPlan(o: { species: string; kg: number; dehydPct: number; lossesMl: number; correctH: number; young: boolean; dropsPerMl: number }): FluidPlan {
  const deficit = o.kg * o.dehydPct * 10;
  const { ml: maint, formula } = maintenance(o.species, o.kg, o.young);
  const ch = Math.max(1, Math.min(24, o.correctH));
  const rateFirst = deficit / ch + maint / 24 + o.lossesMl / 24;
  const rateAfter = maint / 24 + o.lossesMl / 24;
  const dropsPerMin = (rateFirst * o.dropsPerMl) / 60;
  return { deficit, maint, losses: o.lossesMl, total: deficit + maint + o.lossesMl, rateFirst, rateAfter, dropsPerMin, secPerDrop: dropsPerMin > 0 ? 60 / dropsPerMin : 0, formula };
}

/** Déshydratation du veau d'après l'enfoncement du globe oculaire (Constable et al., JAVMA 1998) */
export function calfDehydration(eyeMm: number): string {
  if (eyeMm <= 0) return '< 5 %';
  if (eyeMm <= 2) return '≈ 5–6 %';
  if (eyeMm <= 4) return '≈ 6–8 %';
  if (eyeMm <= 6) return '≈ 8–10 %';
  if (eyeMm <= 8) return '≈ 10–12 %';
  return '> 12 %';
}

/** Déficit en bases estimé cliniquement chez le veau diarrhéique (Naylor, Can Vet J 1989) */
export function calfBaseDeficit(posture: 'debout-tete' | 'debout-faible' | 'sternal' | 'lateral', olderThan8d: boolean): number {
  const young = { 'debout-tete': 0, 'debout-faible': 5, sternal: 10, lateral: 10 };
  const old = { 'debout-tete': 5, 'debout-faible': 10, sternal: 15, lateral: 20 };
  return (olderThan8d ? old : young)[posture];
}

/** Bicarbonate à apporter : déficit × poids × 0,6 (veau nouveau-né) ou 0,3 (adulte) */
export function bicarbonate(kg: number, baseDeficit: number, factor: number) {
  const mmol = kg * baseDeficit * factor;
  return { mmol, grams: mmol * 0.084, ml14: mmol / 0.1667, ml84: mmol };
}

/** Volume de sang total à transfuser (mL) */
export const BLOOD_VOLUME: Record<string, number> = { chien: 90, chat: 60, cheval: 80, bovin: 60, ovin: 60, caprin: 60, porc: 65 };
export function transfusion(kg: number, bv: number, htRecipient: number, htTarget: number, htDonor: number): number {
  if (htDonor <= 0) return 0;
  return Math.max(0, (kg * bv * (htTarget - htRecipient)) / htDonor);
}

/** Besoins énergétiques (kcal/j) : RER = 70 × P^0,75 (WSAVA Nutrition Toolkit) */
export const rer = (kg: number) => 70 * kg ** 0.75;
export const MER_FACTORS: { label: string; f: number }[] = [
  { label: 'Chien adulte stérilisé', f: 1.6 },
  { label: 'Chien adulte entier', f: 1.8 },
  { label: 'Chien : perte de poids', f: 1.0 },
  { label: 'Chiot < 4 mois', f: 3.0 },
  { label: 'Chiot > 4 mois', f: 2.0 },
  { label: 'Chat adulte stérilisé', f: 1.2 },
  { label: 'Chat adulte entier', f: 1.4 },
  { label: 'Chat : perte de poids', f: 0.8 },
  { label: 'Chaton', f: 2.5 },
  { label: 'Animal hospitalisé (RER)', f: 1.0 },
];

/** Électrolytes (mmol/L) */
export const anionGap = (na: number, k: number, cl: number, hco3: number) => na + k - cl - hco3;
export const calcOsmolality = (na: number, k: number, glu: number, urea: number) => 2 * (na + k) + glu + urea;
/** Na corrigé pour la glycémie : +1,6 mmol/L par 5,55 mmol/L de glucose au-dessus de 5,55 */
export const correctedNa = (na: number, glu: number) => na + 0.288 * Math.max(0, glu - 5.55);
/** Chlore corrigé = Cl × (Na normal / Na mesuré) */
export const correctedCl = (cl: number, na: number, naNormal: number) => cl * (naNormal / na);

/** Durées de gestation moyennes (jours) */
export const GESTATION: { id: string; label: string; days: number }[] = [
  { id: 'vache', label: 'Vache', days: 283 },
  { id: 'brebis', label: 'Brebis', days: 147 },
  { id: 'chevre', label: 'Chèvre', days: 150 },
  { id: 'jument', label: 'Jument', days: 340 },
  { id: 'truie', label: 'Truie', days: 114 },
  { id: 'chienne', label: 'Chienne (depuis l’ovulation)', days: 63 },
  { id: 'chatte', label: 'Chatte', days: 65 },
  { id: 'anesse', label: 'Ânesse', days: 365 },
];
