import { useState } from 'preact/hooks';
import { route } from './lib/router';
import { TabBar, Toast, Sheet, DepartementSelect } from './components/ui';
import { Home } from './screens/Home';
import { Case } from './screens/Case';
import { Result } from './screens/Result';
import { History } from './screens/History';
import { Drugs } from './screens/Drugs';
import { Tools } from './screens/Tools';
import { Settings } from './screens/Settings';
import { settings, updateSettings, setDepartement } from './state/settings';
import { Icon } from './components/Icon';

export function App() {
  const r = route.value.split('?')[0];
  let screen;
  if (r === '/cas') screen = <Case />;
  else if (r === '/resultat') screen = <Result />;
  else if (r.startsWith('/historique')) screen = <History />;
  else if (r.startsWith('/medicaments')) screen = <Drugs />;
  else if (r.startsWith('/outils')) screen = <Tools />;
  else if (r.startsWith('/reglages')) screen = <Settings />;
  else screen = <Home />;
  return (
    <>
      {screen}
      <TabBar />
      <Toast />
      {!settings.value.disclaimerAccepted ? <Welcome /> : settings.value.departement === undefined && <AskDepartement />}
    </>
  );
}

const DEPT_HELP = 'Il sert à adapter les contacts (services vétérinaires, GDS, laboratoire), les repères épidémiologiques et l’avis de l’IA. Il reste sur cet iPhone.';

function AskDepartement() {
  const [code, setCode] = useState('');
  return (
    <Sheet title="Département de la clinique" doneLabel="Plus tard" onClose={() => setDepartement(null)}>
      <p class="section-foot" style="margin:0 0 12px">{DEPT_HELP}</p>
      <DepartementSelect value={code} onChange={setCode} />
      <button class="btn primary block" style="margin-top:16px" disabled={!code} onClick={() => setDepartement(code)}>Enregistrer</button>
    </Sheet>
  );
}

function Welcome() {
  const [code, setCode] = useState('');
  const accept = () => { setDepartement(code || null); updateSettings({ disclaimerAccepted: true }); };
  const [standalone] = useState(() => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone);
  return (
    <Sheet title="" doneLabel="" onClose={accept}>
      <div class="welcome">
        <h1>Bienvenue dans Véto+</h1>
        <div class="feature"><Icon name="flask" /><div><b>Analyses lues en photo</b><p>Valeurs, intervalles par espèce, alertes vitales et diagnostic différentiel.</p></div></div>
        <div class="feature"><Icon name="wifiOff" /><div><b>Fonctionne hors ligne</b><p>Le diagnostic local, les médicaments ANMV et les calculateurs restent disponibles sans réseau. L’IA, facultative et gratuite, complète l’analyse quand le réseau est là.</p></div></div>
        {!standalone && (
          <div class="feature"><Icon name="share" /><div><b>Installer sur l’iPhone</b><p>Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».</p></div></div>
        )}
        <div class="feature"><Icon name="shield" /><div><b>Aide à la décision</b><p>Ne remplace ni l’examen clinique ni le jugement du vétérinaire. Les intervalles varient selon les automates. Vérifiez toute posologie dans le RCP.</p></div></div>
        <div class="feature"><Icon name="map" /><div><b>Département de la clinique</b><p>{DEPT_HELP}</p>
          <div style="margin-top:8px"><DepartementSelect value={code} onChange={setCode} /></div></div></div>
        <button class="btn primary block" style="margin-top:8px" onClick={accept}>Continuer</button>
      </div>
    </Sheet>
  );
}
