import { useEffect, useMemo, useState } from 'preact/hooks';
import {
  loadDrugs, filterDrugs, facet, withdrawal, concentration, doseOptions, matchesSpecies, recentDrugs, rememberDrug,
  SPECIES_FILTERS, CATEGORIES, FORMS, mainSubstance, type DrugDb, type DrugProduct, type DrugFilter,
} from '../data/drugs';
import { TopBar, Sheet, Chevron } from '../components/ui';
import { Icon } from '../components/Icon';
import { route } from '../lib/router';
import { speciesById, type SpeciesId } from '../data/species';
import { online } from '../state/status';
import { draft } from '../state/case';

const PAGE = 60;
const fmt = (n: number, d = 2) => n.toLocaleString('fr-FR', { maximumFractionDigits: d });
const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
const formLabel = (id: string) => FORMS.find((f) => f.id === id)?.label ?? id;
const spLabel = (id: SpeciesId) => SPECIES_FILTERS.find((f) => f.id === id)?.label ?? id;

export function Drugs() {
  const params = new URLSearchParams(route.value.split('?')[1] ?? '');
  const initialEsp = params.get('esp') as SpeciesId | null;
  const [db, setDb] = useState<DrugDb | null>(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState(params.get('q') ?? '');
  const [f, setF] = useState<DrugFilter>({ sp: SPECIES_FILTERS.some((x) => x.id === initialEsp) ? initialEsp! : undefined });
  const [shown, setShown] = useState(PAGE);
  const [sel, setSel] = useState<DrugProduct | null>(null);
  const [recent, setRecent] = useState<DrugProduct[]>([]);

  useEffect(() => { loadDrugs().then((d) => { setDb(d); setRecent(recentDrugs(d)); }).catch((e) => setErr(e.message)); }, []);
  useEffect(() => setShown(PAGE), [q, f]);

  const active = q.trim().length >= 2 || !!f.sp;
  const idx = useMemo(() => (db && active ? filterDrugs(db, { ...f, q }) : []), [db, q, f, active]);

  // Filtre suivant à proposer : classe, puis forme, puis substance (un niveau à une seule valeur est sauté)
  const next = useMemo(() => {
    if (!db || !active || idx.length < 2) return null;
    const levels = [
      { key: 'cat' as const, title: 'Classe thérapeutique', label: catLabel },
      { key: 'form' as const, title: 'Forme', label: formLabel },
      { key: 'sub' as const, title: 'Substance active', label: (s: string) => s },
    ];
    for (const l of levels) {
      if (f[l.key]) continue;
      const values = facet(db, idx, l.key);
      if (values.length > 1) return { ...l, values };
    }
    return null;
  }, [db, idx, f, active]);

  const open = (p: DrugProduct) => {
    rememberDrug(p);
    setSel(p);
    if (db) setRecent(recentDrugs(db));
  };
  const chosen: { key: keyof DrugFilter; label: string }[] = [
    f.cat ? { key: 'cat', label: catLabel(f.cat) } : null,
    f.form ? { key: 'form', label: formLabel(f.form) } : null,
    f.sub ? { key: 'sub', label: f.sub } : null,
  ].filter((x): x is { key: keyof DrugFilter; label: string } => !!x);
  // Retirer un filtre retire aussi les filtres plus fins choisis après lui
  const clearFrom = (key: keyof DrugFilter) => {
    const order: (keyof DrugFilter)[] = ['sp', 'cat', 'form', 'sub'];
    const n = { ...f };
    for (const k of order.slice(order.indexOf(key))) delete n[k];
    setF(n);
  };

  // Un nom saisi : les médicaments d'abord, les filtres pour affiner ensuite
  const searching = q.trim().length >= 2;
  const refine = db && (
    <>
      {next && (
        <>
          <div class="section-title">{searching ? `Affiner : ${next.title.toLowerCase()}` : next.title}</div>
          <div class="list">
            {next.values.slice(0, next.key === 'sub' ? 12 : 20).map((v) => (
              <button key={v.id} class="list-item" onClick={() => setF({ ...f, [next.key]: v.id })}>
                <span class="grow">{next.label(v.id)}</span>
                <span class="detail">{v.n}</span>
                <Chevron />
              </button>
            ))}
          </div>
          {next.key === 'sub' && next.values.length > 12 && <p class="section-foot">Autres substances : saisissez leur nom dans la recherche.</p>}
        </>
      )}
    </>
  );
  const results = db && (
    <>
      <div class="section-title">{idx.length ? `${idx.length.toLocaleString('fr-FR')} médicament${idx.length > 1 ? 's' : ''}` : 'Résultats'}</div>
      {idx.length === 0 ? <div class="empty">Aucun résultat.</div> : (
        <>
          <DrugList db={db} items={idx.slice(0, shown).map((i) => db.products[i])} onOpen={open} />
          {idx.length > shown && <button class="btn ghost" onClick={() => setShown(shown + PAGE)}>Afficher la suite</button>}
        </>
      )}
    </>
  );

  return (
    <>
      <TopBar title="Médicaments" large />
      <main>
        <input type="search" name="recherche-medicament" autoComplete="off" autoCorrect="off" autoCapitalize="off" spellcheck={false} enterKeyHint="search"
          placeholder="Nom, substance ou code ATCvet" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
        <div class="chips" style="margin:10px 0 0">
          {SPECIES_FILTERS.map((x) => (
            <button key={x.id} class={`chip ${f.sp === x.id ? 'on' : ''}`} aria-pressed={f.sp === x.id}
              onClick={() => (f.sp === x.id ? clearFrom('sp') : setF({ sp: x.id }))}>{x.label}</button>
          ))}
        </div>

        {err && <div class="alert attention" style="margin-top:12px"><b>Base non disponible</b><p>{online.value ? err : 'Hors ligne et base pas encore mise en cache : ouvrez une fois l’onglet avec du réseau.'}</p></div>}
        {!db && !err && <p class="center"><span class="spinner" /> Chargement de la base…</p>}

        {db && active && (
          <>
            {chosen.length > 0 && (
              <div class="chips" style="margin-top:8px">
                {chosen.map((c) => (
                  <button key={c.key} class="chip on" onClick={() => clearFrom(c.key)} aria-label={`Retirer le filtre ${c.label}`}>{c.label}<Icon name="xmark" /></button>
                ))}
              </div>
            )}
            {searching ? <>{results}{refine}</> : <>{refine}{results}</>}
          </>
        )}

        {db && !active && (
          <>
            {recent.length > 0 && (
              <>
                <div class="section-title">Consultés récemment</div>
                <DrugList db={db} items={recent} onOpen={open} />
              </>
            )}
            <p class="section-foot" style="margin-top:12px">
              Choisissez une espèce pour parcourir les médicaments par classe, forme puis substance, ou cherchez par nom.
              {' '}{db.products.length.toLocaleString('fr-FR')} médicaments autorisés · {db.source} · mise à jour du {new Date(db.date).toLocaleDateString('fr-FR')}.
            </p>
          </>
        )}
        {sel && db && <DrugSheet db={db} p={sel} sp={f.sp} onClose={() => setSel(null)} />}
      </main>
    </>
  );
}

function DrugList({ db, items, onOpen }: { db: DrugDb; items: DrugProduct[]; onOpen: (p: DrugProduct) => void }) {
  return (
    <div class="list">
      {items.map((p) => (
        <button key={p.amm + p.n} class="list-item" onClick={() => onOpen(p)}>
          <span class="grow">
            <b>{p.n}</b>
            <div class="sub clamp">{p.sa.map((s) => `${s[0]} ${s[1]} ${s[2]}`).join(' + ') || db.tables.fp[p.fp] || '—'}</div>
          </span>
          <Chevron />
        </button>
      ))}
    </div>
  );
}

function DrugSheet({ db, p, sp, onClose }: { db: DrugDb; p: DrugProduct; sp?: SpeciesId; onClose: () => void }) {
  const wd = withdrawal(db, p);
  // Espèces cibles du médicament ; par défaut celle du filtre, sinon celle du cas en cours
  const targets = SPECIES_FILTERS.filter((x) => matchesSpecies(db, p, x.id)).map((x) => x.id);
  const caseSp = draft.value ? (speciesById(draft.value.species).proxy ?? draft.value.species) : undefined;
  const [species, setSpecies] = useState<SpeciesId | undefined>(
    [sp, caseSp].find((x) => x && targets.includes(x)) ?? targets[0],
  );
  const { options, generic } = useMemo(() => {
    const own = doseOptions(p, species);
    return own.length ? { options: own, generic: false } : { options: doseOptions(p), generic: true };
  }, [p, species]);

  const [conc, setConc] = useState(String(concentration(p) ?? ''));
  const [w, setW] = useState(draft.value?.weight && species === caseSp ? String(draft.value.weight) : '');
  const [pick, setPick] = useState(0);
  useEffect(() => setPick(0), [species]);
  const opt = options[pick];
  const [dose, setDose] = useState('');
  // Dose pré-remplie avec la dose la plus citée du RCP pour l'espèce
  useEffect(() => {
    if (!opt) { setDose(''); return; }
    setDose(opt.mgkg != null ? fmt(opt.mgkg, 3) : fmt(opt.mlkg!, 3));
  }, [opt]);
  const volumeMode = !!opt && opt.mgkg == null; // RCP exprimé seulement en mL/kg, concentration inconnue

  const num = (s: string) => parseFloat(s.replace(/\s/g, '').replace(',', '.'));
  const kg = num(w);
  const perKg = num(dose);
  const c = num(conc);
  const mg = volumeMode ? NaN : kg * perKg;
  const ml = volumeMode ? kg * perKg : c > 0 ? mg / c : NaN;
  const Section = ({ t, v }: { t: string; v?: string }) => (v ? <><h3>{t}</h3><p class="pre">{v}</p></> : null);

  return (
    <Sheet title={p.n} onClose={onClose}>
      <div class="card">
        <dl class="kv">
          <dt>Substance(s)</dt><dd>{p.sa.map((s) => `${s[0]} ${s[1]} ${s[2]}`).join(' + ') || '—'}</dd>
          <dt>Forme</dt><dd>{db.tables.fp[p.fp] ?? '—'}</dd>
          <dt>Titulaire</dt><dd>{db.tables.tit[p.t] ?? '—'}</dd>
          <dt>AMM</dt><dd>{p.amm}</dd>
          {p.atc.length > 0 && <><dt>ATCvet</dt><dd>{p.atc.join(', ')}</dd></>}
        </dl>
      </div>

      <div class="section-title">Calcul de dose</div>
      <div class="card">
        {targets.length > 1 && (
          <div class="chips" style="margin-bottom:12px" role="group" aria-label="Espèce">
            {targets.map((t) => <button key={t} class={`chip ${species === t ? 'on' : ''}`} aria-pressed={species === t} onClick={() => setSpecies(t)}>{spLabel(t)}</button>)}
          </div>
        )}
        <div class="grid3">
          <div class="field"><label>Poids (kg)</label><input type="number" inputMode="decimal" value={w} onInput={(e) => setW(e.currentTarget.value)} /></div>
          <div class="field"><label>{volumeMode ? 'Volume (mL/kg)' : 'Dose (mg/kg)'}</label><input type="text" inputMode="decimal" value={dose} onInput={(e) => setDose(e.currentTarget.value)} /></div>
          <div class="field"><label>Conc. (mg/mL)</label><input type="text" inputMode="decimal" value={conc} placeholder="—" onInput={(e) => setConc(e.currentTarget.value)} /></div>
        </div>
        {kg > 0 && perKg > 0 && (
          <p style="margin-top:10px">
            {Number.isFinite(mg) && <><span class="result-big">{fmt(mg, 1)} mg</span>{Number.isFinite(ml) && ' soit '}</>}
            {Number.isFinite(ml) && <span class="result-big">{fmt(ml, 2)} mL</span>}
          </p>
        )}
        {opt ? (
          <p class="fine" style="margin-top:8px">
            {generic ? `Le RCP ne précise pas de dose pour ${spLabel(species!).toLowerCase()} : dose générale` : `Dose la plus citée dans le RCP${species ? ` pour ${spLabel(species).toLowerCase()}` : ''}`} : « {opt.text} ». Vérifiez l’indication correspondante dans la posologie ci-dessous.
          </p>
        ) : <p class="fine" style="margin-top:8px">Pas de dose lisible dans le RCP : saisissez-la d’après la posologie ci-dessous.</p>}
        {options.length > 1 && (
          <>
            <p class="fine" style="margin:8px 0 6px">Autres doses du RCP</p>
            <div class="chips">
              {options.slice(0, 5).map((o, i) => (
                <button key={o.text} class={`chip ${i === pick ? 'on' : ''}`} aria-pressed={i === pick} onClick={() => setPick(i)}>
                  {o.mgkg != null ? `${fmt(o.mgkg, 3)} mg/kg` : `${fmt(o.mlkg!, 3)} mL/kg`}
                </button>
              ))}
            </div>
          </>
        )}
        {p.sa.length > 1 && <p class="fine" style="margin-top:8px">Association de substances : dose et concentration de {mainSubstance(p).toLowerCase()}.</p>}
      </div>

      <div class="section-title">Temps d’attente</div>
      {wd.length ? (
        <div class="card flat">
          {wd.map((g) => (
            <p key={g.esp + g.denr}><b>{g.esp} — {g.denr}</b> : {g.values.join(' ; ')}</p>
          ))}
          <p class="fine">Valeurs structurées de la base ANMV : vérifier la posologie correspondante dans le texte du RCP ci-dessous.</p>
        </div>
      ) : <p class="section-foot" style="margin-top:0">Pas de temps d’attente structuré (animal de compagnie ou non renseigné).</p>}
      <Section t="Texte RCP — temps d’attente" v={p.tat} />

      <Section t="Espèces cibles" v={p.esp} />
      <Section t="Indications" v={p.ind} />
      <Section t="Posologie et voie d’administration" v={p.poso} />
      <Section t="Contre-indications" v={p.ci} />
      <Section t="Gestation / lactation" v={p.gest} />
      <Section t="Surdosage" v={p.sur} />
      {p.url && <p><a href={p.url} target="_blank" rel="noopener">RCP complet sur le site de l’ANMV</a></p>}
    </Sheet>
  );
}
