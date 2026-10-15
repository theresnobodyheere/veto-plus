import { useState } from 'preact/hooks';
import { Fragment } from 'preact';
import type { ComponentChildren } from 'preact';
import { TopBar, Chevron } from '../components/ui';
import { Icon } from '../components/Icon';
import { go, route } from '../lib/router';
import { fluidPlan, calfDehydration, calfBaseDeficit, bicarbonate, BLOOD_VOLUME, transfusion, rer, MER_FACTORS, anionGap, calcOsmolality, correctedNa, correctedCl, GESTATION } from '../engine/calc';
import { ANALYTES, analyteById, toCanonical } from '../data/analytes';
import { REGULATED, CAT_HELP } from '../data/regulated';
import { WILDLIFE, HERPES_B_PROTOCOL } from '../data/wildlife';
import { RANGES } from '../data/ranges';
import { settings } from '../state/settings';
import { departementByCode, annuaireUrl } from '../data/departements';

const num = (s: string) => parseFloat(s.replace(',', '.'));
const fmt = (n: number, d = 0) => (Number.isFinite(n) ? n.toLocaleString('fr-FR', { maximumFractionDigits: d }) : '—');

const TOOLS = [
  { path: 'fluides', label: 'Fluidothérapie', sub: 'Déficit, entretien, débit, gouttes/min' },
  { path: 'veau', label: 'Veau diarrhéique', sub: 'Déshydratation, acidose, bicarbonate' },
  { path: 'transfusion', label: 'Transfusion', sub: 'Volume de sang total' },
  { path: 'electrolytes', label: 'Électrolytes', sub: 'Trou anionique, osmolalité, Na et Cl corrigés' },
  { path: 'energie', label: 'Besoins énergétiques', sub: 'RER / MER chien et chat' },
  { path: 'dose', label: 'Dose rapide', sub: 'mg/kg → mL' },
  { path: 'conversion', label: 'Conversion d’unités', sub: 'mg/dL ↔ µmol/L…' },
  { path: 'gestation', label: 'Date de mise bas', sub: 'Durées de gestation' },
  { path: 'reglementaire', label: 'Maladies réglementées', sub: 'Catégories, conduite, contacts' },
  { path: 'faune', label: 'Faune et primates', sub: 'Zoonoses, herpès B, sécurité' },
];

export function Tools() {
  const sub = route.value.split('/')[2];
  const tool = TOOLS.find((t) => t.path === sub);
  if (!tool) {
    return (
      <>
        <TopBar title="Outils" large />
        <main>
          <div class="list">
            {TOOLS.map((t) => (
              <button key={t.path} class="list-item" onClick={() => go(`/outils/${t.path}`)}>
                <span class="grow"><b>{t.label}</b><div class="sub">{t.sub}</div></span>
                <Chevron />
              </button>
            ))}
          </div>
        </main>
      </>
    );
  }
  const C = { fluides: Fluids, veau: Calf, transfusion: Transfusion, electrolytes: Electrolytes, energie: Energy, dose: Dose, conversion: Conversion, gestation: Gestation, reglementaire: Regulated, faune: Wildlife }[tool.path as 'fluides']!;
  return (
    <>
      <TopBar title={tool.label} backTo="/outils" backLabel="Outils" />
      <main><C /></main>
    </>
  );
}

// ——— Formulaires en liste groupée : étiquette à gauche, valeur et unité à droite (toute la ligne est touchable) ———
const Row = ({ label, unit, children }: { label: string; unit?: string; children: ComponentChildren }) => (
  <label class="form-row"><span class="form-label">{label}</span>{children}{unit && <span class="form-unit">{unit}</span>}</label>
);
const Form = ({ title = 'Données', children }: { title?: string; children: ComponentChildren }) => (
  <><div class="section-title">{title}</div><div class="list form">{children}</div></>
);
const N = ({ v, set, ph }: { v: string; set: (s: string) => void; ph?: string }) => (
  <input type="text" inputMode="decimal" value={v} placeholder={ph ?? '—'} onInput={(e) => set(e.currentTarget.value)} />
);
const Sel = ({ v, set, children }: { v: string; set: (s: string) => void; children: ComponentChildren }) => (
  <select value={v} onChange={(e) => set(e.currentTarget.value)}>{children}</select>
);
const SPECIES_OPTS = ['chien', 'chat', 'bovin', 'ovin', 'caprin', 'cheval', 'porc'];
const SpeciesSel = ({ v, set }: { v: string; set: (s: string) => void }) => (
  <Sel v={v} set={set}>{SPECIES_OPTS.map((s) => <option key={s} value={s}>{s === 'cheval' ? 'Équidé' : s[0].toUpperCase() + s.slice(1)}</option>)}</Sel>
);
/** Résultat principal en grand, puis le détail */
const Hero = ({ label, value, sub }: { label: string; value: string; sub?: ComponentChildren }) => (
  <div class="hero"><div class="hero-label">{label}</div><div class="hero-value">{value}</div>{sub && <div class="hero-sub">{sub}</div>}</div>
);
const Result = ({ children }: { children: ComponentChildren }) => (
  <><div class="section-title">Résultat</div><div class="card">{children}</div></>
);
const Foot = ({ children }: { children: ComponentChildren }) => <p class="section-foot">{children}</p>;
const Empty = ({ children }: { children: ComponentChildren }) => <p class="section-foot">{children}</p>;

