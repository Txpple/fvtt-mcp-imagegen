import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { anatomyPrompt, isAnatomyKind, JUDGE_EDGE, judgeAnatomy, parseAnatomy } from './anatomy.js';
import { Gemini, JUDGE_MODEL } from './gemini.js';

const OK_TOKEN =
  'COUNTS: heads 1, eyes 2, arms 2, legs 2, hands 2 (5 fingers each), tails 0, held objects 1\n' +
  'FACING: TOP\nFLAWS: none\nVERDICT: OK';

describe('isAnatomyKind', () => {
  it('counts tokens and portraits, nothing else', () => {
    expect(isAnatomyKind('token')).toBe(true);
    expect(isAnatomyKind('portrait')).toBe(true);
    for (const k of ['icon', 'prop', 'illustration', 'battlemap', 'overland'])
      expect(isAnatomyKind(k)).toBe(false);
  });
});

describe('anatomyPrompt', () => {
  it('a token: the plate, the counts, the facing, and the four-line form', () => {
    const p = anatomyPrompt('token');
    expect(p).toMatch(/^This is a virtual tabletop token.*seen from directly above/);
    expect(p).toMatch(/heads, eyes, arms, legs, hands and the fingers/);
    expect(p).toMatch(/No description of the creature was given/);
    expect(p).toMatch(/which edge of the image the creature's head or front points to/);
    expect(p).toMatch(
      /COUNTS: .*\nFACING: TOP, BOTTOM, LEFT or RIGHT.*\nFLAWS: .*\nVERDICT: OK, FLAWED or UNCLEAR$/
    );
  });

  it('a portrait: the main creature only, no facing line', () => {
    const p = anatomyPrompt('portrait');
    expect(p).toMatch(/^This is a character portrait of one creature/);
    expect(p).not.toMatch(/FACING/);
    expect(p).toMatch(/COUNTS: .*\nFLAWS: .*\nVERDICT: /);
  });

  it('an expected line replaces the generic flaw list, its trailing stop dropped', () => {
    const p = anatomyPrompt('portrait', 'two arms, two legs, one large eye. ');
    expect(p).toContain(
      'The creature should have: two arms, two legs, one large eye. Flag every way'
    );
    expect(p).not.toMatch(/No description of the creature was given/);
  });
});

describe('parseAnatomy', () => {
  it('reads a clean token answer', () => {
    expect(parseAnatomy(OK_TOKEN, 'token')).toEqual({
      verdict: 'ok',
      found: 'heads 1, eyes 2, arms 2, legs 2, hands 2 (5 fingers each), tails 0, held objects 1',
      flaws: [],
      facing: 'top',
    });
  });

  it('reads the flaws as a list, markdown bold and odd bullets tolerated', () => {
    const r = parseAnatomy(
      '**COUNTS:** heads 1, eyes 2, arms 3, legs 2\n**FLAWS:**\n- a third arm rises behind the left shoulder\n* two eyes where one is expected\n**VERDICT:** FLAWED',
      'portrait'
    );
    expect(r).toEqual({
      verdict: 'flawed',
      found: 'heads 1, eyes 2, arms 3, legs 2',
      flaws: ['a third arm rises behind the left shoulder', 'two eyes where one is expected'],
    });
  });

  it('a flaw on the FLAWS line itself counts, and flaws make an OK verdict flawed', () => {
    const r = parseAnatomy(
      'COUNTS: arms 2\nFLAWS: - a second sword floats beside the first\nVERDICT: OK',
      'portrait'
    );
    expect(r.verdict).toBe('flawed');
    expect(r.flaws).toEqual(['a second sword floats beside the first']);
  });

  it('a token whose front is not at the top gets a rotation and a flaw, whatever the judge said', () => {
    const bottom = parseAnatomy(OK_TOKEN.replace('FACING: TOP', 'FACING: BOTTOM'), 'token');
    expect(bottom).toMatchObject({ verdict: 'flawed', facing: 'bottom', rotate: 180 });
    expect(bottom.flaws).toEqual([
      "the head or front points to the bottom of the image; Foundry's front is the top, so rotate the PNG 180 degrees clockwise",
    ]);
    expect(parseAnatomy(OK_TOKEN.replace('FACING: TOP', 'FACING: Left.'), 'token')).toMatchObject({
      facing: 'left',
      rotate: 90,
    });
    expect(parseAnatomy(OK_TOKEN.replace('FACING: TOP', 'FACING: right'), 'token')).toMatchObject({
      facing: 'right',
      rotate: 270,
    });
    const none = parseAnatomy(OK_TOKEN.replace('FACING: TOP', 'FACING: NONE'), 'token');
    expect(none).toMatchObject({ verdict: 'ok', facing: 'none' });
    expect(none.rotate).toBeUndefined();
  });

  it('a portrait carries no facing even when the judge offers one', () => {
    const r = parseAnatomy(OK_TOKEN, 'portrait');
    expect(r.facing).toBeUndefined();
    expect(r.rotate).toBeUndefined();
    expect(r.verdict).toBe('ok');
  });

  it('an answer with none of the labels is unclear, its text kept for the eye', () => {
    const r = parseAnatomy('  The creature looks fine to me.\n', 'token');
    expect(r).toEqual({ verdict: 'unclear', found: 'The creature looks fine to me.', flaws: [] });
    expect(parseAnatomy('', 'portrait').verdict).toBe('unclear');
  });

  it('an unknown verdict word is unclear; a missing facing is unclear', () => {
    const r = parseAnatomy('COUNTS: arms 2\nFLAWS: none\nVERDICT: maybe', 'token');
    expect(r.verdict).toBe('unclear');
    expect(r.facing).toBe('unclear');
    expect(r.rotate).toBeUndefined();
  });
});

describe('judgeAnatomy', () => {
  it('sends the image downscaled to the judge edge, then the prompt, and parses the answer', async () => {
    let seen: { url: string; body: any } | undefined;
    const fakeFetch = (async (url: any, init: any) => {
      seen = { url: String(url), body: JSON.parse(init.body) };
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'COUNTS: heads 1, eyes 1, arms 3, legs 2\nFLAWS:\n- a third arm behind the left shoulder\nVERDICT: FLAWED',
                  },
                ],
              },
            },
          ],
        }),
        { status: 200 }
      );
    }) as typeof fetch;
    const g = new Gemini({ apiKey: 'k', timeoutMs: 1000, fetch: fakeFetch });
    const big = await sharp({
      create: { width: 1792, height: 2400, channels: 3, background: '#888' },
    })
      .png()
      .toBuffer();
    const r = await judgeAnatomy(g, big, 'portrait', 'two arms, two legs, one large eye');
    expect(r).toEqual({
      verdict: 'flawed',
      found: 'heads 1, eyes 1, arms 3, legs 2',
      flaws: ['a third arm behind the left shoulder'],
    });
    expect(seen?.url).toContain(`/models/${JUDGE_MODEL}:generateContent`);
    const parts = seen?.body.contents[0].parts;
    expect(parts).toHaveLength(2);
    expect(parts[0].inline_data.mime_type).toBe('image/png');
    const sentImage = await sharp(Buffer.from(parts[0].inline_data.data, 'base64')).metadata();
    expect(Math.max(sentImage.width ?? 0, sentImage.height ?? 0)).toBe(JUDGE_EDGE);
    expect(parts[1].text).toContain('The creature should have: two arms, two legs, one large eye');
    expect(seen?.body.generationConfig).toEqual({ temperature: 0 });
  });

  it('never enlarges a small image', async () => {
    let w = 0;
    const fakeFetch = (async (_url: any, init: any) => {
      const parts = JSON.parse(init.body).contents[0].parts;
      w = (await sharp(Buffer.from(parts[0].inline_data.data, 'base64')).metadata()).width ?? 0;
      return new Response(
        JSON.stringify({
          candidates: [
            { content: { parts: [{ text: 'COUNTS: x\nFACING: TOP\nFLAWS: none\nVERDICT: OK' }] } },
          ],
        }),
        { status: 200 }
      );
    }) as typeof fetch;
    const g = new Gemini({ apiKey: 'k', timeoutMs: 1000, fetch: fakeFetch });
    const small = await sharp({
      create: { width: 512, height: 512, channels: 3, background: '#888' },
    })
      .png()
      .toBuffer();
    expect((await judgeAnatomy(g, small, 'token')).verdict).toBe('ok');
    expect(w).toBe(512);
  });
});
