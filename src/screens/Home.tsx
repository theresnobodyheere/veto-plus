import { useEffect, useState } from 'preact/hooks';
import { SPECIES, speciesById } from '../data/species';
import { TopBar, Chevron } from '../components/ui';
import { newCase, openCase } from '../state/case';
import { go } from '../lib/router';
import { db, type CaseRecord } from '../db/db';

export function Home() {
  const [recent, setRecent] = useState<CaseRecord[]>([]);
  useEffect(() => { db.cases.orderBy('updatedAt').reverse().limit(3).toArray().then(setRecent).catch(() => {}); }, []);
  const start = (id: (typeof SPECIES)[number]['id']) => { newCase(id); go('/cas'); };
  const groups: { title: string; ids: string[] }[] = [
    { title: 'Animaux de compagnie', ids: ['chien', 'chat'] },
    { title: 'Rurale et équine', ids: ['bovin', 'ovin', 'caprin', 'cheval', 'porc'] },
    { title: 'Faune et parc animalier', ids: ['macaque', 'ours', 'loup', 'lynx', 'bison', 'cervide', 'bouquetin', 'sanglier'] },
  ];
  return (
    <>
      <TopBar title="Nouveau cas" large />
      <main>
        {groups.map((g) => (
          <section key={g.title}>
            <div class="section-title">{g.title}</div>
            <div class="list">
              {g.ids.map((id) => {
                const sp = speciesById(id as any);
                const ref = sp.proxy ? speciesById(sp.proxy).label.toLowerCase() : '';
                return (
                  <button key={id} class="list-item species-row" onClick={() => start(sp.id)}>
                    <span class="grow">{sp.label}</span>
                    {ref && <span class="detail" style="font-size:15px">réf. {ref}</span>}
                    <Chevron />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
        {recent.length > 0 && (
          <>
            <div class="section-title">Derniers cas</div>
            <div class="list">
              {recent.map((c) => (
                <button key={c.id} class="list-item" onClick={() => { openCase(c); go('/resultat'); }}>
                  <span class="grow">
                    <b>{c.ref || speciesById(c.species).label}</b>
                    <div class="sub">{c.summary?.top ?? 'Pas d’hypothèse'} · {new Date(c.updatedAt).toLocaleDateString('fr-FR')}</div>
                  </span>
                  {!!c.summary?.critical && <span class="tag crit">{c.summary.critical} alerte{c.summary.critical > 1 ? 's' : ''}</span>}
                  <Chevron />
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </>
  );
}
