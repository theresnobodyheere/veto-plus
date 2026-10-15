import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './app';
import { updateReady } from './components/ui';
import { requestPersistence } from './db/db';
import { loadDrugs } from './data/drugs';
import './styles.css';

render(<App />, document.getElementById('app')!);

// Mise à jour de l'appli : proposée, jamais imposée en pleine consultation
const updateSW = registerSW({
  onNeedRefresh() { updateReady.value = () => updateSW(true); },
});

void requestPersistence();
// Pré-chargement de la base médicaments en arrière-plan (cache hors ligne)
setTimeout(() => { loadDrugs().catch(() => {}); }, 2500);
