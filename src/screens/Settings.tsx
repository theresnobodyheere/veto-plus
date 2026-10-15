import { useEffect, useRef, useState } from 'preact/hooks';
import { TopBar, toast, DepartementSelect } from '../components/ui';
import { Icon } from '../components/Icon';
import { settings, updateSettings, setDepartement, contactsForDepartement, DEFAULT_CONTACTS, type ProviderId } from '../state/settings';
import { departementByCode } from '../data/departements';
import { services, STATE_LABEL } from '../state/status';
import { testProvider } from '../ai/router';
import { PROVIDER_LABEL, PROVIDER_KEY_URL } from '../ai/providers';
import { SPECIES, type SpeciesId } from '../data/species';
import { ANALYTES } from '../data/analytes';
import { RANGES } from '../data/ranges';
import { db, exportAll, importAll } from '../db/db';
import { loadDrugs } from '../data/drugs';

const HINT: Record<ProviderId, string> = {
  gemini: 'Le meilleur pour lire les photos. Offre gratuite : les données peuvent servir à améliorer les modèles de Google.',
  mistral: 'Entreprise française. Offre gratuite « Experiment » (vérification par téléphone) : les données peuvent servir à améliorer les modèles de Mistral.',
};

export function Settings() {
  return (
    <>
      <TopBar title="Réglages" large />
      <main>
        <AiSettings />
        <Clinic />
        <ContactsEdit />
        <Ranges />
        <Data />
        <About />
      </main>
    </>
  );
}

function AiSettings() {
  const s = settings.value;
  const [busy, setBusy] = useState<ProviderId | null>(null);
  const [result, setResult] = useState<Partial<Record<ProviderId, string>>>({});
  const test = async (p: ProviderId) => {
    setBusy(p);
    const r = await testProvider(p);
    setResult({ ...result, [p]: r });
    setBusy(null);
  };
  return (
    <>
      <div class="section-title">Intelligence artificielle</div>
      <div class="card">
        <label class="row"><input type="checkbox" checked={s.aiEnabled} onChange={(e) => updateSettings({ aiEnabled: e.currentTarget.checked })} /> Utiliser l’IA avec le réseau</label>
      </div>
      <p class="section-foot" style="margin-bottom:18px">Ordre d’essai : Gemini, puis Mistral. Si Gemini est en panne ou a atteint son quota, Mistral prend le relais automatiquement. Les clés restent sur cet iPhone. Aucune référence d’animal ni de propriétaire n’est envoyée.</p>
      {s.order.map((p) => {
        const st = services.value[p];
        const tone = st.state === 'ok' ? 'ok' : ['inconnu', 'sans-cle'].includes(st.state) ? '' : 'crit';
        return (
          <div class="card" key={p}>
            <div class="row"><b class="grow">{PROVIDER_LABEL[p]}</b><span class={`tag ${tone}`}>{s.keys[p] ? STATE_LABEL[st.state] : 'clé manquante'}</span></div>
            <p class="fine" style="margin:2px 0 10px">{HINT[p]}</p>
            <div class="row">
              <input type="password" autoComplete="off" placeholder="Coller la clé API" value={s.keys[p]}
                onInput={(e) => updateSettings({ keys: { ...settings.value.keys, [p]: e.currentTarget.value.trim() }, models: { ...settings.value.models, [p]: undefined } })} />
              <button class="btn small" disabled={!s.keys[p] || busy === p} onClick={() => test(p)}>{busy === p ? <span class="spinner" /> : 'Tester'}</button>
            </div>
            {result[p] && <p class="row" style={`font-size:15px;color:var(--${st.state === 'ok' ? 'ok' : 'crit'})`}><Icon name={st.state === 'ok' ? 'check' : 'warning'} size={18} />{st.state === 'ok' ? 'Modèle : ' : ''}{result[p]}</p>}
            <a href={PROVIDER_KEY_URL[p]} target="_blank" rel="noopener" style="display:inline-block;font-size:15px;margin-top:8px">Obtenir une clé gratuite ↗</a>
          </div>
        );
      })}
    </>
  );
}

