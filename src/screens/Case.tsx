import { useMemo, useRef, useState } from 'preact/hooks';
import { draft, patch, patchManual, setNotes, addPhotos, removePhoto, setPhotoKind, reading, toggleSign, setLab, removeLab, analysis, persist } from '../state/case';
import { speciesById } from '../data/species';
import { ANALYTES, analyteById, toCanonical } from '../data/analytes';
import { SIGN_GROUPS, signLabel, type SignGroup } from '../data/signs';
import { formatValue } from '../engine/interpret';
import { searchSigns, signsForSpecies } from '../engine/textSigns';
import { parseNotes } from '../engine/notes';
import { TopBar } from '../components/ui';
import { Icon } from '../components/Icon';
import { go } from '../lib/router';

/** Signes proposés en premier selon l'espèce */
const COMMON: Record<string, string[]> = {
  canine: ['abattement', 'anorexie', 'vomissements', 'diarrhee', 'pupd', 'fievre', 'amaigrissement', 'douleur_abdo', 'dyspnee', 'toux', 'muqueuses_pales', 'ictere', 'convulsions', 'boiterie'],
  rurale: ['fievre', 'abattement', 'anorexie', 'arret_rumination', 'chute_lait', 'diarrhee', 'decubitus', 'mise_bas_recente', 'toux', 'dyspnee', 'boiterie', 'avortement', 'plusieurs_animaux', 'amaigrissement'],
  equine: ['douleur_abdo', 'tachycardie', 'fievre', 'abattement', 'anorexie', 'boiterie', 'pouls_digites', 'diarrhee', 'toux', 'jetage', 'ataxie', 'ictere', 'sueurs', 'myalgie'],
  faune: ['abattement', 'anorexie', 'amaigrissement', 'diarrhee', 'boiterie', 'dyspnee', 'lesions_cutanees', 'mort_subite', 'plusieurs_animaux', 'fievre'],
};

export function Case() {
  const d = draft.value;
  if (!d) { go('/'); return null; }
  const sp = speciesById(d.species);
  const a = analysis.value!;

  const onAnalyse = async () => {
    await persist();
    go('/resultat');
  };

  return (
    <>
      <TopBar title={sp.label} backTo="/" backLabel="Cas" />
      <main>
        {sp.note && <div class="alert reg"><p>{sp.note}</p></div>}
        <Notes />
        <Photos />
        <Signalement />
        <LabEditor />
        <Signs />
        <div style="height:70px" />
      </main>
      <div class="sticky-action">
        <button class="btn primary" onClick={onAnalyse}>
          Analyser{a.findings.length ? ` · ${a.findings.length} élément${a.findings.length > 1 ? 's' : ''}` : ''}{a.alerts.some((x) => x.level === 'critique') ? ' · alerte vitale' : ''}
        </button>
      </div>
    </>
  );
}

function Signalement() {
  const d = draft.value!;
  const sp = speciesById(d.species);
  const herd = d.herd != null;
  const num = (v: string) => parseFloat(v.replace(',', '.'));
  return (
    <section>
      <div class="section-title">Animal</div>
      <div class="list form">
        <label class="form-row"><span class="form-label">Référence</span>
          <input class="wide" type="text" name="reference-animal" autoComplete="off" autoCorrect="off" value={d.ref ?? ''} placeholder={sp.group === 'rurale' ? 'Élevage, n° animal' : 'Facultatif'} onInput={(e) => patch({ ref: e.currentTarget.value })} /></label>
        <label class="form-row"><span class="form-label">Poids</span>
          <input type="text" inputMode="decimal" value={d.weight ?? ''} placeholder="—" onInput={(e) => patchManual({ weight: num(e.currentTarget.value) || undefined })} /><span class="form-unit">kg</span></label>
        <label class="form-row"><span class="form-label">Âge</span>
          <input class="wide" type="text" value={d.age ?? ''} placeholder="ex. 8 ans, 3 sem." onInput={(e) => patchManual({ age: e.currentTarget.value })} /></label>
        <label class="form-row"><span class="form-label">Sexe</span>
          <select value={d.sex ?? ''} onChange={(e) => patchManual({ sex: e.currentTarget.value || undefined })}>
            <option value="">Non précisé</option><option>Femelle</option><option>Femelle stérilisée</option><option>Mâle</option><option>Mâle castré</option>
          </select></label>
        {sp.group !== 'canine' && (
          <label class="form-row"><span class="form-label">Cas collectif (troupeau, lot)</span>
            <input type="checkbox" checked={herd} onChange={(e) => patchManual({ herd: e.currentTarget.checked ? (d.herd ?? {}) : undefined })} /></label>
        )}
        {herd && (['effectif', 'malades', 'morts'] as const).map((k) => (
          <label class="form-row" key={k}><span class="form-label">{{ effectif: 'Effectif', malades: 'Malades', morts: 'Morts' }[k]}</span>
            <input type="text" inputMode="numeric" value={d.herd?.[k] ?? ''} placeholder="—" onInput={(e) => {
              const n = parseInt(e.currentTarget.value) || undefined;
              const herdV = { ...(draft.value!.herd ?? {}), [k]: n };
              const signs = draft.value!.signs;
              patchManual({ herd: herdV });
              patch({ signs: (herdV.malades ?? 0) > 1 && !signs.includes('plusieurs_animaux') ? [...signs, 'plusieurs_animaux'] : signs });
            }} /></label>
        ))}
      </div>
      <p class="section-foot">La référence reste sur cet iPhone.</p>
    </section>
  );
}

