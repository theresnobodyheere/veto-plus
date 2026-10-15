// Saisie d'un cas en questions successives : un choix fait passer à l'étape suivante,
// l'analyse se débloque dès qu'il y a assez de réponses et l'hypothèse en tête s'affiche en direct.
import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  draft, step, patch, setAnswer, setMeasure, freezeQuestions, toggleSign, setReport, setLab, removeLab,
  analysis, persist, canAnalyse, answeredCount, MIN_ANSWERS,
} from '../state/case';
import { speciesById } from '../data/species';
import { ANALYTES, analyteById, toCanonical } from '../data/analytes';
import { SIGN_GROUPS, signLabel, type SignGroup } from '../data/signs';
import { breedsFor } from '../data/breeds';
import { buildSteps, motifById, answerLabel, type Step, type Option } from '../data/wizard';
import { formatValue } from '../engine/interpret';
import { likelihood } from '../engine/ddx';
import { searchSigns, signsForSpecies } from '../engine/textSigns';
import { Icon } from '../components/Icon';
import { go } from '../lib/router';

export function Case() {
  const d = draft.value;
  if (!d) { go('/'); return null; }
  const steps = buildSteps(d);
  const i = Math.min(step.value, steps.length - 1);
  const s = steps[i];
  const sp = speciesById(d.species);

  const goTo = (n: number) => { step.value = Math.max(0, n); window.scrollTo(0, 0); };
  const finish = async () => { await persist(); go('/resultat'); };
  const next = () => {
    // En quittant les signes, les questions ciblées sont choisies d'après le classement du moment
    if (s.kind === 'signs') freezeQuestions();
    const st = buildSteps(draft.value!);
    if (i + 1 >= st.length) void finish();
    else goTo(i + 1);
  };
  // Un choix est visible un court instant avant de passer à la suite
  const pick = (stepId: string, answer: string) => { setAnswer(stepId, answer); setTimeout(next, 160); };

  return (
    <>
      <header class="wiz-top">
        <div class="wiz-row">
          <button class="back" onClick={() => (i === 0 ? go('/') : goTo(i - 1))} aria-label={i === 0 ? 'Retour : choix de l’animal' : 'Étape précédente'}>
            <Icon name="chevronLeft" />{i === 0 ? 'Animal' : 'Retour'}
          </button>
          {/* L'animal, choisi sur l'écran d'accueil, est la question 1 */}
          <span class="wiz-name">{s.name} · {i + 2}/{steps.length + 1}</span>
          <button class="wiz-skip" onClick={next} hidden={i === 0}>Passer</button>
        </div>
        <div class="wiz-progress"><div style={{ width: `${Math.round(((i + 2) / (steps.length + 1)) * 100)}%` }} /></div>
        <Recap steps={steps} current={i} onJump={goTo} species={sp.label} />
      </header>
      <main class="wiz">
        {i === 0 && sp.note && <div class="alert reg"><p>{sp.note}</p></div>}
        <StepView s={s} pick={pick} next={next} finish={finish} />
      </main>
      <AnalyseBar onAnalyse={finish} />
    </>
  );
}

