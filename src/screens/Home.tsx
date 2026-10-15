// Onglet Cas : première question du parcours (l'animal), et reprise d'un cas en cours (les cas enregistrés sont dans l'Historique).
import { useState } from 'preact/hooks';
import { SPECIES, speciesById, type SpeciesId } from '../data/species';
import { Chevron } from '../components/ui';
import { Icon } from '../components/Icon';
import { draft, newCase } from '../state/case';
import { motifById } from '../data/wizard';
import { go } from '../lib/router';

const DOMESTIC: { id: SpeciesId; detail?: string }[] = [
  { id: 'chien' }, { id: 'chat' }, { id: 'bovin' }, { id: 'cheval' }, { id: 'ovin' }, { id: 'caprin' }, { id: 'porc' },
];
const WILD = SPECIES.filter((s) => s.group === 'faune');

export function Home() {
  const [wild, setWild] = useState(false);
  const [picked, setPicked] = useState<SpeciesId | null>(null);
  // Un choix est visible un court instant avant de passer à la question suivante
  const start = (id: SpeciesId) => { setPicked(id); setTimeout(() => { newCase(id); go('/cas'); }, 160); };
  const current = draft.value && !draft.value.id && draft.value.motif ? draft.value : null;

  const tile = (id: SpeciesId, detail?: string) => {
    const sp = speciesById(id);
    const d = detail ?? (sp.proxy ? `réf. ${speciesById(sp.proxy).label.toLowerCase()}` : undefined);
    return (
      <button key={id} class={`opt ${picked === id ? 'sel' : ''}`} onClick={() => start(id)}>
        <span class="opt-t">{sp.label}</span>
        {d && <span class="opt-d">{d}</span>}
      </button>
    );
  };

  return (
    <>
      <header class="wiz-top">
        <div class="wiz-row">
          {wild ? <button class="back" onClick={() => setWild(false)} aria-label="Retour aux animaux domestiques"><Icon name="chevronLeft" />Domestiques</button> : <span />}
          <span class="wiz-name">Nouveau cas · Animal</span>
          <span />
        </div>
        <div class="wiz-progress"><div style={{ width: '6%' }} /></div>
      </header>
      <main class="wiz home">
        <h1 class="wiz-title">{wild ? 'Quelle espèce ?' : 'Quel animal ?'}</h1>
        {wild && <p class="wiz-sub">Les intervalles et le diagnostic utilisent l’espèce domestique de référence.</p>}
        <div class="opts">
          {wild ? WILD.map((s) => tile(s.id)) : (
            <>
              {DOMESTIC.map((s) => tile(s.id, s.detail))}
              <button class="opt" onClick={() => setWild(true)}>
                <span class="opt-t">Faune, parc</span><span class="opt-d">Magot, ours, loup, cervidé…</span>
              </button>
            </>
          )}
        </div>

        {current && (
          <>
            <div class="section-title">Cas en cours</div>
            <div class="list">
              <button class="list-item" onClick={() => go('/cas')}>
                <span class="grow"><b>{speciesById(current.species).label}</b>
                  <div class="sub">{motifById(current.species, current.motif)?.label ?? 'Saisie commencée'}</div></span>
                <Chevron />
              </button>
            </div>
          </>
        )}

      </main>
    </>
  );
}
