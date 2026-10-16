import { describe, expect, it } from 'vitest';
import { Gemini, JUDGE_MODEL } from './gemini.js';
import { HEAD_PROMPT, judgeHead, parseVerdict } from './head.js';

describe('parseVerdict', () => {
  it('takes the first word, any case or punctuation', () => {
    expect(parseVerdict('AHEAD')).toBe('ahead');
    expect(parseVerdict(' Bowed.')).toBe('bowed');
    expect(parseVerdict('UP: the figure looks at the camera')).toBe('up');
    expect(parseVerdict('unclear')).toBe('unclear');
  });

  it('reads anything else as unclear', () => {
    expect(parseVerdict('')).toBe('unclear');
    expect(parseVerdict('The head is lifted.')).toBe('unclear');
  });
});

describe('judgeHead', () => {
  it('shows the plate to the judge model with the head prompt and returns its verdict', async () => {
    let seen: { url: string; body: any } | undefined;
    const fakeFetch = (async (url: any, init: any) => {
      seen = { url: String(url), body: JSON.parse(init.body) };
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'BOWED' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const g = new Gemini({ apiKey: 'k', timeoutMs: 1000, fetch: fakeFetch });
    const verdict = await judgeHead(g, Buffer.from('plate'));
    expect(verdict).toBe('bowed');
    expect(seen?.url).toContain(`/models/${JUDGE_MODEL}:generateContent`);
    const parts = seen?.body.contents[0].parts;
    expect(parts[0].inline_data.mime_type).toBe('image/png');
    expect(parts[1].text).toBe(HEAD_PROMPT);
    expect(seen?.body.generationConfig).toEqual({ temperature: 0 });
  });
});