function StepView({ s, pick, next, finish }: { s: Step; pick: (id: string, a: string) => void; next: () => void; finish: () => void }) {
  const d = draft.value!;
  const answer = d.answers?.[s.id];
  const head = (
    <>
      {s.kind === 'question' && <div class="wiz-eyebrow">Pour départager les hypothèses</div>}
      <h1 class="wiz-title">{s.title}</h1>
      {s.sub && <p class="wiz-sub">{s.sub}</p>}
      {s.norms && <Norms>{s.norms}</Norms>}
    </>
  );

  if (s.kind === 'choice') {
    const wide = (s.options ?? []).some((o) => (o.detail?.length ?? 0) > 28 || o.label.length > 22);
    return (
      <>
        {head}
        <div class={`opts ${wide ? 'one' : ''}`}>
          {s.options!.map((o) => <Opt key={o.id} o={o} sel={answer === o.id} onClick={() => pick(s.id, o.id)} />)}
        </div>
      </>
    );
  }

  if (s.kind === 'measure') return <MeasureStep s={s} head={head} pick={pick} next={next} />;

  if (s.kind === 'question') {
    return (
      <>
        {head}
        {!!s.supports?.length && <Norms>« Oui » orienterait vers {s.supports.join(' ou ')}.</Norms>}
        <div class="opts yn">
          <Opt o={{ id: 'oui', label: 'Oui' }} sel={answer === 'oui'} onClick={() => pick(s.id, 'oui')} />
          <Opt o={{ id: 'non', label: 'Non' }} sel={answer === 'non'} onClick={() => pick(s.id, 'non')} />
          <button class="opt ghost wide" onClick={() => { setAnswer(s.id, undefined); next(); }}>Ne sais pas</button>
        </div>
      </>
    );
  }

  if (s.kind === 'signs') return <SignsStep head={head} next={next} />;
  if (s.kind === 'breed') return <BreedStep head={head} next={next} />;

  if (s.kind === 'weight') {
    return (
      <>
        {head}
        <NumberEntry unit="kg" value={d.weight} placeholder="Poids" onDone={(n) => { patch({ weight: n, answers: { ...(d.answers ?? {}), weight: 'ok' } }); next(); }} />
      </>
    );
  }

  // Analyses : dernière étape (ou deuxième si le motif est un bilan)
  const last = buildSteps(d).at(-1)?.id === 'labs';
  return (
    <>
      {head}
      <LabEditor />
      {last && (
        <>
          <div class="section-title">Référence</div>
          <input type="text" name="reference-animal" autoComplete="off" autoCorrect="off" value={d.ref ?? ''}
            placeholder={speciesById(d.species).group === 'rurale' ? 'Élevage, n° animal (facultatif)' : 'Nom ou n° (facultatif)'} onInput={(e) => patch({ ref: e.currentTarget.value })} />
          <p class="section-foot">Elle reste sur cet iPhone.</p>
        </>
      )}
      <button class="btn primary block" style="margin-top:16px" onClick={last ? finish : next}>{last ? 'Voir le résultat' : 'Continuer'}</button>
    </>
  );
}

function Opt({ o, sel, onClick }: { o: Option; sel: boolean; onClick: () => void }) {
  return (
    <button class={`opt ${sel ? 'sel' : ''} ${o.normal ? 'normal' : ''} ${o.abnormal ? 'bad' : ''}`} onClick={onClick} aria-pressed={sel}>
      <span class="opt-t">{o.label}</span>
      {o.detail && <span class="opt-d">{o.detail}</span>}
    </button>
  );
}

function Norms({ children }: { children: preact.ComponentChildren }) {
  return <div class="norms"><Icon name="info" size={18} /><div>{children}</div></div>;
}

/** Saisie d'un nombre au clavier de l'iPhone, validée par OK ou la touche Entrée */
function NumberEntry({ unit, value, placeholder, onDone }: { unit: string; value?: number; placeholder: string; onDone: (n: number) => void }) {
  const [text, setText] = useState(value != null ? String(value).replace('.', ',') : '');
  useEffect(() => setText(value != null ? String(value).replace('.', ',') : ''), [value]);
  const n = parseFloat(text.replace(',', '.'));
  const ok = Number.isFinite(n) && n > 0;
  return (
    <div class="exact">
      <input type="text" inputMode="decimal" placeholder={placeholder} value={text} enterKeyHint="done"
        onInput={(e) => setText(e.currentTarget.value)} onKeyDown={(e) => { if (e.key === 'Enter' && ok) onDone(n); }} />
      <span class="exact-unit">{unit}</span>
      <button class="btn primary" disabled={!ok} onClick={() => onDone(n)}>OK</button>
    </div>
  );
}

function MeasureStep({ s, head, pick, next }: { s: Step; head: preact.ComponentChildren; pick: (id: string, a: string) => void; next: () => void }) {
  const d = draft.value!;
  const kind = s.measure!;
  const answer = d.answers?.[s.id];
  return (
    <>
      {head}
      {!!s.options?.length && (
        <div class="opts">
          {s.options.map((o) => <Opt key={o.id} o={o} sel={answer === o.id} onClick={() => pick(s.id, o.id)} />)}
        </div>
      )}
      <div class="wiz-eyebrow" style="margin-top:6px">Ou valeur mesurée</div>
      <NumberEntry unit={s.unit!} value={d[kind]} placeholder={kind === 'temp' ? 'ex. 39,8' : 'ex. 120'} onDone={(n) => { setMeasure(kind, n); next(); }} />
    </>
  );
}

