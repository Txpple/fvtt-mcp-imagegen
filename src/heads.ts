// The head anchors for mannequin tokens (owner rule 2026-10-16). A render leans toward the head
// tilt of whatever reference carries a head, and words about the angle fail (about 95 renders
// that day), so the head is carried by an image: a grey HeroForge bust at the wanted tilt
// (mannequins/heads/bust-N.png, attached by the server) for a figure made from words, or the
// PC's approved token head attached by the caller as `character`. The ruled band crops in
// mannequins/heads/band/ are the judge's exemplars (head.ts). The folder's README names each.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { InlineImage } from './gemini.js';
import type { HeadVerdict } from './head.js';

// dist/heads.js → the repo root is one level up (src/heads.ts sees the same shape under vitest).
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const HEADS_DIR = path.join(repoRoot, 'mannequins', 'heads');

/** The busts, lowest tilt first: crown only, brow and eye sockets, eyes nose mouth, plus the chin edge. */
export const BUSTS = ['bust-1', 'bust-2', 'bust-3', 'bust-4'] as const;
/**
 * The same busts with two open eyes drawn into the sockets by script (2026-10-17, the owner's
 * "for fun" test): bound with the eyes named, outside the steering dial.
 */
export const EYED_BUSTS = ['bust-2-eyes'] as const;
/** bust-2 with the capture's two green marks in its sockets (the owner, 2026-10-17): bound with the marks named. */
export const GREEN_BUSTS = ['bust-2-green'] as const;
export type Bust = (typeof BUSTS)[number] | (typeof EYED_BUSTS)[number] | (typeof GREEN_BUSTS)[number];

/**
 * What a caller may ask for: a bust; no bust on the first render (the head then in words); or
 * "capture", the capture's own head with nothing attached and nothing said about it (the owner's
 * test of 2026-10-17: a capture shot fully top-down, crown only, the eyes not asked for).
 */
export const HEAD_ANCHOR_CHOICES = [...BUSTS, ...EYED_BUSTS, ...GREEN_BUSTS, 'none', 'capture'] as const;

/** What a render carries: a bust, the caller's `character` head, or nothing. */
export type HeadAnchor = Bust | 'character' | 'none';

/**
 * The pipeline's bust (the owner, 2026-10-17): bust-2, which centred the heads of an orc, a goblin,
 * a knight and a dwarf (2026-10-16), with the capture's green marks in its sockets. The owner's
 * own re-shot bust replaces the file at the same name when it exists.
 */
export const DEFAULT_BUST: Bust = 'bust-2-green';

export function isBust(anchor: string): anchor is Bust {
  return (
    (BUSTS as readonly string[]).includes(anchor) ||
    (EYED_BUSTS as readonly string[]).includes(anchor) ||
    (GREEN_BUSTS as readonly string[]).includes(anchor)
  );
}

export function isGreenBust(bust: Bust): boolean {
  return (GREEN_BUSTS as readonly string[]).includes(bust);
}

export function isEyedBust(bust: Bust): boolean {
  return (EYED_BUSTS as readonly string[]).includes(bust);
}

export function bustPath(bust: Bust): string {
  return path.join(HEADS_DIR, `${bust}.png`);
}

export function loadBust(bust: Bust): InlineImage {
  return { data: fs.readFileSync(bustPath(bust)), mimeType: 'image/png' };
}

/**
 * The binding that made the busts a dial (2026-10-16): the head's tilt and nothing else. The
 * bust is attached last, so `n` is one past the caller's images.
 */
export function bustBinding(n: number, bust?: Bust): string {
  if (bust && isGreenBust(bust)) {
    return (
      `Image ${n} is a grey clay head with two bright green marks where its eyes are, showing only ` +
      "how far a head is tipped toward this overhead camera and where the eyes sit: tip the figure's " +
      'head exactly like it, so that the same amount of brow, eyes, nose and mouth shows, paint the ' +
      "figure's two eyes open where this head's green marks sit, and take nothing else from it."
    );
  }
  if (bust && isEyedBust(bust)) {
    return (
      `Image ${n} is a grey clay head with two open eyes, showing only how far a head is tipped ` +
      "toward this overhead camera and how its eyes sit open beneath the brow: tip the figure's " +
      'head exactly like it, so that the same amount of brow, eyes, nose and mouth shows, have ' +
      'both of its eyes open exactly as they are here, and take nothing else from it.'
    );
  }
  return (
    `Image ${n} is a grey clay head showing only how far a head is tipped toward this overhead ` +
    "camera: tip the figure's head exactly like it, so that the same amount of brow, eyes, nose " +
    'and mouth shows, and take nothing else from it.'
  );
}

/**
 * Which bust a verdict outside the band steers the retry to. far-down goes up the dial, to
 * bust-3 at least (one step past bust-3 when the render already carried it); far-up goes to
 * bust-1. A dropped camera is a re-render unchanged (undefined): the bust is not the cause.
 */
export function steerBust(verdict: HeadVerdict, current: Bust | undefined): Bust | undefined {
  if (verdict === 'far-down') {
    const i = current ? (BUSTS as readonly string[]).indexOf(current) : -1;
    return BUSTS[Math.min(BUSTS.length - 1, Math.max(2, i + 1))];
  }
  if (verdict === 'far-up') return 'bust-1';
  return undefined;
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
