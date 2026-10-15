import { useState } from 'preact/hooks';
import { draft, analysis, ai, startAI, stopAI, askFollowup } from '../state/case';
import { speciesById } from '../data/species';
import { signLabel } from '../data/signs';
import { formatValue } from '../engine/interpret';
import { likelihood } from '../engine/ddx';
import { TopBar, Markdown, toast } from '../components/ui';
import { Icon } from '../components/Icon';
import { go } from '../lib/router';
import { online, aiAvailable } from '../state/status';
import { settings } from '../state/settings';
import { departementByCode } from '../data/departements';

export function Result() {
  const d = draft.value;
  const a = analysis.value;
  if (!d || !a) { go('/'); return null; }
  const sp = speciesById(d.species);
  const region = departementByCode(settings.value.departement)?.region;
  const best = a.ddx[0]?.score ?? 1;
  const flagged = a.ddx.filter((r) => likelihood(r, best) !== 'faible').slice(0, 6);
  const regulated = flagged.filter((r) => r.disease.regulated);
  const zoonoses = flagged.filter((r) => r.disease.zoonose && !r.disease.regulated);

  const exportPdf = async () => {
    try {
      const { sharePdf } = await import('../lib/pdf');
      await sharePdf();
    } catch (e) {
      toast(`PDF impossible : ${(e as Error).message}`);
    }
  };

  return (
    <>
      <TopBar title={d.ref || sp.label} backTo="/cas" backLabel="Saisie" />
      <main>
        <div class="actions">
          <button class="btn small" onClick={() => go('/cas')}><Icon name="pencil" />Modifier</button>
          <button class="btn small" onClick={exportPdf}><Icon name="share" />PDF</button>
          <button class="btn small" onClick={() => go(`/medicaments?esp=${sp.proxy ?? sp.id}`)}><Icon name="medicaments" />Médicaments</button>
        </div>

        {/* Alertes vitales en premier */}
        {a.alerts.map((al, i) => (
          <div key={i} class={`alert ${al.level}`}><b>{al.title}</b><p>{al.detail}</p></div>
        ))}
        {regulated.map((r) => (
          <div key={r.disease.id} class="alert reg">
            <b>{r.disease.name}</b>
            <p>{r.disease.regulated}. <a href="#/outils/reglementaire">Contacts et conduite à tenir</a></p>
          </div>
        ))}
        {zoonoses.length > 0 && (
          <div class="alert attention"><b>Risque zoonotique</b><p>{zoonoses.map((r) => r.disease.name).join(', ')} : protections adaptées (gants, masque).</p></div>
        )}
        {d.species === 'macaque' && (
          <div class="alert critique"><b>Herpèsvirus B</b><p>Morsure ou griffure : laver 15 min puis appeler le 15. <a href="#/outils/faune">Protocole</a></p></div>
        )}

        <div class="section-title">Diagnostic différentiel · moteur local</div>
        {a.ddx.length === 0 ? (
          <div class="card empty">Ajoutez des signes cliniques ou des résultats d’analyses pour obtenir des hypothèses.</div>
        ) : (
          <div class="list">
            {a.ddx.map((r, i) => {
              const lk = likelihood(r, best);
              return (
                <details class="ddx" key={r.disease.id} open={i === 0}>
                  <summary>
                    <span class="rank">{i + 1}</span>
                    <span class="grow">
                      <b>{r.disease.name}</b>
                      <div class="meta">
                        <span class={`lk-${lk}`}>Probabilité {lk}</span>
                        {r.disease.urgent && <span class="tag crit">urgence</span>}
                        {r.disease.zoonose && <span class="tag warn">zoonose</span>}
                        {r.disease.regulated && <span class="tag info">réglementé</span>}
                        {region && r.disease.zones?.includes(region) && <span class="tag">circule dans la région</span>}
                      </div>
                      <div class="bar"><div style={{ width: `${Math.round((r.score / best) * 100)}%` }} /></div>
                    </span>
                  </summary>
                  <div class="body">
                    <div class="label" style="margin-top:0">Éléments retrouvés</div>
                    <div>{r.matched.map(signLabel).join(', ')}</div>
                    {r.missingKey && <div class="muted">Aucun signe cardinal présent : hypothèse moins probable.</div>}
                    <div><div class="label">Examens à envisager</div>
                      <ul>{r.disease.tests.map((t) => <li key={t}>{t}</li>)}</ul>
                    </div>
                    {r.disease.note && <p>{r.disease.note}</p>}
                    {r.disease.regulated && <p><b>Réglementation :</b> {r.disease.regulated}</p>}
                    <p class="fine">Source : {r.disease.src}</p>
                  </div>
                </details>
              );
            })}
          </div>
        )}

        <AiPanel />

        {a.rows.length > 0 && <LabSummary />}

        {d.signs.length > 0 && (
          <>
            <div class="section-title">Signes retenus</div>
            <div class="chips">{d.signs.map((s) => <span key={s} class="chip">{signLabel(s)}</span>)}</div>
          </>
        )}

        <p class="disclaimer">
          Aide à la décision : ne remplace pas l’examen clinique ni le jugement du vétérinaire. Vérifier toute posologie dans le RCP (ANMV).
        </p>
      </main>
    </>
  );
}