function Fluids() {
  const [sp, setSp] = useState('chien');
  const [kg, setKg] = useState('');
  const [pct, setPct] = useState('');
  const [loss, setLoss] = useState('');
  const [h, setH] = useState('24');
  const [young, setYoung] = useState(false);
  const [gtt, setGtt] = useState('20');
  const p = fluidPlan({ species: sp, kg: num(kg), dehydPct: num(pct) || 0, lossesMl: num(loss) || 0, correctH: num(h) || 24, young, dropsPerMl: num(gtt) });
  const ok = num(kg) > 0;
  const hours = Math.max(1, Math.min(24, num(h) || 24));
  return (
    <>
      <Form>
        <Row label="Espèce"><SpeciesSel v={sp} set={setSp} /></Row>
        {!['chien', 'chat'].includes(sp) && <label class="form-row"><span class="form-label">Nouveau-né</span><input type="checkbox" checked={young} onChange={(e) => setYoung(e.currentTarget.checked)} /></label>}
        <Row label="Poids" unit="kg"><N v={kg} set={setKg} /></Row>
        <Row label="Déshydratation" unit="%"><N v={pct} set={setPct} ph="ex. 8" /></Row>
        <Row label="Pertes en cours" unit="mL/24 h"><N v={loss} set={setLoss} ph="0" /></Row>
        <Row label="Corriger le déficit en" unit="h"><N v={h} set={setH} /></Row>
        <Row label="Perfuseur" unit="gouttes/mL">
          <Sel v={gtt} set={setGtt}><option value="20">20</option><option value="60">60 (pédiatrique)</option><option value="15">15</option><option value="10">10 (gros débit)</option></Sel>
        </Row>
      </Form>
      {ok ? (
        <>
          <Result>
            <Hero label={`Débit pendant ${fmt(hours)} h`} value={`${fmt(p.rateFirst)} mL/h`}
              sub={<>{fmt(p.dropsPerMin, 1)} gouttes/min · 1 goutte toutes les {fmt(p.secPerDrop, 1)} s{hours < 24 ? <><br />Ensuite : {fmt(p.rateAfter)} mL/h</> : null}</>} />
            <dl class="kv">
              <dt>Déficit</dt><dd>{fmt(p.deficit)} mL</dd>
              <dt>Entretien / 24 h</dt><dd>{fmt(p.maint)} mL</dd>
              <dt>Pertes / 24 h</dt><dd>{fmt(p.losses)} mL</dd>
              <dt>Total 24 h</dt><dd>{fmt(p.total)} mL</dd>
            </dl>
          </Result>
          <Foot>Entretien : {p.formula}. Déficit = poids × % × 10. Réévaluer régulièrement (poids, diurèse, Ht/PT, lactates).</Foot>
        </>
      ) : <Empty>Saisissez le poids pour obtenir le plan de perfusion.</Empty>}
    </>
  );
}