function SignsStep({ head, next }: { head: preact.ComponentChildren; next: () => void }) {
  const d = draft.value!;
  const [q, setQ] = useState('');
  const all = useMemo(() => signsForSpecies(d.species), [d.species]);
  const available = new Set(all.map((x) => x.id));
  const motif = motifById(d.species, d.motif);
  const preset = new Set(motif?.signs ?? []);
  const sugg = (motif?.sugg ?? []).filter((id) => available.has(id) && !preset.has(id));
  const found = q ? searchSigns(q, d.species) : [];
  const chip = (id: string, label = signLabel(id)) => (
    <button key={id} class={`chip ${d.signs.includes(id) ? 'on' : ''}`} onClick={() => toggleSign(id)} aria-pressed={d.signs.includes(id)}>{label}</button>
  );
  return (
    <>
      {head}
      {sugg.length > 0 && <div class="chips">{sugg.map((id) => chip(id))}</div>}
      <div class="search" style="margin-top:6px">
        <input type="search" placeholder="Chercher un autre signe" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
      </div>
      {q ? (
        <div class="chips">{found.length ? found.map((x) => chip(x.id, x.label)) : <span class="muted">Aucun signe trouvé.</span>}</div>
      ) : (
        <div class="card" style="padding-top:0;padding-bottom:0">
          {(Object.keys(SIGN_GROUPS) as SignGroup[]).filter((g) => g !== 'bio').map((g) => {
            const items = all.filter((x) => x.group === g && !preset.has(x.id));
            if (!items.length) return null;
            const n = items.filter((x) => d.signs.includes(x.id)).length;
            return (
              <details class="group" key={g}>
                <summary>{SIGN_GROUPS[g]} {n > 0 && <span class="tag ok">{n}</span>}</summary>
                <div class="chips" style="padding-bottom:12px">{items.map((x) => chip(x.id, x.label))}</div>
              </details>
            );
          })}
        </div>
      )}
      <button class="btn block" style="margin-top:12px" onClick={next}>
        {d.signs.length ? `Suivant · ${d.signs.length} signe${d.signs.length > 1 ? 's' : ''}` : 'Aucun autre signe'}
      </button>
    </>
  );
}

function BreedStep({ head, next }: { head: preact.ComponentChildren; next: () => void }) {
  const d = draft.value!;
  const [q, setQ] = useState('');
  const names = useMemo(() => {
    const list = breedsFor(d.species).map((b) => b.name).sort((a, b) => a.localeCompare(b, 'fr'));
    return d.species === 'chien' ? ['Croisé', ...list] : list;
  }, [d.species]);
  const n = q.trim().toLowerCase();
  const shown = n ? names.filter((x) => x.toLowerCase().includes(n)) : names;
  const choose = (breed: string) => { patch({ breed, answers: { ...(d.answers ?? {}), breed: 'ok' } }); setTimeout(next, 160); };
  return (
    <>
      {head}
      <div class="search"><input type="search" placeholder="Chercher une race" value={q} onInput={(e) => setQ(e.currentTarget.value)} /></div>
      <div class="list" style="margin-top:10px">
        {shown.map((b) => (
          <button key={b} class="list-item" onClick={() => choose(b)} aria-pressed={d.breed === b}>
            <span class="grow">{b}</span>{d.breed === b && <Icon name="check" size={20} />}
          </button>
        ))}
        {!shown.length && <div class="list-item muted">Aucune race trouvée.</div>}
      </div>
    </>
  );
}

/** Réponses déjà données : un toucher ramène à l'étape */
function Recap({ steps, current, onJump, species }: { steps: Step[]; current: number; onJump: (i: number) => void; species: string }) {
  const d = draft.value!;
  const fr = (n: number) => String(n).replace('.', ',');
  const items = steps.map((s, i) => {
    const a = d.answers?.[s.id];
    let label: string | undefined;
    if (s.kind === 'measure' && a === 'exact' && d[s.measure!] != null) label = `${s.measure === 'temp' ? '' : `${s.name} `}${fr(d[s.measure!]!)}${s.measure === 'temp' ? ' °C' : '/min'}`;
    else if (s.kind === 'signs') label = d.signs.length ? `${d.signs.length} signe${d.signs.length > 1 ? 's' : ''}` : undefined;
    else if (s.kind === 'breed') label = d.breed;
    else if (s.kind === 'weight') label = d.weight ? `${fr(d.weight)} kg` : undefined;
    else if (s.kind === 'labs') label = d.labs.length ? `${d.labs.length} valeur${d.labs.length > 1 ? 's' : ''}` : undefined;
    else label = answerLabel(s, a);
    return { i, label };
  }).filter((x) => x.label && x.i !== current);
  return (
    <div class="recap">
      <button class="recap-chip" onClick={() => go('/')}>{species}</button>
      {items.map((x) => <button key={x.i} class="recap-chip" onClick={() => onJump(x.i)}>{x.label}</button>)}
    </div>
  );
}

