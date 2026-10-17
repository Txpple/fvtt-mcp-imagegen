// The head anchor for mannequin tokens (owner rule 2026-10-16). A render leans toward the head
// tilt of whatever reference carries a head, and words about the angle fail (about 95 renders
// that day), so the head is carried by an image: the bust (mannequins/heads/bust.png, attached
// by the server) for a figure made from words, or the PC's approved token head attached by the
// caller as `character`. Since 2026-10-17 there is one bust on record, the owner's HeroForge
// capture at 90 degrees with the eyes painted chroma green; the dial of four grey busts and the
// scripted green one it replaced sit in mannequins/heads/archive/ for reference only. The ruled
// band crops in mannequins/heads/band/ are the head check's exemplars (head.ts). The folder's
// README names each.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InlineImage } from './gemini.js';

// dist/heads.js → the repo root is one level up (src/heads.ts sees the same shape under vitest).
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HEADS_DIR = path.join(repoRoot, 'mannequins', 'heads');

/**
 * The one bust on record (the owner, 2026-10-17): the bald human mannequin, head and shoulders,
 * camera straight down, the head tipped as the retired bust-2 was (brow, eyes, nose and the top
 * of the mouth read), the two eyes painted chroma green like every capture's.
 */
export const BUST = 'bust' as const;
export type Bust = typeof BUST;

/**
 * What a caller may ask for: the bust; no bust on the first render (the head then in words); or
 * "capture", the capture's own head with nothing attached and nothing said about it (the owner's
 * test of 2026-10-17: a capture shot fully top-down, crown only, the eyes not asked for).
 */
export const HEAD_ANCHOR_CHOICES = [BUST, 'none', 'capture'] as const;

/** What a render carries: the bust, the caller's `character` head, or nothing. */
export type HeadAnchor = Bust | 'character' | 'none';

/** The pipeline's bust: the one on record. */
export const DEFAULT_BUST: Bust = BUST;

export function isBust(anchor: string): anchor is Bust {
  return anchor === BUST;
}

export function bustPath(bust: Bust = BUST): string {
  return path.join(HEADS_DIR, `${bust}.png`);
}

export function loadBust(bust: Bust = BUST): InlineImage {
  return { data: fs.readFileSync(bustPath(bust)), mimeType: 'image/png' };
}

/**
 * The binding (2026-10-16, the marks named since 2026-10-17): the head's tilt and where the eyes
 * sit, nothing else. The bust is attached last, so `n` is one past the caller's images.
 */
export function bustBinding(n: number, _bust?: Bust): string {
  return (
    `Image ${n} is a grey clay head with two bright green marks where its eyes are, showing only ` +
    "how far a head is tipped toward this overhead camera and where the eyes sit: tip the figure's " +
    'head exactly like it, so that the same amount of brow, eyes, nose and mouth shows, paint the ' +
    "figure's two eyes open where this head's green marks sit, and take nothing else from it."
  );
}

/**
 * The head check's exemplars, in the order HEAD_PROMPT names them: FAR-DOWN, DOWN, RIGHT, UP,
 * FAR-UP. The first four are head crops of the stage-2 renders the owner ruled blind on
 * 2026-10-17 (too far down; a bit down; about perfect; maybe too high); FAR-UP is the owner's
 * 2026-10-16 ruling on a legacy token. The legacy band crops stay in band/ as that ruling's
 * record, and the measurement behind the swap is in notes/mannequin-tokens/PLAN.md.
 */
export const JUDGE_EXEMPLARS = [
  'band/far-down-s2-08-cecil-combat.png',
  'band/down-s2-05-lysandra-stand.png',
  'band/right-s2-03-kartor-stand.png',
  'band/up-s2-04-kartor-combat.png',
  'band/wrong-12-cecil-combat.png',
] as const;

export function loadExemplars(): InlineImage[] {
  return JUDGE_EXEMPLARS.map(f => ({
    data: fs.readFileSync(path.join(HEADS_DIR, f)),
    mimeType: 'image/png',
  }));
}