function Calf() {
  const [kg, setKg] = useState('45');
  const [eye, setEye] = useState('');
  const [post, setPost] = useState<'debout-tete' | 'debout-faible' | 'sternal' | 'lateral'>('debout-faible');
  const [old, setOld] = useState(false);
  const [bdMeasured, setBd] = useState('');
  const bd = num(bdMeasured) || calfBaseDeficit(post, old);
  const b = bicarbonate(num(kg), bd, 0.6);
  const dehyd = eye ? calfDehydration(num(eye)) : null;
  return (
    <>
      <Form>
        <Row label="Poids" unit="kg"><N v={kg} set={setKg} /></Row>
        <Row label="Enfoncement de l’œil" unit="mm"><N v={eye} set={setEye} ph="0–10" /></Row>
        <Row label="Posture">
          <Sel v={post} set={(v) => setPost(v as typeof post)}>
            <option value="debout-tete">Debout, succion forte</option>
            <option value="debout-faible">Debout, succion faible</option>
            <option value="sternal">Décubitus sternal</option>
            <option value="lateral">Décubitus latéral</option>
          </Sel>
        </Row>
        <label class="form-row"><span class="form-label">Plus de 8 jours</span><input type="checkbox" checked={old} onChange={(e) => setOld(e.currentTarget.checked)} /></label>
        <Row label="Déficit en bases mesuré" unit="mmol/L"><N v={bdMeasured} set={setBd} ph="facultatif" /></Row>
      </Form>
      {num(kg) > 0 && bd > 0 ? (
        <Result>
          <Hero label="Bicarbonate à apporter" value={`${fmt(b.mmol)} mmol`}
            sub={<>Déficit en bases {bdMeasured ? 'mesuré' : 'estimé'} : {bd} mmol/L{dehyd ? <><br />Déshydratation estimée : {dehyd}</> : null}</>} />
          <dl class="kv">
            <dt>NaHCO₃ (poudre)</dt><dd>{fmt(b.grams, 1)} g</dd>
            <dt>Solution isotonique 1,4 %</dt><dd>{fmt(b.ml14)} mL</dd>
            <dt>Solution 8,4 % (à diluer)</dt><dd>{fmt(b.ml84)} mL</dd>
          </dl>
        </Result>
      ) : <Empty>Saisissez le poids du veau.</Empty>}
      <Foot>Bicarbonate = poids × déficit × 0,6. Enfoncement de l’œil : Constable et al., JAVMA 1998. Estimation clinique du déficit : Naylor, Can Vet J 1989. Préférer une mesure (gaz du sang) si disponible.</Foot>
    </>
  );
}

function Transfusion() {
  const [sp, setSp] = useState('chien');
  const [kg, setKg] = useState('');
  const [htR, setHtR] = useState('');
  const [htT, setHtT] = useState('25');
  const [htD, setHtD] = useState('45');
  const v = transfusion(num(kg), BLOOD_VOLUME[sp], num(htR), num(htT), num(htD));
  return (
    <>
      <Form>
        <Row label="Espèce"><SpeciesSel v={sp} set={(s) => { setSp(s); setHtD(s === 'chien' ? '45' : '35'); setHtT(s === 'chat' ? '20' : '25'); }} /></Row>
        <Row label="Poids" unit="kg"><N v={kg} set={setKg} /></Row>
        <Row label="Ht du receveur" unit="%"><N v={htR} set={setHtR} /></Row>
        <Row label="Ht souhaité" unit="%"><N v={htT} set={setHtT} /></Row>
        <Row label="Ht du donneur / poche" unit="%"><N v={htD} set={setHtD} /></Row>
      </Form>
      {v > 0 ? (
        <>
          <Result>
            <Hero label="Sang total à transfuser" value={`${fmt(v)} mL`} />
            <p class="hero-note">Débuter lentement (≈ 0,25 mL/kg/h pendant 15–30 min) en surveillant T°, FC, FR ; transfusion terminée en moins de 4 h. Test de compatibilité (cross-match) ; groupage obligatoire chez le chat.</p>
          </Result>
          <Foot>Volume = poids × {BLOOD_VOLUME[sp]} mL/kg × (Ht souhaité − Ht receveur) / Ht donneur.</Foot>
        </>
      ) : <Empty>Saisissez le poids et l’hématocrite du receveur.</Empty>}
    </>
  );
}

