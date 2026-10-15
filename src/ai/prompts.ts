// Consignes données aux IA. Aucune donnée d'identification (propriétaire, référence) n'est transmise.
import { ANALYTES } from '../data/analytes';
import { speciesById, type SpeciesId } from '../data/species';
import { signLabel } from '../data/signs';
import type { LabRow } from '../engine/interpret';
import { formatValue } from '../engine/interpret';
import type { DdxResult } from '../engine/ddx';
import type { Alert } from '../engine/alerts';
import type { Herd } from '../db/db';
import type { Departement } from '../data/departements';

export const EXTRACT_SYSTEM = `Tu lis des photos de comptes rendus d'analyses vétérinaires (automates de clinique IDEXX, Scil, VetScan, Fuji, ou laboratoire).
Les photos peuvent aussi être cliniques (animal, lésion, plaie, radiographie, échographie, ECG) : classe chacune, dans l'ordre d'envoi.
Renvoie UNIQUEMENT un objet JSON, sans texte autour, de la forme :
{"photos":["analyse"|"clinique", …],"valeurs":[{"analyte":"<identifiant>","valeur":<nombre>,"unite":"<unité imprimée>","min":<nombre|null>,"max":<nombre|null>}],"autres":"<autres résultats utiles : bandelette urinaire, frottis, tests rapides (SNAP, PCR), commentaires du labo>"}
Identifiants à utiliser : ${ANALYTES.map((a) => `${a.id}=${a.label}`).join(' ; ')}.
Règles : recopie exactement le nombre imprimé (point décimal) et l'unité imprimée ; min/max = intervalle de référence imprimé sur la même ligne, sinon null ;
pour les leucocytes différentiels prends la valeur absolue (10^9/L ou K/µL), pas le pourcentage ; « BUN » = urée exprimée en azote (analyte "uree", unité imprimée) ;
"analyse" = compte rendu, ticket d'automate, bandelette ou test rapide ; ne lis des valeurs que sur ces photos-là ;
n'invente jamais une valeur illisible ; ignore les analytes absents de la liste mais résume-les dans "autres".`;

/** Consigne d'analyse d'un cas. Le département de la clinique (choisi dans Réglages, stocké sur l'iPhone) situe le contexte épidémiologique. */
export const caseSystem = (dept?: Departement) => `Tu es un assistant d'aide au diagnostic pour un vétérinaire praticien en exercice mixte en France${dept ? ` (département ${dept.nom}, ${dept.code}, région ${dept.region})` : ''} : bovins, ovins, caprins, équins, porcins, chiens, chats, et ponctuellement faune sauvage européenne et magots.
Tu t'adresses à un professionnel : sois précis, concis, structuré, en français.
Appuie-toi uniquement sur des connaissances vétérinaires reconnues (Merck Veterinary Manual, consensus ACVIM/ECVIM/ESVE, WSAVA, ISFM, IRIS, Constable–Radostits, Smith, ESCCAP, réglementation française DGAL/ANMV, règlement UE 2016/429).
Ne fabrique jamais de référence, de valeur ni de posologie. Si une information est incertaine, dis-le. Pour toute posologie, renvoie au RCP du médicament (ANMV) et à la cascade ; pour les animaux de rente, rappelle le temps d'attente.
Tiens compte du contexte épidémiologique ${dept ? 'de ce département et de sa région' : 'français'} (babésiose, leishmaniose en extension, tuberculose bovine et faune sauvage, FCO, MHE, DNC, Aujeszky chez les sangliers, fièvre Q, West Nile) ; si tu n'es pas sûr de la situation locale, dis-le.
Un moteur local a déjà proposé des hypothèses : critique-les, complète-les, signale s'il se trompe.
Format Markdown obligatoire :
## Synthèse
(2–3 lignes)
## Urgences
(seulement s'il y a un risque vital ; sinon omets la section)
## Hypothèses diagnostiques
(liste numérotée, de la plus probable à la moins probable, avec arguments pour / contre et probabilité estimée)
## Examens prioritaires
## Prise en charge initiale
(principes et classes thérapeutiques, sans posologie inventée)
## Zoonose / réglementation
(seulement si pertinent : maladie à déclaration obligatoire, catégorie, précautions humaines)`;

export function buildCaseText(o: {
  species: SpeciesId; age?: string; sex?: string; weight?: number; herd?: Herd;
  signs: string[]; notes: string; rows: LabRow[]; ddx: DdxResult[]; alerts: Alert[]; otherResults?: string;
}): string {
  const sp = speciesById(o.species);
  const lines: string[] = [];
  lines.push(`Espèce : ${sp.label}${o.age ? `, âge : ${o.age}` : ''}${o.sex ? `, sexe : ${o.sex}` : ''}${o.weight ? `, poids : ${o.weight} kg` : ''}.`);
  if (o.herd && (o.herd.effectif || o.herd.malades || o.herd.morts)) {
    lines.push(`Cas collectif : effectif ${o.herd.effectif ?? '?'}, malades ${o.herd.malades ?? '?'}, morts ${o.herd.morts ?? '?'}${o.herd.lot ? `, lot : ${o.herd.lot}` : ''}.`);
  }
  if (o.signs.length) lines.push(`Signes et contexte : ${o.signs.map(signLabel).join(' ; ')}.`);
  if (o.notes.trim()) lines.push(`Commentaire du vétérinaire : ${o.notes.trim()}`);
  if (o.rows.length) {
    lines.push('Résultats biologiques (unités SI) :');
    for (const r of o.rows) {
      const flag = r.status === 'high' ? '↑' : r.status === 'low' ? '↓' : '';
      const ref = r.range ? ` [réf. ${formatValue(r.analyte, r.range[0])}–${formatValue(r.analyte, r.range[1])}]` : '';
      lines.push(`- ${r.analyte.label} : ${formatValue(r.analyte, r.value)} ${r.analyte.unit} ${flag}${ref}`);
    }
  }
  if (o.otherResults?.trim()) lines.push(`Autres résultats lus : ${o.otherResults.trim()}`);
  if (o.alerts.length) lines.push(`Alertes du moteur local : ${o.alerts.map((a) => a.title).join(' ; ')}.`);
  if (o.ddx.length) lines.push(`Hypothèses du moteur local : ${o.ddx.slice(0, 6).map((d) => d.disease.name).join(' ; ')}.`);
  return lines.join('\n');
}
