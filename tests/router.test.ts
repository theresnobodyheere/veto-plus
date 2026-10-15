import { afterEach, describe, expect, it, vi } from 'vitest';
import { runAI } from '../src/ai/router';
import { settings, updateSettings } from '../src/state/settings';
import { services, online } from '../src/state/status';

const sse = (chunks: string[]) =>
  new Response(new ReadableStream({
    start(c) {
      for (const ch of chunks) c.enqueue(new TextEncoder().encode(`data: ${ch}\n\n`));
      c.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      c.close();
    },
  }), { status: 200, headers: { 'content-type': 'text/event-stream' } });

const models = { gemini: { text: 'gemini-x', vision: 'gemini-x', checkedAt: Date.now() }, mistral: { text: 'mistral-medium-latest', vision: 'mistral-medium-latest', checkedAt: Date.now() } };

afterEach(() => { vi.unstubAllGlobals(); });

describe('relais entre IA', () => {
  it('Gemini en quota → Mistral prend le relais, état mis à jour', async () => {
    online.value = true;
    updateSettings({ keys: { gemini: 'k1', mistral: 'k2' }, models, aiEnabled: true });
    services.value = { gemini: { state: 'inconnu' }, mistral: { state: 'inconnu' } };
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes('googleapis')) return new Response('{"error":{"code":429}}', { status: 429 });
      return sse([JSON.stringify({ choices: [{ delta: { content: 'Bon' } }] }), JSON.stringify({ choices: [{ delta: { content: 'jour' } }] })]);
    });
    vi.stubGlobal('fetch', fetchMock);
    const deltas: string[] = [];
    const r = await runAI({ system: 's', messages: [{ role: 'user', text: 'q' }] }, { onDelta: (t) => deltas.push(t) });
    expect(r.text).toBe('Bonjour');
    expect(r.provider).toBe('mistral');
    expect(deltas).toEqual(['Bon', 'Bonjour']);
    expect(services.value.gemini.state).toBe('quota');
    expect(services.value.mistral.state).toBe('ok');
  });

  it('clé refusée → service marqué « clé invalide » et ignoré ensuite', async () => {
    updateSettings({ keys: { gemini: 'bad', mistral: '' }, models });
    services.value = { gemini: { state: 'inconnu' }, mistral: { state: 'inconnu' } };
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{"error":{"message":"API key not valid. API_KEY_INVALID"}}', { status: 400 })));
    await expect(runAI({ system: 's', messages: [{ role: 'user', text: 'q' }] })).rejects.toThrow(/Clé invalide/);
    expect(services.value.gemini.state).toBe('cle-invalide');
    await expect(runAI({ system: 's', messages: [{ role: 'user', text: 'q' }] })).rejects.toThrow(/Aucune IA/);
  });

  it('Gemini en flux SSE', async () => {
    updateSettings({ keys: { gemini: 'ok', mistral: '' }, models });
    services.value = { gemini: { state: 'inconnu' }, mistral: { state: 'inconnu' } };
    vi.stubGlobal('fetch', vi.fn(async () => sse([JSON.stringify({ candidates: [{ content: { parts: [{ text: '## Synthèse' }] } }] })])));
    const r = await runAI({ system: 's', messages: [{ role: 'user', text: 'q' }] });
    expect(r.text).toBe('## Synthèse');
    expect(settings.value.keys.gemini).toBe('ok');
  });

  it('hors ligne → erreur immédiate, pas d’appel réseau', async () => {
    online.value = false;
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    await expect(runAI({ system: 's', messages: [{ role: 'user', text: 'q' }] })).rejects.toThrow(/Hors ligne/);
    expect(f).not.toHaveBeenCalled();
    online.value = true;
  });
});
