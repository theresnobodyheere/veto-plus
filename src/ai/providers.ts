// Accès aux IA gratuites : Google Gemini et Mistral. Appels directs depuis l'appareil (CORS autorisé).
import type { ProviderId } from '../state/settings';

export interface AiImage { mime: string; data: string /* base64 */ }
export interface AiMessage { role: 'user' | 'assistant'; text: string; images?: AiImage[] }
export interface AiRequest { system: string; messages: AiMessage[]; json?: boolean; temperature?: number }

export type AiErrorKind = 'quota' | 'auth' | 'network' | 'timeout' | 'server' | 'bad';
export class AiError extends Error {
  constructor(public kind: AiErrorKind, message: string, public retryAfter?: number, public lasting = false) { super(message); }
}

export const PROVIDER_LABEL: Record<ProviderId, string> = { gemini: 'Google Gemini', mistral: 'Mistral AI' };
export const PROVIDER_KEY_URL: Record<ProviderId, string> = {
  gemini: 'https://aistudio.google.com/apikey',
  mistral: 'https://console.mistral.ai/api-keys',
};
export const FALLBACK_MODELS: Record<ProviderId, { text: string; vision: string }> = {
  gemini: { text: 'gemini-2.5-flash', vision: 'gemini-2.5-flash' },
  mistral: { text: 'mistral-medium-latest', vision: 'mistral-medium-latest' },
};

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta';
const MISTRAL = 'https://api.mistral.ai/v1';

async function fetchChecked(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { ...init, signal });
  } catch (e) {
    if (signal.aborted) throw new AiError('timeout', 'Délai dépassé');
    throw new AiError('network', 'Réseau indisponible');
  }
  if (res.ok) return res;
  let detail = '';
  try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
  const ra = Number(res.headers.get('retry-after')) || undefined;
  if (res.status === 429) {
    // Limite par seconde ou par minute (passagère) ou quota du jour / du mois (durable)
    const lasting = /month|day|daily|PerDay|quota exceeded for metric/i.test(detail);
    throw new AiError('quota', lasting ? 'Quota gratuit atteint' : 'Trop de requêtes rapprochées', ra, lasting);
  }
  if (res.status === 401 || res.status === 403) throw new AiError('auth', 'Clé refusée');
  if (res.status === 400 && /api key|API_KEY/i.test(detail)) throw new AiError('auth', 'Clé invalide');
  if (res.status >= 500) throw new AiError('server', `Service en panne (${res.status})`);
  throw new AiError('bad', `Requête refusée (${res.status}) ${detail}`);
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new AiError('timeout', 'Délai dépassé'));
    const t = setTimeout(() => { signal.removeEventListener('abort', stop); resolve(); }, ms);
    const stop = () => { clearTimeout(t); reject(new AiError('timeout', 'Délai dépassé')); };
    signal.addEventListener('abort', stop, { once: true });
  });
}

// L'offre gratuite de Mistral n'accepte qu'une requête par seconde : les appels sont espacés
// et un refus passager (429) est retenté deux fois avant de passer la main.
const MISTRAL_GAP_MS = 1200;
let mistralNext = 0;

async function mistralFetch(url: string, init: RequestInit, signal: AbortSignal): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    const now = Date.now();
    const wait = mistralNext - now;
    mistralNext = Math.max(now, mistralNext) + MISTRAL_GAP_MS;
    if (wait > 0) await sleep(wait, signal);
    try {
      return await fetchChecked(url, init, signal);
    } catch (e) {
      if (!(e instanceof AiError && e.kind === 'quota' && !e.lasting) || attempt >= 2) throw e;
      mistralNext = Math.max(mistralNext, Date.now() + (e.retryAfter ?? 2 * (attempt + 1)) * 1000);
    }
  }
}

// ——— Détection des modèles ———

const version = (s: string) => parseFloat((s.match(/(\d+(?:\.\d+)?)/) ?? ['0'])[0]);