function Photos() {
  const d = draft.value!;
  const r = reading.value;
  const input = useRef<HTMLInputElement>(null);
  return (
    <section>
      <div class="section-title">Photos</div>
      <div class="card">
        <div class="photos">
          <button class="add-photo" onClick={() => input.current?.click()}><Icon name="camera" />Ajouter</button>
          {d.photos.map((p, i) => (
            <div class="photo" key={p.url}>
              <img src={p.url} alt="" />
              <button class="x" onClick={() => removePhoto(i)} aria-label="Supprimer la photo"><Icon name="xmark" /></button>
              <select class="kind" value={p.kind} onChange={(e) => setPhotoKind(i, e.currentTarget.value as 'analyse' | 'clinique')} aria-label="Type de photo">
                {p.kind === 'auto' && <option value="auto">Tri…</option>}
                <option value="analyse">Analyses</option><option value="clinique">Clinique</option>
              </select>
            </div>
          ))}
        </div>
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = e.currentTarget.files; if (f?.length) void addPhotos(f); e.currentTarget.value = ''; }} />
        {r.status !== 'idle' && (
          <div class={`reading ${r.status === 'error' ? 'error' : ''}`}>
            <div class="row">{r.status === 'running' && <span class="spinner" />}<span>{r.message}</span></div>
            {r.status === 'running' && r.progress != null && <div class="progress"><div style={{ width: `${Math.round(r.progress * 100)}%` }} /></div>}
          </div>
        )}
      </div>
      <p class="section-foot">Comptes rendus d’analyses et photos cliniques (lésion, échographie, ECG…) : Véto+ les trie tout seul. Les valeurs sont lues sur l’iPhone, sans réseau ; les photos cliniques sont conservées avec le cas. Le type reste modifiable sous chaque photo.</p>
    </section>
  );
}

