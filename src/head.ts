// The head check for mannequin tokens (owner rule 2026-10-16): a token's face shows the brow,
// both eyes and the nose, looking ahead along the ground; never bowed into the chest, never up
// at the camera. No pixel measure tells a bowed painted head from a lifted one across races,
// hoods and helmets, so the plate is shown to a cheap vision model and asked for one word. The
// verdict steers one re-render and is reported; it never refuses, because the judge can be
// wrong and the flaw pass still reads every token.

import type { Gemini } from './gemini.js';

export const HEAD_VERDICTS = ['ahead', 'bowed', 'up', 'unclear'] as const;
export type HeadVerdict = (typeof HEAD_VERDICTS)[number];

export const HEAD_PROMPT =
  'This is a virtual tabletop token: one figure seen from a camera high above and a little in ' +
  'front of it, on a flat coloured plate. Judge only the head of the figure and answer with one ' +
  'word. AHEAD: the brow, both eyes and the nose are visible and the figure looks ahead along ' +
  'the ground, the chin mostly hidden. BOWED: the head is bowed so that mainly the crown and ' +
  'brow show, the eyes hidden, closed, or looking straight down at its own feet. UP: the face ' +
  'is tilted up so that the figure looks straight up at the camera, chin and neck showing. ' +
  'UNCLEAR: no face can be made out (a helmet with no visor, a hood hiding the face, a figure ' +
  'lying down). One word.';

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
