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
export type Bust = (typeof BUSTS)[number];

/** What a caller may ask for: a bust, or no bust on the first render. */
export const HEAD_ANCHOR_CHOICES = [...BUSTS, 'none'] as const;

/** What a render carries: a bust, the caller's `character` head, or nothing. */
export type HeadAnchor = Bust | 'character' | 'none';

/** bust-2 centred the heads of an orc, a goblin, a knight and a dwarf (2026-10-16). */
export const DEFAULT_BUST: Bust = 'bust-2';

export function isBust(anchor: string): anchor is Bust {
  return (BUSTS as readonly string[]).includes(anchor);
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
export function bustBinding(n: number): string {
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
    const i = current ? BUSTS.indexOf(current) : -1;
    return BUSTS[Math.min(BUSTS.length - 1, Math.max(2, i + 1))];
  }
  if (verdict === 'far-up') return 'bust-1';
  return undefined;
}

/** The judge's exemplars, in the order HEAD_PROMPT names them: DOWN, RIGHT, UP, then FAR-UP. */
export const JUDGE_EXEMPLARS = [
  'band/right-05-tychon-stand.png',
  'band/right-10-kartor-combat.png',
  'band/right-11-lysandra-combat.png',
  'band/wrong-12-cecil-combat.png',
] as const;

export function loadExemplars(): InlineImage[] {
  return JUDGE_EXEMPLARS.map(f => ({
    data: fs.readFileSync(path.join(HEADS_DIR, f)),
    mimeType: 'image/png',
  }));
}
