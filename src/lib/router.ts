// Navigation par ancre (#/…) : fonctionne hors ligne et sur GitHub Pages sans configuration serveur.
import { signal } from '@preact/signals';

const read = () => (location.hash.replace(/^#/, '') || '/');
export const route = signal<string>(read());
window.addEventListener('hashchange', () => { route.value = read(); window.scrollTo(0, 0); });

export function go(path: string) {
  if (read() !== path) location.hash = path;
}
export function back(fallback = '/') {
  if (history.length > 1) history.back();
  else go(fallback);
}
