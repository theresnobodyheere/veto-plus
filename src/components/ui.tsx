import type { ComponentChildren } from 'preact';
import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { Icon, type IconName } from './Icon';
import { route, go, back } from '../lib/router';
import { DEPARTEMENTS } from '../data/departements';

// ——— Barre de navigation ———
export const updateReady = signal<null | (() => void)>(null);

/** large : titre en grand sous la barre (écrans racines des onglets), comme dans les apps d'Apple. */
/** action : bouton texte affiché à droite du grand titre (ex. « Modifier ») */
export function TopBar({ title, backTo, backLabel = 'Retour', large, action }: { title: string; backTo?: string; backLabel?: string; large?: boolean; action?: ComponentChildren }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > (large ? 38 : 2));
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, [large]);
  return (
    <>
      <header class={`navbar ${large ? 'has-large' : ''} ${scrolled ? 'scrolled' : ''}`}>
        <div class="navbar-row">
          <div class="nav-left">
            {backTo != null && (
              <button class="back" onClick={() => back(backTo)} aria-label={`Retour : ${backLabel}`}>
                <Icon name="chevronLeft" />{backLabel}
              </button>
            )}
          </div>
          <div class="nav-title" aria-hidden={large && !scrolled ? 'true' : undefined}>{title}</div>
          <div class="nav-right" />
        </div>
        {updateReady.value && (
          <div class="banner update"><Icon name="refresh" size={20} />Nouvelle version disponible<button class="btn small primary" onClick={() => updateReady.value?.()}>Mettre à jour</button></div>
        )}
      </header>
      {large && <div class="large-title"><h1>{title}</h1>{action}</div>}
    </>
  );
}

// ——— Onglets ———
const TABS: { path: string; ico: IconName; label: string }[] = [
  { path: '/', ico: 'cas', label: 'Cas' },
  { path: '/historique', ico: 'historique', label: 'Historique' },
  { path: '/medicaments', ico: 'medicaments', label: 'Médicaments' },
  { path: '/outils', ico: 'outils', label: 'Outils' },
  { path: '/reglages', ico: 'reglages', label: 'Réglages' },
];

export function TabBar() {
  const r = route.value;
  const active = (p: string) => (p === '/' ? r === '/' || r.startsWith('/cas') || r.startsWith('/resultat') : r.startsWith(p));
  return (
    <nav class="tabbar">
      {TABS.map((t) => (
        <button key={t.path} class={`tab ${active(t.path) ? 'active' : ''}`} aria-current={active(t.path) ? 'page' : undefined}
          onClick={() => { if (active(t.path) && r === t.path) window.scrollTo({ top: 0, behavior: 'smooth' }); else go(t.path); }}>
          <Icon name={t.ico} />{t.label}
        </button>
      ))}
    </nav>
  );
}

// ——— Feuille modale ———
export function Sheet({ title, onClose, children, doneLabel = 'OK' }: { title: string; onClose: () => void; children: ComponentChildren; doneLabel?: string }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);
  return (
    <div class="sheet-bg" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div class="sheet-head"><h2>{title}</h2>{doneLabel && <button class="done" onClick={onClose}>{doneLabel}</button>}</div>
        {children}
      </div>
    </div>
  );
}

/** Choix du département : adapte contacts et repères épidémiologiques. Reste sur l'iPhone. */
export function DepartementSelect({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  return (
    <select value={value} onChange={(e) => onChange(e.currentTarget.value)} aria-label="Département de la clinique">
      <option value="">Choisir…</option>
      {DEPARTEMENTS.map((d) => <option key={d.code} value={d.code}>{d.code} – {d.nom}</option>)}
    </select>
  );
}

/** Ligne de liste avec chevron (navigation) */
export function Chevron() {
  return <span class="chev"><Icon name="chevronRight" /></span>;
}

// ——— Messages brefs ———
export const toastMsg = signal<string | null>(null);
let toastTimer: number | undefined;
export function toast(msg: string, ms = 2600) {
  toastMsg.value = msg;
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastMsg.value = null; }, ms);
}
export function Toast() {
  const [, redraw] = useState(0);
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const on = () => redraw((n) => n + 1);
    vv.addEventListener('resize', on);
    vv.addEventListener('scroll', on);
    return () => { vv.removeEventListener('resize', on); vv.removeEventListener('scroll', on); };
  }, []);
  if (!toastMsg.value) return null;
  // Clavier ouvert : en bas, le message serait caché derrière ; on l'affiche en haut de la zone visible
  const vv = typeof window !== 'undefined' ? window.visualViewport : null;
  const keyboard = !!vv && vv.height < window.innerHeight - 150;
  return <div class={`toast ${keyboard ? 'top' : ''}`} style={keyboard ? { top: `${vv!.offsetTop + 10}px` } : undefined} role="status">{toastMsg.value}</div>;
}