function Ranges() {
  const [sp, setSp] = useState<SpeciesId>('chien');
  const custom = settings.value.customRanges[sp] ?? {};
  const set = (id: string, i: 0 | 1, v: string) => {
    const n = parseFloat(v.replace(',', '.'));
    const base = custom[id] ?? RANGES[sp]?.[id] ?? [NaN, NaN];
    const next: [number, number] = [...base] as [number, number];
    next[i] = n;
    const table = { ...custom };
    if (!Number.isFinite(next[0]) || !Number.isFinite(next[1])) delete table[id];
    else table[id] = next;
    updateSettings({ customRanges: { ...settings.value.customRanges, [sp]: table } });
  };
  const reset = () => {
    const cr = { ...settings.value.customRanges };
    delete cr[sp];
    updateSettings({ customRanges: cr });
  };
  const n = Object.keys(custom).length;
  return (
    <>
      <div class="section-title">Intervalles de la clinique</div>
      <details class="card">
        <summary>Adapter aux automates de la clinique {n > 0 && <span class="tag ok">{n} modifié{n > 1 ? 's' : ''}</span>}</summary>
        <p class="fine">Prioritaires sur les valeurs bibliographiques (mais l’intervalle imprimé sur un compte rendu reste prioritaire). Unités SI.</p>
        <select value={sp} onChange={(e) => setSp(e.currentTarget.value as SpeciesId)}>
          {SPECIES.filter((s) => !s.proxy).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <table class="lab" style="margin-top:8px">
          <tbody>
            {ANALYTES.map((a) => {
              const def = RANGES[sp]?.[a.id];
              const cur = custom[a.id];
              return (
                <tr key={a.id}>
                  <td class="name">{a.short}<div class="unit-line">{a.unit}</div></td>
                  <td><input type="text" inputMode="decimal" placeholder={def ? String(def[0]) : '—'} value={cur ? String(cur[0]) : ''} onChange={(e) => set(a.id, 0, e.currentTarget.value)} class={cur ? 'custom' : ''} /></td>
                  <td><input type="text" inputMode="decimal" placeholder={def ? String(def[1]) : '—'} value={cur ? String(cur[1]) : ''} onChange={(e) => set(a.id, 1, e.currentTarget.value)} class={cur ? 'custom' : ''} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {n > 0 && <button class="btn small danger" onClick={reset}>Revenir aux valeurs de référence</button>}
      </details>
    </>
  );
}

function ContactsEdit() {
  const cs = settings.value.contacts;
  const upd = (i: number, k: 'label' | 'phone', v: string) => updateSettings({ contacts: cs.map((c, j) => (j === i ? { ...c, [k]: v, ...(k === 'label' ? { custom: true } : {}) } : c)) });
  return (
    <>
      <div class="section-title">Contacts utiles</div>
      <details class="card">
        <summary>Modifier les numéros</summary>
        {cs.map((c, i) => (
          <div key={c.id} class="stack" style="margin:0 0 12px;padding-bottom:12px;box-shadow:inset 0 -0.5px 0 var(--line)">
            <textarea class="contact-label" rows={1} value={c.label} aria-label="Nom du contact" onInput={(e) => upd(i, 'label', e.currentTarget.value)} />
            <input type="tel" inputMode="tel" placeholder="Téléphone" value={c.phone} onInput={(e) => upd(i, 'phone', e.currentTarget.value)} />
            {c.note && <small>{c.note}</small>}
          </div>
        ))}
        <div class="row">
          <button class="btn small" onClick={() => updateSettings({ contacts: [...cs, { id: `c${Date.now()}`, label: 'Nouveau contact', phone: '' }] })}><Icon name="plus" />Ajouter</button>
          <button class="btn small ghost" onClick={() => confirm('Remettre les contacts par défaut ?') && updateSettings({ contacts: contactsForDepartement(DEFAULT_CONTACTS, departementByCode(settings.value.departement)) })}>Réinitialiser</button>
        </div>
      </details>
    </>
  );
}

function Clinic() {
  const s = settings.value;
  return (
    <>
      <div class="section-title">Clinique</div>
      <div class="card stack">
        <div class="field"><label>Département</label><DepartementSelect value={s.departement ?? ''} onChange={(c) => setDepartement(c || null)} /></div>
        <div class="field"><label>Nom de la clinique (en-tête des PDF)</label>
          <input type="text" value={s.clinicName} onInput={(e) => updateSettings({ clinicName: e.currentTarget.value })} /></div>
        <div class="field"><label>Vétérinaire (en-tête des PDF)</label>
          <input type="text" value={s.vetName} onInput={(e) => updateSettings({ vetName: e.currentTarget.value })} /></div>
      </div>
      <p class="section-foot">Le département adapte les contacts, les repères épidémiologiques et l’avis de l’IA. Ces informations restent sur cet iPhone.</p>
    </>
  );
}

function Data() {
  const [count, setCount] = useState<number | null>(null);
  const [drugDate, setDrugDate] = useState<string>('');
  const [usage, setUsage] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    db.cases.count().then(setCount).catch(() => {});
    loadDrugs().then((d) => setDrugDate(new Date(d.date).toLocaleDateString('fr-FR'))).catch(() => setDrugDate('non chargée'));
    navigator.storage?.estimate?.().then((e) => setUsage(`${((e.usage ?? 0) / 1e6).toFixed(0)} Mo utilisés`)).catch(() => {});
  }, []);
  const doExport = async () => {
    const blob = await exportAll();
    const name = `veto-plus-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    const f = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f] }); return; } catch { /* annulé */ } }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
  };
  return (
    <>
      <div class="section-title">Données</div>
      <div class="card">
        <dl class="kv">
          <dt>Cas enregistrés</dt><dd>{count ?? '…'}</dd>
          <dt>Base médicaments ANMV</dt><dd>{drugDate || '…'}</dd>
          {usage && <><dt>Stockage</dt><dd>{usage}</dd></>}
        </dl>
        <div class="row wrap" style="margin-top:10px">
          <button class="btn small" onClick={doExport}><Icon name="share" />Exporter</button>
          <button class="btn small" onClick={() => file.current?.click()}>Importer une sauvegarde</button>
        </div>
        <input ref={file} type="file" accept="application/json,.json" hidden onChange={async (e) => {
          const f = e.currentTarget.files?.[0];
          if (!f) return;
          try { const n = await importAll(f); toast(`${n} cas importés`); setCount(await db.cases.count()); } catch (err) { toast(`Import impossible : ${(err as Error).message}`); }
          e.currentTarget.value = '';
        }} />
        <p class="fine" style="margin-top:10px">La base médicaments est mise à jour avec chaque nouvelle version de l’appli (chaque mois).</p>
      </div>
    </>
  );
}

function About() {
  return (
    <>
      <div class="section-title">À propos</div>
      <div class="card" style="font-size:15px">
        <p><b>Véto+</b> {__APP_VERSION__} — aide au diagnostic vétérinaire mixte.</p>
        <p><b>Installer sur l’iPhone :</b> dans Safari, touchez Partager, puis « Sur l’écran d’accueil ». L’appli fonctionne ensuite hors ligne.</p>
        <p><b>Sources :</b> Merck Veterinary Manual ; Kaneko, Clinical Biochemistry of Domestic Animals ; Ettinger ; Constable (Radostits) ; Smith ; consensus ACVIM, IRIS, ISFM, AAHA, WSAVA ; Fowler (faune) ; base publique des médicaments vétérinaires ANMV/Anses (data.gouv.fr) ; DGAL et règlement (UE) 2016/429.</p>
        <p class="muted">Outil d’aide à la décision destiné aux vétérinaires. Il ne remplace ni l’examen clinique ni le jugement professionnel. Les posologies doivent être vérifiées dans le RCP.</p>
      </div>
    </>
  );
}
