import { useEffect, useState } from 'preact/hooks';
import { db, type CaseRecord } from '../db/db';
import { speciesById } from '../data/species';
import { TopBar, toast, Chevron } from '../components/ui';
import { openCase } from '../state/case';
import { go } from '../lib/router';
import { norm } from '../engine/textSigns';

export function History() {
  const [cases, setCases] = useState<CaseRecord[] | null>(null);
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState(false);
  const load = () => db.cases.orderBy('updatedAt').reverse().toArray().then(setCases).catch(() => setCases([]));
  useEffect(() => { void load(); }, []);

  const del = async (c: CaseRecord) => {
    if (!c.id || !confirm(`Supprimer définitivement le cas « ${c.ref || speciesById(c.species).label} » ?`)) return;
    await db.cases.delete(c.id);
    toast('Cas supprimé');
    await load();
  };

  const n = norm(q);
  const list = (cases ?? []).filter((c) => !n || norm(`${c.ref ?? ''} ${speciesById(c.species).label} ${c.summary?.top ?? ''} ${c.notes}`).includes(n));

  return (
    <>
      <TopBar title="Historique" large action={(cases?.length ?? 0) > 0 && (
        <button class="nav-btn" onClick={() => setEdit(!edit)} aria-pressed={edit}>{edit ? 'OK' : 'Modifier'}</button>
      )} />
      <main>
        <input type="search" placeholder="Rechercher" value={q} onInput={(e) => setQ(e.currentTarget.value)} />

        {cases === null ? <p class="center"><span class="spinner" /></p> : list.length === 0 ? (
          <div class="empty">Aucun cas enregistré.</div>
        ) : (
          <div class="list">
            {list.map((c) => (
              <div key={c.id} class="list-item history-row">
                {edit && (
                  <button class="del-btn" onClick={() => del(c)} aria-label={`Supprimer le cas ${c.ref || speciesById(c.species).label}`}><span class="del-dot" /></button>
                )}
                <button class="row grow history-open" disabled={edit} onClick={() => { openCase(c); go(c.finished === false ? '/cas' : '/resultat'); }}>
                  <span class="grow">
                    <b>{c.ref || speciesById(c.species).label}</b>
                    <div class="sub">{c.summary?.top ?? 'Pas d’hypothèse'}</div>
                    <div class="fine">{speciesById(c.species).label}{c.breed ? ` ${c.breed.toLowerCase()}` : ''} · {new Date(c.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                  </span>
                  {c.finished === false && <span class="tag warn">en cours</span>}
                  {c.followOf != null && <span class="tag info">suivi</span>}
                  {!!c.summary?.critical && <span class="tag crit">{c.summary.critical} alerte{c.summary.critical > 1 ? 's' : ''}</span>}
                  {!edit && <Chevron />}
                </button>
              </div>
            ))}
          </div>
        )}
        <p class="section-foot">Les cas sont enregistrés uniquement sur cet iPhone. Pour les sauvegarder : Réglages, puis Exporter.</p>
      </main>
    </>
  );
}