function LabSummary() {
  const a = analysis.value!;
  const [all, setAll] = useState(false);
  const rows = all ? a.rows : a.rows.filter((r) => r.status === 'high' || r.status === 'low');
  return (
    <>
      <div class="section-title">Analyses</div>
      <div class="card">
        {rows.length === 0 && <p class="muted">Toutes les valeurs sont dans les intervalles de référence.</p>}
        <table class="lab">
          <tbody>
            {rows.map((r) => (
              <tr key={r.analyte.id} class={r.status}>
                <td class="name">{r.analyte.label}{r.note && <div class="muted" style="font-size:12px;font-weight:400">{r.note}</div>}</td>
                <td class="val">{formatValue(r.analyte, r.value)}</td>
                <td class="flag">{r.status === 'high' ? '↑' : r.status === 'low' ? '↓' : ''}</td>
                <td class="ref">{r.analyte.unit}<br />{r.range ? `${formatValue(r.analyte, r.range[0])}–${formatValue(r.analyte, r.range[1])}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button class="btn small ghost" onClick={() => setAll(!all)}>{all ? 'Anomalies seulement' : `Tout afficher (${a.rows.length})`}</button>
        {[...new Set(a.rows.map((r) => r.rangeSource).filter(Boolean))].map((s) => <p key={s} class="fine">Référence : {s}</p>)}
      </div>
    </>
  );
}

function AiPanel() {
  const s = ai.value;
  const [q, setQ] = useState('');
  const hasKeys = settings.value.order.some((p) => settings.value.keys[p]);
  return (
    <>
      <div class="section-title">Avis de l’IA{s.provider ? ` · ${s.provider}` : ''}</div>
      <div class="card">
        {!online.value && s.status !== 'done' && <p class="muted">Hors ligne : l’avis de l’IA sera disponible au retour du réseau. Le diagnostic local ci-dessus reste utilisable.</p>}
        {online.value && !hasKeys && !s.text && <p class="muted">Aucune clé IA configurée. <a href="#/reglages">Ajouter une clé gratuite</a></p>}
        {s.notice && <p class="tag warn block">{s.notice}</p>}
        {s.status === 'idle' && aiAvailable.value && (
          <button class="btn primary block" onClick={() => startAI()}><Icon name="sparkle" />Demander l’avis de l’IA</button>
        )}
        {s.status === 'running' && !s.text && !s.pendingQ && (
          <p class="row muted"><span class="spinner" /> Analyse en cours{s.provider ? ` (${s.provider})` : ''}…</p>
        )}
        {s.text && <Markdown text={s.text} typing={s.status === 'running' && !s.pendingQ} />}
        {s.status === 'running' && <button class="btn small" style="margin-top:8px" onClick={stopAI}><Icon name="stop" />Arrêter</button>}
        {s.status === 'error' && (
          <div>
            <p class="tag crit block">IA indisponible : {s.error}</p>
            <button class="btn small" onClick={() => startAI()} disabled={!aiAvailable.value}><Icon name="refresh" />Réessayer</button>
          </div>
        )}
        {(s.followups ?? []).map((f, i) => (
          <div key={i} class="followup">
            <b>{f.q}</b>
            <Markdown text={f.a} typing={s.status === 'running' && i === (s.followups!.length - 1)} />
          </div>
        ))}
        {s.status === 'done' && (
          <>
            {s.model && <p class="fine">Généré par {s.provider} ({s.model}). Vérifier les informations.</p>}
            <div class="search" style="margin-top:12px">
              <input type="text" placeholder="Question sur ce cas" value={q} onInput={(e) => setQ(e.currentTarget.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && q.trim()) { void askFollowup(q); setQ(''); } }} />
              <button class="btn small primary icon-only" disabled={!q.trim() || !online.value} onClick={() => { void askFollowup(q); setQ(''); }} aria-label="Envoyer"><Icon name="send" /></button>
            </div>
            <button class="btn ghost" onClick={() => startAI()} disabled={!aiAvailable.value}><Icon name="refresh" size={20} />Relancer l’analyse</button>
          </>
        )}
      </div>
    </>
  );
}
