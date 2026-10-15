// État du réseau (seule la base médicaments en dépend, au premier chargement).
import { signal } from '@preact/signals';

export const online = signal<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { online.value = true; });
  window.addEventListener('offline', () => { online.value = false; });
}
