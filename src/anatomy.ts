// The anatomy check (owner rule 2026-10-16): every token and portrait render is shown to the
// judge model, which counts what was painted (heads, eyes, arms, legs, hands and fingers, tails,
// tendrils, wings, held objects), flags what differs from the creature's expected anatomy when
// the caller gives one (the Monster Manual's line) or only what is wrong on any creature when
// not, and for a token says which edge of the image the head points to, since Foundry treats
// the top as the token's front. Born of a batch of eleven approved actors in which three arms,
// five tendrils and a second eye on a one-eyed creature went to the table uncounted: the
// session that makes the art is the session that approves it, and it does not count. The report
// never refuses and never re-renders: a flaw is one edit-image away and the owner approves the
// fix, a mis-facing token is a rotation of the PNG, and the judge can be wrong, so the flaw pass
// still reads every render.
//
// The facing question asks which edge the head is NEAREST (calibrated 2026-10-17): asked which
// edge the head "points to", the check model read that as where the eyes look and answered
// bottom on 30 of 34 top-down tokens whose heads sat at the top; asked which edge the head is
// nearest, with the eyes expressly ignored, it answered top on 34 of 34 (the plates of the
// 2026-10-17 headtest runs, scored in notes/mannequin-tokens/PLAN.md).

import sharp from 'sharp';
import type { Gemini } from './gemini.js';

/** The kinds the check runs on: one creature, counted against the book. */
export const ANATOMY_KINDS = ['token', 'portrait'] as const;
export type AnatomyKind = (typeof ANATOMY_KINDS)[number];

export function isAnatomyKind(kind: string): kind is AnatomyKind {
  return (ANATOMY_KINDS as readonly string[]).includes(kind);
}

export const ANATOMY_VERDICTS = ['ok', 'flawed', 'unclear'] as const;
export type AnatomyVerdict = (typeof ANATOMY_VERDICTS)[number];

/** The edge a token's head is nearest. Foundry's front is the top; none is a creature with no head end. */
export const FACINGS = ['top', 'bottom', 'left', 'right', 'none', 'unclear'] as const;
export type Facing = (typeof FACINGS)[number];

/** Degrees clockwise that bring a token's front to the top of the image. */
export const ROTATION: Partial<Record<Facing, 90 | 180 | 270>> = {
  bottom: 180,
  left: 90,
  right: 270,
};

/** The judge sees at most this many pixels on the long side: a 2K portrait is overkill for a count. */
export const JUDGE_EDGE = 1024;

export interface AnatomyReport {
  verdict: AnatomyVerdict;
  /** What the judge counted, in its own words. */
  found: string;
  /** Each flaw in one line, placed in the picture, ready for an edit-image instruction. */
  flaws: string[];
  /** Tokens: the edge of the image the head is nearest to. */
  facing?: Facing;
  /** Tokens whose front is not at the top: the clockwise rotation of the PNG that fixes it. */
  rotate?: 90 | 180 | 270;
  /** The judge could not be asked; the render went through uncounted. */
  error?: string;
}

const COUNT_LINE =
  'Count exactly what is painted, as a careful viewer would, and report every number: heads, ' +
  'eyes, arms, legs, hands and the fingers on each visible hand, tails, tendrils or tentacles, ' +
  'wings, and weapons or other held objects. A limb half hidden behind another still counts; a ' +
  'shadow, a strap or a fold of cloth does not. ';

const NO_EXPECTATION =
  'No description of the creature was given, so flag only what is wrong on any creature: a limb ' +
  'or a part that belongs to no body, more than five fingers on a hand, a weapon or held object ' +
  'painted twice, a second head on a creature painted with one body. ';

