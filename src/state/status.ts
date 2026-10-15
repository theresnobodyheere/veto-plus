// État réseau et état de chaque service d'IA, affichés en permanence dans le bandeau.
import { signal, computed } from '@preact/signals';
import type { ProviderId } from './settings';
import { settings } from './settings';

export type ServiceState = 'ok' | 'inconnu' | 'sans-cle' | 'quota' | 'cle-invalide' | 'erreur' | 'lent';

export interface ServiceStatus {
  state: ServiceState;
  message?: string;
  /** Service mis de côté jusqu'à cette date (quota, erreur) */
  until?: number;
  at?: number;
}

export const online = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
export const services = signal<Record<ProviderId, ServiceStatus>>({
  gemini: { state: 'inconnu' }, mistral: { state: 'inconnu' },
});

export function setService(id: ProviderId, s: ServiceStatus) {
  services.value = { ...services.value, [id]: { ...s, at: Date.now() } };
}

/** Un service est-il utilisable maintenant ? */
export function usable(id: ProviderId): boolean {
  if (!settings.value.keys[id]) return false;
  const s = services.value[id];
  if (s.state === 'cle-invalide') return false;
  if (s.until && s.until > Date.now()) return false;
  return true;
}

export const aiAvailable = computed(() =>
  online.value && settings.value.aiEnabled && settings.value.order.some((p) => {
    // lecture des signaux pour la réactivité
    void services.value[p];
    return usable(p);
  }),
);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { online.value = true; });
  window.addEventListener('offline', () => { online.value = false; });
}

export const STATE_LABEL: Record<ServiceState, string> = {
  ok: 'disponible',
  inconnu: 'non testé',
  'sans-cle': 'clé manquante',
  quota: 'quota atteint',
  'cle-invalide': 'clé invalide',
  erreur: 'erreur',
  lent: 'trop lent',
};
