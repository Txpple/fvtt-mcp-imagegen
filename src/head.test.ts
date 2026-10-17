import { describe, expect, it } from 'vitest';
import { Gemini, JUDGE_MODEL } from './gemini.js';
import { HEAD_PROMPT, inBand, judgeHead, needsRetry, parseVerdict } from './head.js';
import { JUDGE_EXEMPLARS, loadExemplars, steerBust } from './heads.js';

describe('parseVerdict', () => {
  it('takes the first word, any case or punctuation, hyphenated steps included', () => {
    expect(parseVerdict('RIGHT')).toBe('right');
    expect(parseVerdict(' Down.')).toBe('down');
    expect(parseVerdict('UP: the face is forward')).toBe('up');
    expect(parseVerdict('FAR-DOWN')).toBe('far-down');
    expect(parseVerdict('far up (like Image 4)')).toBe('far-up');
    expect(parseVerdict('Camera dropped')).toBe('camera-dropped');
    expect(parseVerdict('CAMERA_DROPPED')).toBe('camera-dropped');
    expect(parseVerdict('unclear')).toBe('unclear');
  });

  it('reads anything else as unclear, the old words included', () => {
    expect(parseVerdict('')).toBe('unclear');
    expect(parseVerdict('The head is lifted.')).toBe('unclear');
    expect(parseVerdict('AHEAD')).toBe('unclear');
    expect(parseVerdict('bowed')).toBe('unclear');
  });
});

describe('the band and the steering', () => {
  it('down, right and up deliver; far-down, far-up and a dropped camera buy a retry', () => {
    expect(['down', 'right', 'up'].every(v => inBand(v as any))).toBe(true);
    expect(['far-down', 'far-up', 'camera-dropped', 'unclear'].some(v => inBand(v as any))).toBe(
      false
    );
    expect(needsRetry('far-down')).toBe(true);
    expect(needsRetry('far-up')).toBe(true);
    expect(needsRetry('camera-dropped')).toBe(true);
    expect(needsRetry('unclear')).toBe(false);
    expect(needsRetry('right')).toBe(false);
  });

  it('far-down goes up the dial to bust-3 at least, far-up to bust-1, a dropped camera stays', () => {
    expect(steerBust('far-down', 'bust-2')).toBe('bust-3');
    expect(steerBust('far-down', 'bust-1')).toBe('bust-3');
    expect(steerBust('far-down', undefined)).toBe('bust-3');
    expect(steerBust('far-down', 'bust-3')).toBe('bust-4');
    expect(steerBust('far-down', 'bust-4')).toBe('bust-4');
    expect(steerBust('far-up', 'bust-2')).toBe('bust-1');
    expect(steerBust('far-up', 'bust-1')).toBe('bust-1');
    expect(steerBust('camera-dropped', 'bust-2')).toBeUndefined();
  });

  it('ships the five ruled exemplars the prompt names', () => {
    expect(JUDGE_EXEMPLARS).toEqual([
      'band/far-down-s2-08-cecil-combat.png',
      'band/down-s2-05-lysandra-stand.png',
      'band/right-s2-03-kartor-stand.png',
      'band/up-s2-04-kartor-combat.png',
      'band/wrong-12-cecil-combat.png',
    ]);
    const ex = loadExemplars();
    expect(ex).toHaveLength(5);
    for (const e of ex) expect(e.data.subarray(1, 4).toString()).toBe('PNG');
    expect(HEAD_PROMPT).toMatch(
      /Image 1 is FAR-DOWN.*Image 2 is DOWN.*Image 3 is RIGHT.*Image 4 is UP.*Image 5 is FAR-UP/
    );
    expect(HEAD_PROMPT).toMatch(/Image 6 is the token to grade/);
  });
});

describe('judgeHead', () => {
  it('shows the five exemplars, then the plate, then the prompt, and returns the verdict', async () => {
    let seen: { url: string; body: any } | undefined;
    const fakeFetch = (async (url: any, init: any) => {
      seen = { url: String(url), body: JSON.parse(init.body) };
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'FAR-DOWN' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const g = new Gemini({ apiKey: 'k', timeoutMs: 1000, fetch: fakeFetch });
    const verdict = await judgeHead(g, Buffer.from('plate'));
    expect(verdict).toBe('far-down');
    expect(seen?.url).toContain(`/models/${JUDGE_MODEL}:generateContent`);
    const parts = seen?.body.contents[0].parts;
    expect(parts).toHaveLength(7);
    for (let i = 0; i < 6; i++) expect(parts[i].inline_data.mime_type).toBe('image/png');
    expect(Buffer.from(parts[5].inline_data.data, 'base64').toString()).toBe('plate');
    expect(parts[6].text).toBe(HEAD_PROMPT);
    expect(seen?.body.generationConfig).toEqual({ temperature: 0 });
  });

  it('takes another exemplar set when given one', async () => {
    let n = 0;
    const fakeFetch = (async (_url: any, init: any) => {
      n = JSON.parse(init.body).contents[0].parts.length;
      return new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'right' }] } }] }),
        { status: 200 }
      );
    }) as typeof fetch;
    const g = new Gemini({ apiKey: 'k', timeoutMs: 1000, fetch: fakeFetch });
    expect(
      await judgeHead(g, Buffer.from('p'), [{ data: Buffer.from('e'), mimeType: 'image/png' }])
    ).toBe('right');
    expect(n).toBe(3);
  });
});
