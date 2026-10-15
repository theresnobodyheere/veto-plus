import { afterEach, describe, expect, it, vi } from 'vitest';
import { generate } from '../src/ai/providers';

const sse = (text: string) => new Response(`data: ${JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] })}\n\n`, { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe('réflexion de Gemini limitée', () => {
  it('analyse : réflexion plafonnée, retirée si le modèle la refuse', async () => {
    const bodies: any[] = [];
    vi.stubGlobal('fetch', vi.fn(async (_u: string, init: RequestInit) => {
      const b = JSON.parse(String(init.body));
      bodies.push(b);
      if (b.generationConfig.thinkingConfig) return new Response('thinking_level is not supported', { status: 400 });
      return sse('Avis');
    }));
    let out = '';
    for await (const t of generate('gemini', 'k', 'gemini-3-flash', { system: 's', messages: [{ role: 'user', text: 'q' }] }, new AbortController().signal)) out += t;
    expect(out).toBe('Avis');
    expect(bodies[0].generationConfig.thinkingConfig).toEqual({ thinkingLevel: 'low' });
    expect(bodies[1].generationConfig.thinkingConfig).toBeUndefined();
  });
});