/** Barre du bas : hypothèse en tête et bouton Analyser, débloqué dès qu'il y a assez de réponses */
function AnalyseBar({ onAnalyse }: { onAnalyse: () => void }) {
  const d = draft.value!;
  const a = analysis.value!;
  const ok = canAnalyse.value;
  const top = a.ddx[0];
  const critical = a.alerts.some((x) => x.level === 'critique');
  const left = Math.max(1, MIN_ANSWERS - answeredCount.value);
  let lead;
  if (ok && top) {
    const lk = likelihood(top, top.score);
    lead = <><span class="grow">En tête : <b>{top.disease.name}</b></span><span class={`lk-${lk}`}>{lk}</span></>;
  } else if (!d.motif && !d.labs.length) lead = <span>Choisissez le motif de consultation</span>;
  else if (answeredCount.value >= MIN_ANSWERS) lead = <span>Ajoutez au moins un signe pour analyser</span>;
  else lead = <span>Encore {left} réponse{left > 1 ? 's' : ''} pour analyser</span>;
  return (
    <div class="wiz-bar">
      {critical && <div class="wiz-alert"><Icon name="warning" size={16} />Alerte vitale : voir le résultat</div>}
      <div class="wiz-lead">{lead}</div>
      <button class="btn primary block" disabled={!ok} onClick={onAnalyse}>
        Analyser{ok ? ` · ${a.findings.length} élément${a.findings.length > 1 ? 's' : ''}` : ''}
      </button>
    </div>
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
  const fromReport = d.labs.filter((l) => l.source === 'ocr').length;

  const add = () => {
    const n = parseFloat(val.replace(',', '.'));
    if (!sel || !Number.isFinite(n)) return;
    const c = toCanonical(sel, n, unit || sel.unit);
    setLab({ analyte: sel.id, value: c ?? n, rawValue: n, rawUnit: unit || sel.unit, source: 'manuel' });
    setVal(''); setAid(''); setUnit('');
  };

  return (
    <section>
      <Norms>Touchez le champ ci-dessous, puis <b>Analyser le texte</b> : l’iPhone lit le compte rendu avec l’appareil photo, sans réseau. Les valeurs et les intervalles imprimés sont repris tout seuls.</Norms>
      <div class="card" style="margin-top:10px">
        <textarea class="report" name="compte-rendu" autoComplete="off" autoCorrect="off" spellcheck={false}
          placeholder="Touchez ici puis « Analyser le texte », ou collez le compte rendu"
          value={d.otherResults ?? ''} onInput={(e) => setReport(e.currentTarget.value)} />
        {!!d.otherResults?.trim() && (
          <p class={`fine row ${fromReport ? '' : 'crit-text'}`} style="margin:8px 0 4px;gap:6px">
            {fromReport ? <><Icon name="check" size={16} />{fromReport} valeur{fromReport > 1 ? 's' : ''} lue{fromReport > 1 ? 's' : ''} sur le compte rendu — vérifiez-les.</>
              : 'Aucune valeur reconnue : vérifiez le texte ou saisissez les valeurs.'}
          </p>
        )}
        {rows.length > 0 && (
          <table class="lab">
            <tbody>
              {rows.map((r) => (
                <tr key={r.analyte.id} class={r.status}>
                  <td class="name">{r.analyte.short}
                    {r.input.unitGuessed && <div class="guessed">unité devinée ({r.input.rawValue} → {r.analyte.unit})</div>}
                    {r.input.source !== 'manuel' && <span class="tag">{{ ia: 'Photo', ocr: 'Compte rendu', texte: 'Texte' }[r.input.source]}</span>}
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