export function anatomyPrompt(kind: AnatomyKind, expected?: string): string {
  const scene =
    kind === 'token'
      ? 'This is a virtual tabletop token: one creature on a flat coloured plate, seen from ' +
        'directly above. '
      : 'This is a character portrait of one creature in a scene; count the main creature only. ';
  const compare = expected
    ? `The creature should have: ${expected.trim().replace(/[.\s]+$/, '')}. Flag every way the ` +
      'painted creature differs from that, and any part painted twice. '
    : NO_EXPECTATION;
  const facing =
    kind === 'token'
      ? "Then say which edge of the image the creature's head is nearest to. The token is seen " +
        'from above, so the head sits toward one edge of the image and the feet or the tail ' +
        'toward the opposite edge; answer with the edge the head is at, whatever direction the ' +
        'eyes look. '
      : '';
  const form =
    'Answer in exactly this form and nothing else:\n' +
    'COUNTS: the counts in one line\n' +
    (kind === 'token'
      ? 'FACING: the edge the head is nearest, TOP, BOTTOM, LEFT or RIGHT; NONE for a creature ' +
        'with no head end (a mushroom, a radial creature, a hanging stalactite); UNCLEAR when ' +
        'you cannot tell\n'
      : '') +
    'FLAWS: none, or one flaw per line beginning with "- ", each naming the flaw and where it ' +
    'sits in the picture\n' +
    'VERDICT: OK, FLAWED or UNCLEAR';
  return `${scene}${COUNT_LINE}${compare}${facing}${form}`;
}

/** The text after a "KEY:" label, markdown bold tolerated; undefined when the line is absent. */
function labelled(lines: string[], key: string): string | undefined {
  const re = new RegExp(`^[*_\\s]*${key}[*_\\s]*:[*_\\s]*`, 'i');
  const line = lines.find(l => re.test(l));
  return line === undefined ? undefined : line.replace(re, '').trim();
}

const BULLET = /^[-*•]\s+/;

/** Read the judge's answer into a report; anything unparseable is unclear with the text kept. */
export function parseAnatomy(text: string, kind: AnatomyKind): AnatomyReport {
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);
  const found = labelled(lines, 'COUNTS');
  const verdictWord = labelled(lines, 'VERDICT');
  const flaws: string[] = [];
  let inFlaws = false;
  for (const l of lines) {
    if (/^[*_\s]*FLAWS[*_\s]*:/i.test(l)) {
      inFlaws = true;
      const rest = (labelled([l], 'FLAWS') ?? '').replace(BULLET, '').trim();
      if (rest && !/^none\b/i.test(rest)) flaws.push(rest);
      continue;
    }
    if (/^[*_\s]*(COUNTS|FACING|VERDICT)[*_\s]*:/i.test(l)) {
      inFlaws = false;
      continue;
    }
    if (inFlaws && BULLET.test(l)) flaws.push(l.replace(BULLET, '').trim());
  }
  if (found === undefined && verdictWord === undefined) {
    return { verdict: 'unclear', found: text.trim().replace(/\s+/g, ' ').slice(0, 300), flaws };
  }
  const word = (verdictWord ?? '').toLowerCase().split(/[^a-z]/)[0] ?? '';
  let verdict: AnatomyVerdict = (ANATOMY_VERDICTS as readonly string[]).includes(word)
    ? (word as AnatomyVerdict)
    : 'unclear';
  if (flaws.length > 0 && verdict === 'ok') verdict = 'flawed';
  const report: AnatomyReport = { verdict, found: found ?? '', flaws };
  if (kind === 'token') {
    const f = (labelled(lines, 'FACING') ?? '').toLowerCase().split(/[^a-z]/)[0] ?? '';
    const facing: Facing = (FACINGS as readonly string[]).includes(f) ? (f as Facing) : 'unclear';
    report.facing = facing;
    const rotate = ROTATION[facing];
    if (rotate) {
      report.rotate = rotate;
      report.flaws.push(
        `the head is nearest the ${facing} edge of the image; Foundry's front is the top, ` +
          `so rotate the PNG ${rotate} degrees clockwise`
      );
      report.verdict = 'flawed';
    }
  }
  return report;
}

/** One count on a render: the image (downscaled) first, the prompt last. */
export async function judgeAnatomy(
  gemini: Gemini,
  image: Buffer,
  kind: AnatomyKind,
  expected?: string
): Promise<AnatomyReport> {
  const data = await sharp(image)
    .resize(JUDGE_EDGE, JUDGE_EDGE, { fit: 'inside', withoutEnlargement: true })
    .png()
    .toBuffer();
  const text = await gemini.judge({
    prompt: anatomyPrompt(kind, expected),
    images: [{ data, mimeType: 'image/png' }],
  });
  return parseAnatomy(text, kind);
}
