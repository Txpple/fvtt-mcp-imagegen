// The head check for mannequin tokens (owner rule 2026-10-16): the body is seen from straight
// above and the head is tilted up so the brow, both eyes and the nose show in front of the
// crown; never bowed into the chest, never a lowered camera that shows the chest and the face
// head-on. No pixel measure tells those apart across races, hoods and helmets, so the plate is
// shown to a cheap vision model and asked for one word. The verdict steers one re-render and is
// reported; it never refuses, because the judge can be wrong and the flaw pass still reads
// every token.

import type { Gemini } from './gemini.js';

export const HEAD_VERDICTS = ['ahead', 'bowed', 'up', 'unclear'] as const;
export type HeadVerdict = (typeof HEAD_VERDICTS)[number];

export const HEAD_PROMPT =
  'This is a virtual tabletop token: one figure on a flat coloured plate, meant to be seen from ' +
  'directly above, straight down onto the tops of its shoulders, with its head tilted up so the ' +
  'face shows. Judge the camera and the head and answer with one word. AHEAD: the body is seen ' +
  'from straight above (shoulders and crown the largest shapes, feet beneath the body) and the ' +
  'brow, both eyes and the nose are visible in front of the crown. BOWED: the body is seen from ' +
  'straight above but the head is bowed, so mainly the crown and hair show and the eyes are ' +
  'hidden or closed. UP: the camera is not straight above: the chest or front of the body faces ' +
  'the viewer and the face is seen nearly head-on, as in a portrait. UNCLEAR: no face can be ' +
  'made out (a helmet with no visor, a hood hiding the face, a figure lying down). One word.';

/** The judge's first word, as a verdict; anything else is unclear. */
export function parseVerdict(text: string): HeadVerdict {
  const word =
    text
      .trim()
      .toLowerCase()
      .split(/[^a-z]/)[0] ?? '';
  return (HEAD_VERDICTS as readonly string[]).includes(word) ? (word as HeadVerdict) : 'unclear';
}

export interface HeadReport {
  /** The verdict on the delivered render. */
  verdict: HeadVerdict;
  /** When the first render was bowed or up: its verdict, and the plate kept for inspection. */
  first?: HeadVerdict;
  retried?: boolean;
  kept?: string;
  /** The judge could not be asked; the render went through unchecked. */
  error?: string;
}

export async function judgeHead(gemini: Gemini, plate: Buffer): Promise<HeadVerdict> {
  const text = await gemini.judge({
    prompt: HEAD_PROMPT,
    image: { data: plate, mimeType: 'image/png' },
  });
  return parseVerdict(text);
}
