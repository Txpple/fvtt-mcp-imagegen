// The head check for mannequin tokens (owner rule 2026-10-16): the body is seen from straight
// above and the head is tipped just enough toward the camera that the brow, eyes, nose and mouth
// read, hair over the top half of the head; never bowed with the eyes hidden, never the face
// lifted to the camera (chin underside, throat), never a lowered camera that shows the chest
// head-on. No pixel measure tells those apart across races, hoods and helmets, so the plate is
// shown to a flash vision model beside five crops the owner ruled on (mannequins/heads/band/),
// one per step, and graded on five steps. The first judge, flash-lite shown the plate alone, was noise on the
// head (it called bowed heads up and a frontal one ahead); the exemplars and the model are what
// calibrate it (19 of 21 on the ruled set, every known step matched; gemini.ts). The ruler was
// re-cut on 2026-10-17 from the owner's blind stage-2 rulings, with a FAR-DOWN exemplar the
// first set lacked: over three passes on 27 ruled plates the legacy four passed a head the
// owner rejects every time and wobbled on six cells; today's five caught every rejected head
// every time, rejected two accepted NPC heads (a re-render each) and wobbled on three. The
// verdict steers a re-render (shared.ts) and is reported; it never refuses, because the judge
// can be wrong and the flaw pass still reads every token.

import type { Gemini } from './gemini.js';
import { loadExemplars } from './heads.js';

export const HEAD_VERDICTS = [
  'far-down',
  'down',
  'right',
  'up',
  'far-up',
  'camera-dropped',
  'unclear',
] as const;
export type HeadVerdict = (typeof HEAD_VERDICTS)[number];

/** The owner's band: these deliver. far-down, far-up and camera-dropped steer a retry. */
export const BAND: ReadonlySet<HeadVerdict> = new Set<HeadVerdict>(['down', 'right', 'up']);

export function inBand(verdict: HeadVerdict): boolean {
  return BAND.has(verdict);
}

/** A verdict that buys a steered re-render; unclear and the band do not. */
export function needsRetry(verdict: HeadVerdict): boolean {
  return verdict === 'far-down' || verdict === 'far-up' || verdict === 'camera-dropped';
}

export const HEAD_PROMPT =
  'You are grading the head angle of a virtual tabletop token: one upright figure on a ' +
  'flat coloured plate, seen from directly above, the camera looking straight down onto ' +
  'the tops of the shoulders. The wanted head faces the way the body faces and is tipped ' +
  'just enough toward the camera that the brow, both eyes, the nose and the mouth read, ' +
  'with hair over the top half of the head. Images 1 to 5 are heads from tokens at this ' +
  'camera, each with its grade. Image 1 is FAR-DOWN, which is wrong: the head bowed too ' +
  'far, the crown and hair large, the eyes hidden, shut or turned so far down that they ' +
  'do not read. Image 2 is DOWN: the lowest acceptable tilt, the crown and hair still ' +
  'large, the eyes turned down but readable under the brow. Image 3 is RIGHT: the ideal, ' +
  'brow, both eyes, nose and mouth all reading under the hair. Image 4 is UP: the highest ' +
  'acceptable tilt, the face forward with every feature reading and the hair still over ' +
  'the top of the head. Image 5 is FAR-UP, which is wrong: the face lifted to the camera ' +
  "as in a portrait, the eyes at mid-height of the head, the chin's underside or the " +
  'throat showing. Image 6 is the token to grade. Compare the tilt of its head to the ' +
  'five and answer with exactly one of these words. FAR-DOWN: like Image 1 or lower. ' +
  'DOWN: like Image 2. RIGHT: like Image 3. UP: like Image 4. FAR-UP: like Image 5 or ' +
  'beyond it. CAMERA-DROPPED: the camera is not above the figure, the chest or the front ' +
  'of the body faces the viewer and the figure is seen from the front or the side rather ' +
  'than from above. UNCLEAR: the figure is lying flat on the ground (on its back or its ' +
  'side, arms out, dropped gear beside it), or no face can be made out (a helmet with no ' +
  'visor, a deep hood, the face turned away). Judge only how far the head is tipped ' +
  "toward the camera, never the figure's race, kit, art or pose. One word.";

/** The judge's first word, as a verdict; anything else is unclear. */
export function parseVerdict(text: string): HeadVerdict {
  const norm = text
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, '-');
  const word = (/^[a-z-]+/.exec(norm)?.[0] ?? '').replace(/-+$/, '');
  return (HEAD_VERDICTS as readonly string[]).includes(word) ? (word as HeadVerdict) : 'unclear';
}

export interface HeadReport {
  /** The verdict on the delivered render. */
  verdict: HeadVerdict;
  /** down, right or up: inside the owner's band. */
  inBand: boolean;
  /** What the delivered render carried: a bust, the character head, both, or nothing. */
  anchorUsed: string;
  /** When a render was redone: the first verdict, every verdict in order, and the plates kept. */
  first?: HeadVerdict;
  verdicts?: HeadVerdict[];
  retried?: boolean;
  kept?: string[];
  /** A camera that dropped twice: the capture, not the words or the bust, is the cause. */
  advice?: string;
  /** The judge could not be asked; the render went through unchecked. */
  error?: string;
}

/**
 * One verdict on a plate: the five exemplars go first, the plate sixth, the prompt last.
 * `exemplars` is injectable so a caller can grade against another set.
 */
export async function judgeHead(
  gemini: Gemini,
  plate: Buffer,
  exemplars = loadExemplars()
): Promise<HeadVerdict> {
  const text = await gemini.judge({
    prompt: HEAD_PROMPT,
    images: [...exemplars, { data: plate, mimeType: 'image/png' }],
  });
  return parseVerdict(text);
}
