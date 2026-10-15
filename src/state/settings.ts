// Réglages persistants (localStorage) : intervalles de la clinique, contacts, département.
import { signal, effect } from '@preact/signals';
import type { RangeTable } from '../data/ranges';
import type { SpeciesId } from '../data/species';
import { departementByCode, type Departement, type Region } from '../data/departements';

/** custom : libellé modifié par l'utilisateur, à ne plus adapter automatiquement au département */
export interface Contact { id: string; label: string; phone: string; note?: string; custom?: boolean }

export interface Settings {
  customRanges: Partial<Record<SpeciesId, RangeTable>>;
  contacts: Contact[];
  clinicName: string;
  vetName: string;
  disclaimerAccepted: boolean;
  /** Code du département de la clinique ; undefined = pas encore demandé, null = non précisé */
  departement?: string | null;
}

const CAPAE: Contact = { id: 'capae', label: 'CAPAE-Ouest (centre antipoison animal de l’Ouest)', phone: '02 40 68 77 40' };
/** Régions couvertes en priorité par le CAPAE-Ouest ; ailleurs, le CNITV reste le centre de référence */
const CAPAE_REGIONS: Region[] = ['Bretagne', 'Pays de la Loire', 'Normandie', 'Centre-Val de Loire', 'Nouvelle-Aquitaine'];

export const DEFAULT_CONTACTS: Contact[] = [
  { id: 'cnitv', label: 'CNITV (centre national antipoison vétérinaire)', phone: '04 78 87 10 40' },
  { id: 'ddetspp', label: 'DDPP / DDETSPP du département (services vétérinaires)', phone: '', note: 'À compléter ; demander le service santé et protection animales' },
  { id: 'gds', label: 'GDS du département', phone: '', note: 'À compléter' },
  { id: 'lvd', label: 'Laboratoire départemental (analyses officielles)', phone: '', note: 'À compléter' },
  { id: 'samu', label: 'SAMU (morsure de macaque, exposition humaine)', phone: '15' },
];

/** Adapte les contacts au département choisi, sans toucher aux numéros ni aux libellés saisis par l'utilisateur */
export function contactsForDepartement(contacts: Contact[], d?: Departement): Contact[] {
  const label: Record<string, string> = d
    ? {
        ddetspp: `DDPP / DDETSPP – ${d.nom} (${d.code})`,
        gds: `GDS – ${d.nom} (${d.code})`,
        lvd: `Laboratoire départemental – ${d.nom} (${d.code})`,
      }
    : Object.fromEntries(DEFAULT_CONTACTS.map((c) => [c.id, c.label]));
  let out = contacts.map((c) => (label[c.id] && !c.custom ? { ...c, label: label[c.id] } : c));
  const capae = out.find((c) => c.id === 'capae');
  const wantCapae = !!d && CAPAE_REGIONS.includes(d.region);
  if (wantCapae && !capae) out.splice(1, 0, CAPAE);
  if (!wantCapae && capae && !capae.custom && capae.phone === CAPAE.phone) out = out.filter((c) => c.id !== 'capae');
  return out;
}

export function setDepartement(code: string | null) {
  const d = departementByCode(code);
  updateSettings({ departement: code, contacts: contactsForDepartement(settings.value.contacts, d) });
}

const DEFAULTS: Settings = {
  customRanges: {},
  contacts: DEFAULT_CONTACTS,
  clinicName: '',
  vetName: '',
  disclaimerAccepted: false,
};

const KEY = 'vetoplus.settings.v1';

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    // L'IA a été retirée : les clés et réglages IA d'une version précédente sont effacés de l'appareil
    const { keys: _k, models: _m, order: _o, aiEnabled: _a, ...s } = JSON.parse(raw);
    const merged: Settings = { ...DEFAULTS, ...s };
    // Libellés des contacts toujours accordés au département enregistré
    const d = departementByCode(merged.departement);
    return d ? { ...merged, contacts: contactsForDepartement(merged.contacts, d) } : merged;
  } catch {
    return DEFAULTS;
  }
}

export const settings = signal<Settings>(load());

effect(() => {
  try { localStorage.setItem(KEY, JSON.stringify(settings.value)); } catch { /* stockage indisponible */ }
});

export function updateSettings(patch: Partial<Settings>) {
  settings.value = { ...settings.value, ...patch };
}