function Electrolytes() {
  const [sp, setSp] = useState('chien');
  const [na, setNa] = useState(''); const [k, setK] = useState(''); const [cl, setCl] = useState('');
  const [hco3, setHco3] = useState(''); const [glu, setGlu] = useState(''); const [urea, setUrea] = useState('');
  const naRef = RANGES[sp as 'chien']?.na;
  const naNormal = naRef ? (naRef[0] + naRef[1]) / 2 : 145;
  const has = (...v: string[]) => v.every((x) => Number.isFinite(num(x)));
  const MM = 'mmol/L';
  return (
    <>
      <Form>
        <Row label="Espèce"><SpeciesSel v={sp} set={setSp} /></Row>
        <Row label="Na⁺" unit={MM}><N v={na} set={setNa} /></Row>
        <Row label="K⁺" unit={MM}><N v={k} set={setK} /></Row>
        <Row label="Cl⁻" unit={MM}><N v={cl} set={setCl} /></Row>
        <Row label="HCO₃⁻" unit={MM}><N v={hco3} set={setHco3} /></Row>
        <Row label="Glucose" unit={MM}><N v={glu} set={setGlu} /></Row>
        <Row label="Urée" unit={MM}><N v={urea} set={setUrea} /></Row>
      </Form>
      <Result>
        <dl class="kv">
          <dt>Trou anionique</dt><dd>{has(na, k, cl, hco3) ? `${fmt(anionGap(num(na), num(k), num(cl), num(hco3)), 1)} mmol/L` : '—'}</dd>
          <dt>Osmolalité calculée</dt><dd>{has(na, k, glu, urea) ? `${fmt(calcOsmolality(num(na), num(k), num(glu), num(urea)))} mOsm/kg` : '—'}</dd>
          <dt>Na corrigé (glycémie)</dt><dd>{has(na, glu) ? `${fmt(correctedNa(num(na), num(glu)), 1)} mmol/L` : '—'}</dd>
          <dt>Cl corrigé</dt><dd>{has(cl, na) ? `${fmt(correctedCl(num(cl), num(na), naNormal), 1)} mmol/L` : '—'}</dd>
          <dt>Na/K</dt><dd>{has(na, k) ? fmt(num(na) / num(k), 1) : '—'}</dd>
        </dl>
      </Result>
      <Foot>Trou anionique de référence ≈ 12–24 mmol/L (chien, chat), 14–20 (bovin, cheval) ; augmenté = acides non mesurés (lactate, cétones, urémie, éthylène glycol). Osmolalité mesurée − calculée {'>'} 10 : penser éthylène glycol. Cl corrigé bas = alcalose hypochlorémique (déplacement de caillette, vomissements).</Foot>
    </>
  );
}

function Energy() {
  const [kg, setKg] = useState('');
  const [f, setF] = useState(MER_FACTORS[0].f);
  const r = rer(num(kg));
  const situation = MER_FACTORS.find((m) => m.f === f)!;
  return (
    <>
      <Form>
        <Row label="Poids" unit="kg"><N v={kg} set={setKg} /></Row>
        <Row label="Situation">
          <Sel v={situation.label} set={(l) => setF(MER_FACTORS.find((m) => m.label === l)!.f)}>
            {MER_FACTORS.map((m) => <option key={m.label} value={m.label}>{m.label}</option>)}
          </Sel>
        </Row>
      </Form>
      {num(kg) > 0 ? (
        <Result>
          <Hero label="Besoin d’entretien" value={`${fmt(r * f)} kcal/j`} sub={`RER ${fmt(r)} kcal/j × ${fmt(f, 1)}`} />
        </Result>
      ) : <Empty>Saisissez le poids.</Empty>}
      <Foot>RER = 70 × poids^0,75 (WSAVA Global Nutrition Toolkit). Réalimentation après anorexie : 1/3 du RER le premier jour, puis augmentation progressive.</Foot>
    </>
  );
}

function Dose() {
  const [kg, setKg] = useState(''); const [d, setD] = useState(''); const [c, setC] = useState('');
  const mg = num(kg) * num(d);
  return (
    <>
      <Form>
        <Row label="Poids" unit="kg"><N v={kg} set={setKg} /></Row>
        <Row label="Dose" unit="mg/kg"><N v={d} set={setD} /></Row>
        <Row label="Concentration" unit="mg/mL"><N v={c} set={setC} ph="facultatif" /></Row>
      </Form>
      {mg > 0 ? (
        <Result>
          {num(c) > 0
            ? <Hero label="Volume à administrer" value={`${fmt(mg / num(c), 2)} mL`} sub={`soit ${fmt(mg, 1)} mg`} />
            : <Hero label="Quantité de substance" value={`${fmt(mg, 1)} mg`} />}
        </Result>
      ) : <Empty>Saisissez le poids et la dose.</Empty>}
      <Foot>Vérifier la posologie et le temps d’attente dans le RCP (onglet Médicaments, qui pré-remplit la dose usuelle).</Foot>
    </>
  );
}

