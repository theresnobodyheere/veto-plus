// Relais entre IA : essaie chaque service dans l'ordre, met de côté ceux en échec, informe le bandeau.
import { settings, updateSettings, type ProviderId } from '../state/settings';
import { online, setService, usable } from '../state/status';
import { AiError, discoverModels, FALLBACK_MODELS, generate, PROVIDER_LABEL, type AiRequest } from './providers';

const FIRST_TOKEN_MS = 25_000;
const TOTAL_MS = 120_000;
const MODEL_TTL = 7 * 24 * 3600 * 1000;

export interface AiResult { text: string; provider: ProviderId; model: string }

function markError(p: ProviderId, e: unknown) {
  const err = e instanceof AiError ? e : new AiError('server', String(e));
  const now = Date.now();
  switch (err.kind) {
    case 'quota': setService(p, { state: 'quota', message: err.message, until: now + (err.retryAfter ? err.retryAfter * 1000 : err.lasting ? 15 * 60_000 : 20_000) }); break;
    case 'auth': setService(p, { state: 'cle-invalide', message: err.message }); break;
    case 'timeout': setService(p, { state: 'lent', message: err.message, until: now + 120_000 }); break;
    case 'network': online.value = navigator.onLine; setService(p, { state: 'erreur', message: err.message, until: now + 30_000 }); break;
    default: setService(p, { state: 'erreur', message: err.message, until: now + 120_000 });
  }
  return err;
}

async function modelsFor(p: ProviderId, key: string): Promise<{ text: string; vision: string }> {
  const cached = settings.value.models[p];
  if (cached && Date.now() - cached.checkedAt < MODEL_TTL) return cached;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const m = await discoverModels(p, key, ctrl.signal);
    updateSettings({ models: { ...settings.value.models, [p]: { ...m, checkedAt: Date.now() } } });
    return m;
  } catch (e) {
    if (e instanceof AiError && (e.kind === 'auth' || e.kind === 'quota')) throw e;
    return cached ?? FALLBACK_MODELS[p];
  } finally {
    clearTimeout(t);
  }
}

/** Teste une clé : détecte les modèles et met à jour l'état du service */
export async function testProvider(p: ProviderId): Promise<string> {
  const key = settings.value.keys[p];
  if (!key) { setService(p, { state: 'sans-cle' }); return 'Clé manquante'; }
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10_000);
  try {
    const m = await discoverModels(p, key, ctrl.signal);
    updateSettings({ models: { ...settings.value.models, [p]: { ...m, checkedAt: Date.now() } } });
    setService(p, { state: 'ok' });
    return m.text === m.vision ? m.text : `${m.text} · photos : ${m.vision}`;
  } catch (e) {
    return markError(p, e).message;
  } finally {
    clearTimeout(t);
  }
}

export interface RunOptions {
  onDelta?: (text: string, provider: ProviderId) => void;
  /** Appelé quand on change de service après un début de réponse */
  onReset?: (reason: string) => void;
  onProvider?: (p: ProviderId, model: string) => void;
  signal?: AbortSignal;
}

export async function runAI(req: AiRequest, opts: RunOptions = {}): Promise<AiResult> {
  if (!online.value) throw new AiError('network', 'Hors ligne');
  const needsVision = req.messages.some((m) => m.images?.length);
  const errors: string[] = [];
  for (const p of settings.value.order) {
    if (!usable(p)) continue;
    if (opts.signal?.aborted) break;
    const key = settings.value.keys[p];
    let text = '';
    const ctrl = new AbortController();
    const abortOuter = () => ctrl.abort();
    opts.signal?.addEventListener('abort', abortOuter);
    let firstTimer = setTimeout(() => ctrl.abort(), FIRST_TOKEN_MS);
    const totalTimer = setTimeout(() => ctrl.abort(), TOTAL_MS);
    try {
      const models = await modelsFor(p, key);
      const model = needsVision ? models.vision : models.text;
      opts.onProvider?.(p, model);
      for await (const chunk of generate(p, key, model, req, ctrl.signal)) {
        if (!text) { clearTimeout(firstTimer); }
        text += chunk;
        opts.onDelta?.(text, p);
      }
      if (!text.trim()) throw new AiError('server', 'Réponse vide');
      setService(p, { state: 'ok' });
      return { text, provider: p, model };
    } catch (e) {
      if (opts.signal?.aborted) throw new AiError('timeout', 'Annulé');
      const err = markError(p, e);
      errors.push(`${PROVIDER_LABEL[p]} : ${err.message}`);
      if (text) opts.onReset?.(`${PROVIDER_LABEL[p]} interrompu (${err.message}) — relais vers le service suivant`);
    } finally {
      clearTimeout(firstTimer);
      clearTimeout(totalTimer);
      opts.signal?.removeEventListener('abort', abortOuter);
    }
  }
  throw new AiError('server', errors.length ? errors.join(' · ') : 'Aucune IA configurée (Réglages → clés IA)');
}

/** Extrait le premier objet JSON d'une réponse (certains modèles ajoutent du texte autour) */
export function parseJsonLoose<T>(text: string): T | null {
  const cleaned = text.replace(/```(?:json)?/g, '');
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(cleaned.slice(start, end + 1)) as T; } catch { return null; }
}
