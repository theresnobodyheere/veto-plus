import { useState } from 'preact/hooks';
import { draft, analysis, toggleSign, persist, step, followUp } from '../state/case';
import { speciesById } from '../data/species';
import { signLabel } from '../data/signs';
import { formatValue } from '../engine/interpret';
import { likelihood, strength, confidence, discriminants } from '../engine/ddx';
import { TopBar, toast } from '../components/ui';
import { Icon } from '../components/Icon';
import { go } from '../lib/router';
import { settings } from '../state/settings';
import { departementByCode } from '../data/departements';
import { treatmentFor, lineDose, needsWeight } from '../data/treatments';
import { buildSteps } from '../data/wizard';

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
  const clinical = a.findings.filter((f) => !a.labFindings.includes(f));

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
          {d.id != null && <button class="btn small" onClick={() => { followUp(); go('/cas'); }}><Icon name="clock" />Suivi</button>}
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

        <div class="section-title">Diagnostic différentiel</div>
        {a.ddx.length > 0 && <ConfidenceNote />}
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
                      <div class="bar"><div style={{ width: `${Math.round(strength(r) * 100)}%` }} /></div>
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
                    <Treatment diseaseId={r.disease.id} />
                    {r.disease.regulated && <p><b>Réglementation :</b> {r.disease.regulated}</p>}
                    <p class="fine">Source : {r.disease.src}</p>
                  </div>
                </details>
              );
            })}
          </div>
        )}

        <Refine />

        {a.rows.length > 0 && <LabSummary />}

        {clinical.length > 0 && (
          <>
            <div class="section-title">Éléments retenus</div>
            <div class="chips">{clinical.map((s) => <span key={s} class="chip">{signLabel(s)}</span>)}</div>
          </>
        )}
        {a.absent.length > 0 && (
          <>
            <div class="section-title">Recherchés, absents</div>
            <div class="chips">{a.absent.map((s) => <span key={s} class="chip" style="text-decoration:line-through;color:var(--muted)">{signLabel(s)}</span>)}</div>
          </>
        )}

        <button class="btn primary block" style="margin-top:24px" onClick={() => { draft.value = null; go('/'); }}>
          <Icon name="plus" />Nouveau cas
        </button>

        <p class="disclaimer">
          Aide à la décision : ne remplace pas l’examen clinique ni le jugement du vétérinaire. Vérifier toute posologie dans le RCP (ANMV).
        </p>
      </main>
    </>
  );
}

/** Conduite à tenir et quantités pour le poids de l'animal, quand un protocole standard existe */
function Treatment({ diseaseId }: { diseaseId: string }) {
  const d = draft.value!;
  const t = treatmentFor(diseaseId, d.species);
  if (!t) return null;
  const sp = speciesById(d.species);
  const esp = sp.proxy ?? sp.id;
  const missingWeight = !d.weight && t.lines.some(needsWeight);
  const askWeight = () => { step.value = buildSteps(d).findIndex((s) => s.id === 'weight'); go('/cas'); };
  return (
    <div>
      <div class="label">Conduite à tenir</div>
      {t.note && <p class="tx-note">{t.note}</p>}
      {missingWeight && (
        <div class="row" style="margin:4px 0 6px">
          <span class="grow fine">Poids non renseigné : quantités non calculées.</span>
          <button class="btn small" onClick={askWeight}>Saisir le poids</button>
        </div>
      )}
      <div class="tx">
        {t.lines.map((l, i) => {
          const dose = lineDose(l, d.weight);
          return (
            <div class="tx-row" key={i}>
              <div><div class="tx-phase">{l.phase}</div><div class="tx-what">{l.what}</div></div>
              <div class="tx-dose">{dose ?? ''}</div>
              <div class="tx-how">{l.how}</div>
              {(l.q || l.tool) && (
                <div class="tx-links">
                  {l.q && <a href={`#/medicaments?esp=${esp}&q=${encodeURIComponent(l.q)}`}>Spécialités et RCP</a>}
                  {l.tool && <a href={`#/outils/${l.tool}`}>Calculateur</a>}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p class="fine">
        {d.weight ? `Calculé pour ${String(d.weight).replace('.', ',')} kg. ` : ''}
        {sp.proxy ? `Posologies de l’espèce de référence (${speciesById(sp.proxy).label.toLowerCase()}), à adapter. ` : ''}
        Vérifier chaque dose dans le RCP{sp.food ? ', ainsi que les temps d’attente viande et lait' : ''}.
      </p>
    </div>
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

const CONFIDENCE_TEXT = {
  insuffisant: 'Éléments insuffisants pour orienter : la liste ci-dessous n’est qu’indicative. Complétez avec les signes proposés plus bas.',
  orientation: 'Orientation possible, à confirmer : recherchez les éléments proposés plus bas pour départager les hypothèses.',
};

function ConfidenceNote() {
  const c = confidence(analysis.value!.ddx);
  if (c === 'solide') return null;
  return <div class={`alert ${c === 'insuffisant' ? 'attention' : 'reg'}`}><p>{CONFIDENCE_TEXT[c]}</p></div>;
}

/** Éléments qui départageraient les hypothèses : un signe touché est ajouté au cas et le classement se met à jour */
function Refine() {
  const d = draft.value!;
  const a = analysis.value!;
  if (!a.ddx.length) return null;
  const { signs, labs } = discriminants(d.species, a.ddx, a.findings, 8, a.absent);
  if (!signs.length && !labs.length) return null;
  const add = (id: string) => { toggleSign(id); void persist(); };
  return (
    <>
      <div class="section-title">Pour affiner</div>
      <div class="card">
        {signs.length > 0 && (
          <>
            <p class="fine" style="margin:0 0 10px">Signes à rechercher. Touchez ceux qui sont présents : le classement se met à jour.</p>
            <div class="refine">
              {signs.map((x) => (
                <button key={x.id} class="chip sugg" onClick={() => add(x.id)}>
                  <Icon name="plus" />
                  <span><span class="refine-label">{x.label}</span><span class="refine-for">{x.supports.slice(0, 2).join(', ')}</span></span>
                </button>
              ))}
            </div>
          </>
        )}
        {labs.length > 0 && (
          <>
            <div class="label-line">Analyses utiles</div>
            <ul class="refine-labs">
              {labs.map((x) => <li key={x.id}>{x.label}<span class="muted"> · {x.supports.slice(0, 2).join(', ')}</span></li>)}
            </ul>
          </>
        )}
      </div>
    </>
  );
}