function Conversion() {
  const [aid, setAid] = useState('crea');
  const [v, setV] = useState('');
  const [u, setU] = useState('mg/dl');
  const a = analyteById(aid)!;
  const units = Object.keys(a.units).filter(Boolean);
  const canon = toCanonical(a, num(v), u);
  return (
    <>
      <Form>
        <Row label="Analyte">
          <Sel v={aid} set={(id) => { setAid(id); setU(Object.keys(analyteById(id)!.units)[0]); }}>
            {ANALYTES.filter((x) => Object.keys(x.units).length > 1).map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </Sel>
        </Row>
        <Row label="Valeur"><N v={v} set={setV} /></Row>
        <Row label="Unité"><Sel v={u} set={setU}>{units.map((x) => <option key={x} value={x}>{x}</option>)}</Sel></Row>
      </Form>
      {canon != null && Number.isFinite(canon) ? (
        <Result>
          <dl class="kv">
            {units.map((x) => <Fragment key={x}><dt>{x}</dt><dd>{fmt(canon / a.units[x], 3)}</dd></Fragment>)}
          </dl>
        </Result>
      ) : <Empty>Saisissez une valeur.</Empty>}
    </>
  );
}

function Gestation() {
  const [sp, setSp] = useState(GESTATION[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const g = GESTATION.find((x) => x.id === sp)!;
  const due = new Date(date); due.setDate(due.getDate() + g.days);
  return (
    <>
      <Form>
        <Row label="Espèce"><Sel v={sp} set={setSp}>{GESTATION.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}</Sel></Row>
        <Row label="Saillie ou IA"><input type="date" value={date} onInput={(e) => setDate(e.currentTarget.value)} /></Row>
      </Form>
      {!isNaN(due.getTime()) && (
        <Result>
          <Hero label="Mise bas prévue" value={due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            sub={due.toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^./, (c) => c.toUpperCase())} />
        </Result>
      )}
      <Foot>Durée moyenne : {g.days} jours (variations individuelles et raciales).</Foot>
    </>
  );
}

function Contacts() {
  const dept = departementByCode(settings.value.departement);
  return (
    <div class="list">
      {settings.value.contacts.map((c) => (
        <div key={c.id} class="list-item">
          <span class="grow"><b>{c.label}</b>
            {c.phone ? <div class="sub">{c.phone}</div> : <div class="sub">Numéro à saisir dans Réglages{c.id === 'ddetspp' && dept ? <> · <a href={annuaireUrl(dept)} target="_blank" rel="noopener">Annuaire officiel</a></> : null}</div>}
          </span>
          {c.phone
            ? <a class="btn small icon-only" href={`tel:${c.phone.replace(/\s/g, '')}`} aria-label={`Appeler ${c.label}`}><Icon name="phone" size={20} /></a>
            : <a class="btn small" href="#/reglages">Saisir</a>}
        </div>
      ))}
    </div>
  );
}

function Regulated() {
  return (
    <>
      <div class="alert critique"><b>Suspicion de catégorie A</b><p>Ne pas déplacer d’animaux ni de produits, isoler, se désinfecter avant de quitter l’élevage, appeler immédiatement la DDETSPP.</p></div>
      <div class="section-title">Contacts</div>
      <Contacts />
      <div class="section-title">Maladies (mammifères)</div>
      <div class="list">
        {REGULATED.map((r) => (
          <div key={r.name} class="list-item reg-row">
            <span class={`tag cat-tag ${r.cat === 'A' ? 'crit' : r.cat === 'B' ? 'warn' : 'info'}`} title={CAT_HELP[r.cat]} aria-label={`Catégorie ${r.cat}`}>{r.cat}</span>
            <span class="grow"><b>{r.name}</b><div class="sub">{r.species}</div><div class="reg-action">{r.action}</div></span>
          </div>
        ))}
      </div>
      <p class="section-foot">Catégories : règlement (UE) 2016/429 et règlement d’exécution (UE) 2018/1882. Les consignes nationales (FCO, MHE, DNC) évoluent : vérifier les instructions DGAL en vigueur.</p>
    </>
  );
}

function Wildlife() {
  return (
    <>
      <div class="alert critique">
        <b>Morsure, griffure ou projection de macaque : herpèsvirus B</b>
        <ol class="alert-steps">{HERPES_B_PROTOCOL.map((s) => <li key={s}>{s}</li>)}</ol>
        <a class="btn primary alert-call" href="tel:15"><Icon name="phone" size={20} />Appeler le 15</a>
      </div>
      <div class="section-title">Espèces du parc</div>
      <div class="list">
        {WILDLIFE.map((w) => (
          <details key={w.id} class="disclosure">
            <summary>{w.title}</summary>
            <div class="disclosure-body">
              <div class="label">Zoonoses</div><ul>{w.zoonoses.map((z) => <li key={z}>{z}</li>)}</ul>
              <div class="label">À surveiller</div><ul>{w.watch.map((z) => <li key={z}>{z}</li>)}</ul>
              <div class="label">Sécurité et interprétation</div><ul>{w.safety.map((z) => <li key={z}>{z}</li>)}</ul>
            </div>
          </details>
        ))}
      </div>
      <p class="section-foot">Sources : Fowler’s Zoo and Wild Animal Medicine ; EAZWV Transmissible Diseases Handbook ; CDC (B virus) ; Plateforme ESA (Sylvatub, SAGIR).</p>
    </>
  );
}