export async function discoverModels(p: ProviderId, key: string, signal: AbortSignal): Promise<{ text: string; vision: string }> {
  if (p === 'gemini') {
    const res = await fetchChecked(`${GEMINI}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } }, signal);
    const j = await res.json();
    const names: string[] = (j.models ?? [])
      .filter((m: any) => (m.supportedGenerationMethods ?? []).includes('generateContent'))
      .map((m: any) => String(m.name).replace(/^models\//, ''))
      .filter((n: string) => /^gemini-[\d.]+-flash/.test(n) && !/lite|image|tts|live|audio|exp|embedding|8b|native|thinking/.test(n));
    names.sort((a, b) => Number(/preview/.test(a)) - Number(/preview/.test(b)) || version(b) - version(a) || a.length - b.length);
    const m = names[0] ?? FALLBACK_MODELS.gemini.text;
    return { text: m, vision: m };
  }
  const res = await mistralFetch(`${MISTRAL}/models`, { headers: { Authorization: `Bearer ${key}` } }, signal);
  const j = await res.json();
  const models: { id: string; vision: boolean }[] = (j.data ?? []).map((m: any) => ({ id: String(m.id), vision: !!m.capabilities?.vision }));
  const ids = models.map((m) => m.id);
  const pick = (prefs: RegExp[], pool: string[]) => {
    for (const r of prefs) { const f = pool.find((id) => r.test(id)); if (f) return f; }
    return undefined;
  };
  const text = pick([/^mistral-medium-latest$/, /^mistral-large-latest$/, /^mistral-small-latest$/], ids) ?? FALLBACK_MODELS.mistral.text;
  const visionPool = models.filter((m) => m.vision).map((m) => m.id);
  const vision = pick([/^mistral-medium-latest$/, /^mistral-small-latest$/, /^pixtral-large-latest$/], visionPool) ?? FALLBACK_MODELS.mistral.vision;
  return { text, vision };
}

// ——— Lecture des flux SSE ———

async function* sseLines(res: Response, signal: AbortSignal): AsyncGenerator<string> {
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i: number;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (line.startsWith('data:')) {
          const d = line.slice(5).trim();
          if (d && d !== '[DONE]') yield d;
        }
      }
    }
  } catch (e) {
    if (signal.aborted) throw new AiError('timeout', 'Délai dépassé');
    throw new AiError('network', 'Connexion interrompue');
  }
}

// Réglages de réflexion selon la génération du modèle (Gemini 2.5 : budget en jetons ; Gemini 3 et suivants : niveau)
function thinkingLight(model: string): Record<string, unknown> | undefined {
  if (/^gemini-2\.5-flash/.test(model)) return { thinkingBudget: 1024 };
  if (/^gemini-[3-9]/.test(model)) return { thinkingLevel: 'low' };
  return undefined;
}

// ——— Génération (flux) ———

export async function* generate(p: ProviderId, key: string, model: string, req: AiRequest, signal: AbortSignal): AsyncGenerator<string> {
  if (p === 'gemini') {
    const body = {
      systemInstruction: { parts: [{ text: req.system }] },
      contents: req.messages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.text }, ...(m.images ?? []).map((im) => ({ inline_data: { mime_type: im.mime, data: im.data } }))],
      })),
      generationConfig: { temperature: req.temperature ?? 0.2, ...(req.json ? { responseMimeType: 'application/json' } : {}) } as Record<string, unknown>,
    };
    // Réflexion limitée : sans plafond, Gemini peut réfléchir plus de 25 s avant le premier mot
    const thinking = thinkingLight(model);
    const send = () => fetchChecked(`${GEMINI}/models/${model}:streamGenerateContent?alt=sse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
    }, signal);
    if (thinking) body.generationConfig.thinkingConfig = thinking;
    let res: Response;
    try {
      res = await send();
    } catch (e) {
      if (!(thinking && e instanceof AiError && e.kind === 'bad' && /thinking/i.test(e.message))) throw e;
      delete body.generationConfig.thinkingConfig;
      res = await send();
    }
    for await (const d of sseLines(res, signal)) {
      const j = JSON.parse(d);
      if (j.error) throw new AiError(j.error.code === 429 ? 'quota' : 'server', j.error.message ?? 'Erreur');
      const parts = j.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) if (part.text && !part.thought) yield part.text as string;
      const reason = j.candidates?.[0]?.finishReason;
      if (reason === 'SAFETY' || reason === 'PROHIBITED_CONTENT') throw new AiError('bad', 'Réponse bloquée par le filtre du service');
    }
    return;
  }

  const content = (m: AiMessage) =>
    m.images?.length
      ? [{ type: 'text', text: m.text }, ...m.images.map((im) => {
          return { type: 'image_url', image_url: `data:${im.mime};base64,${im.data}` };
        })]
      : m.text;
  const body: any = {
    model,
    stream: true,
    temperature: req.temperature ?? 0.2,
    messages: [{ role: 'system', content: req.system }, ...req.messages.map((m) => ({ role: m.role, content: content(m) }))],
  };
  if (req.json) body.response_format = { type: 'json_object' };
  const res = await mistralFetch(`${MISTRAL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  }, signal);
  for await (const d of sseLines(res, signal)) {
    const j = JSON.parse(d);
    if (j.error) throw new AiError('server', j.error.message ?? 'Erreur');
    const t = j.choices?.[0]?.delta?.content;
    if (typeof t === 'string' && t) yield t;
  }
}
