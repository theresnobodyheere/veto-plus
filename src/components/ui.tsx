import type { ComponentChildren } from 'preact';
import { signal } from '@preact/signals';
import { useEffect, useState } from 'preact/hooks';
import { Icon, type IconName } from './Icon';
import { route, go, back } from '../lib/router';
import { online, services, STATE_LABEL } from '../state/status';
import { settings, type ProviderId } from '../state/settings';
import { PROVIDER_LABEL } from '../ai/providers';
import { DEPARTEMENTS } from '../data/departements';

// ——— Barre de navigation et bandeau d'état permanent ———
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
          <div class="nav-right"><Status compact={!large || scrolled} /></div>
        </div>
        {!online.value && (
          <div class="banner offline" role="status"><Icon name="wifiOff" size={20} />Hors ligne. Analyses, alertes, diagnostic et médicaments restent disponibles.</div>
        )}
        {updateReady.value && (
          <div class="banner update"><Icon name="refresh" size={20} />Nouvelle version disponible<button class="btn small primary" onClick={() => updateReady.value?.()}>Mettre à jour</button></div>
        )}
      </header>
      {large && <div class="large-title"><h1>{title}</h1>{action}</div>}
    </>
  );
}

function Status({ compact }: { compact?: boolean }) {
  const s = settings.value;
  const configured = s.order.filter((p) => s.keys[p]);
  return (
    <div class={`status ${compact ? 'compact' : ''}`} aria-live="polite">
      {online.value
        ? <span class="pill ok" aria-label="En ligne"><span class="dot" /><span class="txt">En ligne</span></span>
        : <span class="pill warn"><span class="dot" /><span class="txt">Hors ligne</span></span>}
      {online.value && s.aiEnabled && (configured.length === 0
        ? <button class="pill" onClick={() => go('/reglages')} aria-label="IA non configurée"><span class="dot" /><span class="txt">Sans IA</span></button>
        : <AiPills providers={configured} />)}
    </div>
  );
}

function AiPills({ providers }: { providers: ProviderId[] }) {
  const sv = services.value;
  const anyOk = providers.some((p) => sv[p].state === 'ok' || sv[p].state === 'inconnu');
  const down = providers.filter((p) => !['ok', 'inconnu'].includes(sv[p].state));
  const title = providers.map((p) => `${PROVIDER_LABEL[p]} : ${STATE_LABEL[sv[p].state]}${sv[p].message ? ` (${sv[p].message})` : ''}`).join('\n');
  if (!down.length) return <span class="pill ok" title={title} aria-label={`IA disponible. ${title}`}><span class="dot" /><span class="txt">IA</span></span>;
  // Libellé court dans la barre ; le détail par service est dans Réglages
  return (
    <button class={`pill ${anyOk ? 'warn' : 'crit'}`} title={title} aria-label={title} onClick={() => go('/reglages')}>
      <span class="dot" /><span class="txt">{anyOk ? 'IA (relais)' : 'IA en panne'}</span>
    </button>
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

/** Choix du département : adapte contacts, repères épidémiologiques et consigne de l'IA. Reste sur l'iPhone. */
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

// ——— Markdown minimal et sûr (pas de HTML injecté) ———
const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
function inline(s: string) {
  return escapeHtml(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}
export function mdToHtml(md: string): string {
  const out: string[] = [];
  let list: 'ul' | 'ol' | null = null;
  const close = () => { if (list) { out.push(`</${list}>`); list = null; } };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{1,4})\s+(.*)$/))) { close(); const lvl = Math.min(3, Math.max(2, m[1].length)); out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`); }
    else if ((m = line.match(/^\s*[-*•]\s+(.*)$/))) { if (list !== 'ul') { close(); out.push('<ul>'); list = 'ul'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if ((m = line.match(/^\s*\d+[.)]\s+(.*)$/))) { if (list !== 'ol') { close(); out.push('<ol>'); list = 'ol'; } out.push(`<li>${inline(m[1])}</li>`); }
    else if (!line.trim()) { close(); }
    else { close(); out.push(`<p>${inline(line)}</p>`); }
  }
  close();
  return out.join('');
}
export function Markdown({ text, typing }: { text: string; typing?: boolean }) {
  return <div class={`md ${typing ? 'typing' : ''}`} dangerouslySetInnerHTML={{ __html: mdToHtml(text) }} />;
}
