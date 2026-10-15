import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiError, discoverModels } from '../src/ai/providers';

const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('limite de l’offre gratuite Mistral', () => {
  it('retente après un refus passager (1 requête par seconde)', async () => {
    vi.useFakeTimers();
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (++n === 1
      ? new Response('{"message":"Requests rate limit exceeded"}', { status: 429, headers: { 'retry-after': '1' } })
      : ok({ data: [{ id: 'mistral-small-latest', capabilities: { vision: true } }] }))));
    const p = discoverModels('mistral', 'k', new AbortController().signal);
    await vi.runAllTimersAsync();
    expect((await p).text).toBe('mistral-small-latest');
    expect(n).toBe(2);
  });
  it('ne retente pas un quota mensuel épuisé', async () => {
    vi.useFakeTimers();
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { n++; return new Response('{"message":"Monthly token limit exceeded"}', { status: 429 }); }));
    const p = discoverModels('mistral', 'k', new AbortController().signal).catch((e) => e);
    await vi.runAllTimersAsync();
    const e = await p;
    expect(e).toBeInstanceOf(AiError);
    expect((e as AiError).lasting).toBe(true);
    expect(n).toBe(1);
  });
});