function LabEditor() {
  const d = draft.value!;
  const rows = analysis.value!.rows;
  const [adding, setAdding] = useState(false);
  const [aid, setAid] = useState('');
  const [val, setVal] = useState('');
  const [unit, setUnit] = useState('');
  const sel = analyteById(aid);

  const add = () => {
    const n = parseFloat(val.replace(',', '.'));
    if (!sel || !Number.isFinite(n)) return;
    const c = toCanonical(sel, n, unit || sel.unit);
    setLab({ analyte: sel.id, value: c ?? n, rawValue: n, rawUnit: unit || sel.unit, source: 'manuel' });
    setVal(''); setAid(''); setUnit('');
  };

  return (
    <section>
      <div class="section-title">Résultats d’analyses {rows.length ? `(${rows.length})` : ''}</div>
      <div class="card">
        {rows.length > 0 && (
          <table class="lab">
            <tbody>
              {rows.map((r) => (
                <tr key={r.analyte.id} class={r.status}>
                  <td class="name">{r.analyte.short}
                    {r.input.unitGuessed && <div class="guessed">unité devinée ({r.input.rawValue} → {r.analyte.unit})</div>}
                    {r.input.source !== 'manuel' && <span class="tag">{{ ia: 'Photo', ocr: 'Photo', texte: 'Texte' }[r.input.source]}</span>}
                  </td>
                  <td class="val">
                    <input type="text" inputMode="decimal" value={formatValue(r.analyte, r.value)}
                      onChange={(e) => {
                        const n = parseFloat(e.currentTarget.value.replace(/\s/g, '').replace(',', '.'));
                        if (Number.isFinite(n)) setLab({ ...r.input, value: n, source: 'manuel', unitGuessed: false });
                      }} />
                  </td>
                  <td class="ref">{r.analyte.unit}<br />{r.range ? `${formatValue(r.analyte, r.range[0])}–${formatValue(r.analyte, r.range[1])}` : 'pas de réf.'}</td>
                  <td class="flag">{r.status === 'high' ? '↑' : r.status === 'low' ? '↓' : ''}</td>
                  <td><button class="btn small ghost icon-only" onClick={() => removeLab(r.analyte.id)} aria-label={`Supprimer ${r.analyte.short}`}><Icon name="xmark" size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {d.otherResults && <p class="pre muted" style="margin-top:8px"><b>Autres résultats lus :</b> {d.otherResults}</p>}
        {!adding ? (
          <button class="btn ghost" onClick={() => setAdding(true)}><Icon name="plus" size={20} />Saisir une valeur</button>
        ) : (
          <div class="stack" style="margin-top:10px">
            <select value={aid} onChange={(e) => { setAid(e.currentTarget.value); setUnit(''); }}>
              <option value="">Choisir l’analyte…</option>
              {ANALYTES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
            </select>
            {sel && (
              <div class="row">
                <input type="text" inputMode="decimal" placeholder="Valeur" value={val} onInput={(e) => setVal(e.currentTarget.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
                <select value={unit} onChange={(e) => setUnit(e.currentTarget.value)} style="max-width:42%">
                  <option value="">{sel.unit || '—'}</option>
                  {Object.keys(sel.units).filter((u) => u && u !== sel.unit.toLowerCase()).map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <button class="btn primary small" style="min-height:44px;border-radius:10px" onClick={add}>Ajouter</button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Signs() {
  const d = draft.value!;
  const sp = speciesById(d.species);
  const [q, setQ] = useState('');
  const all = useMemo(() => signsForSpecies(d.species), [d.species]);
  const found = q ? searchSigns(q, d.species) : [];
  const common = COMMON[sp.group].filter((id) => all.some((s) => s.id === id));
  const labF = analysis.value!.labFindings;

  return (
    <section>
      <div class="section-title">Signes cliniques et contexte</div>
      <div class="card">
        {d.signs.length > 0 && (
          <div class="chips" style="margin-bottom:10px">
            {d.signs.map((id) => <button key={id} class="chip on" onClick={() => toggleSign(id)} aria-label={`Retirer ${signLabel(id)}`}>{signLabel(id)}<Icon name="xmark" /></button>)}
          </div>
        )}
        {labF.length > 0 && (
          <div class="chips" style="margin-bottom:10px">
            {labF.map((id) => <span key={id} class="chip lab"><Icon name="flask" />{signLabel(id)}</span>)}
          </div>
        )}
        <div class="search">
          <input type="search" placeholder="Rechercher un signe" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        </div>
        {q && (
          <div class="chips" style="margin-top:8px">
            {found.length ? found.map((s) => (
              <button key={s.id} class={`chip ${d.signs.includes(s.id) ? 'on' : ''}`} onClick={() => { toggleSign(s.id); setQ(''); }}>{s.label}</button>
            )) : <span class="muted">Aucun signe trouvé : ajoutez-le dans le commentaire.</span>}
          </div>
        )}
        {!q && (
          <>
            <div class="chips" style="margin:10px 0">
              {common.map((id) => (
                <button key={id} class={`chip ${d.signs.includes(id) ? 'on' : ''}`} onClick={() => toggleSign(id)}>{signLabel(id)}</button>
              ))}
            </div>
            {(Object.keys(SIGN_GROUPS) as SignGroup[]).filter((g) => g !== 'bio').map((g) => {
              const items = all.filter((s) => s.group === g);
              if (!items.length) return null;
              const n = items.filter((s) => d.signs.includes(s.id)).length;
              return (
                <details class="group" key={g}>
                  <summary>{SIGN_GROUPS[g]} {n > 0 && <span class="tag ok">{n}</span>}</summary>
                  <div class="chips">
                    {items.map((s) => <button key={s.id} class={`chip ${d.signs.includes(s.id) ? 'on' : ''}`} onClick={() => toggleSign(s.id)}>{s.label}</button>)}
                  </div>
                </details>
              );
            })}
          </>
        )}
      </div>
    </section>
  );
}

function Notes() {
  const d = draft.value!;
  const auto = d.auto;
  const vitals = useMemo(() => parseNotes(d.notes, d.species), [d.notes, d.species]);
  // Ce qui a été repris du texte, pour que le vétérinaire voie ce qui a été rempli
  const filled = auto ? [
    vitals.temp != null && `T ${String(vitals.temp).replace('.', ',')} °C`,
    vitals.hr != null && `FC ${vitals.hr}/min`,
    auto.weight && d.weight != null && `poids ${d.weight} kg`,
    auto.age && d.age && `âge ${d.age}`,
    auto.sex && d.sex && d.sex.toLowerCase(),
    auto.herd && d.herd && 'effectifs',
    auto.signs.length > 0 && `${auto.signs.length} signe${auto.signs.length > 1 ? 's' : ''}`,
    auto.labs.length > 0 && `${auto.labs.length} valeur${auto.labs.length > 1 ? 's' : ''}`,
  ].filter(Boolean) as string[] : [];
  return (
    <section>
      <div class="section-title">Anamnèse et commentaire</div>
      <div class="card">
        <textarea name="anamnese" autoComplete="off" placeholder="Âge, poids, signes, contexte, résultats… (anonyme)" value={d.notes}
          onInput={(e) => setNotes(e.currentTarget.value)} />
        {filled.length > 0 && (
          <p class="fine row" style="margin-top:8px;gap:6px"><Icon name="check" size={16} />Repris du texte : {filled.join(', ')}.</p>
        )}
      </div>
      <p class="section-foot">Pour dicter : touchez le champ, puis le micro en bas à droite du clavier. Le texte remplit la page tout seul ; vos modifications à la main sont conservées.</p>
    </section>
  );
}
