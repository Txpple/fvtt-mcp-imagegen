// Cutout: knock a token's plate out to alpha by spawning the bundled Python script. The script owns
// the pixels (chroma key with despill and feathering, or the rembg AI matte); this wrapper owns
// the contract: arguments, parsing, verification, and the fallback from chroma to rembg.

import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CHROMA_KEYS, type ChromaKey, scoreKeys } from './chroma.js';

const SCRIPT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'scripts',
  'token_cutout.py'
);

export type CutoutMethod = 'auto' | 'chroma' | 'rembg';

export interface CutoutOptions {
  input: string;
  output: string;
  method?: CutoutMethod;
  /** Chroma key colour as #RRGGBB or a named key; omitted = the script samples the corners. */
  color?: string | ChromaKey;
  keepShadow?: boolean;
  /** Composite the world tokens' cast shadow under the cut (before the square fit). */
  dropShadow?: boolean;
  erode?: number;
  /** Square canvas edge; 0 keeps the source canvas. Default 512 (Foundry scale 1.0). */
  size?: number;
  padPct?: number;
  trim?: boolean;
}

export interface CutoutResult {
  file: string;
  preview: string;
  method: 'chroma' | 'rembg';
  /** % of the SOURCE frame the subject covers, per the script. */
  coveragePct: number;
  /** % of the delivered opaque pixels still carrying the key hue (fringe / interior residue). */
  residualKeyPct: number;
  /** % of the delivered canvas that is faint matte away from the subject (a plate keyed short). */
  hazePct: number;
  /** chroma only: the plate colour the script keyed on (#RRGGBB), sampled from the border. */
  plateColor?: string;
  width: number;
  height: number;
  /** Set when the first attempt failed verification and rembg was used instead. */
  fellBackToRembg?: boolean;
}

export type CutoutFn = (opts: CutoutOptions) => Promise<CutoutResult>;

export function buildArgs(opts: CutoutOptions): string[] {
  const args = [SCRIPT, opts.input, opts.output, '--method', opts.method ?? 'auto'];
  if (opts.color) {
    const hex = opts.color in CHROMA_KEYS ? CHROMA_KEYS[opts.color as ChromaKey] : opts.color;
    args.push('--color', hex.replace(/^#/, ''));
  }
  if (opts.keepShadow) args.push('--keep-shadow');
  if (opts.dropShadow) args.push('--drop-shadow');
  if (opts.erode && opts.erode > 0) args.push('--erode', String(opts.erode));
  if (opts.size !== undefined) args.push('--size', String(opts.size));
  if (opts.padPct !== undefined) args.push('--pad', String(opts.padPct));
  if (opts.trim === false) args.push('--no-trim');
  return args;
}

export function parseScriptOutput(stdout: string): {
  method: 'chroma' | 'rembg';
  coveragePct: number;
  plateColor?: string;
} {
  const method = /^method:\s*(chroma|rembg)/m.exec(stdout)?.[1] as 'chroma' | 'rembg' | undefined;
  const cov = /subject coverage:\s*([\d.]+)%/.exec(stdout)?.[1];
  if (!method || cov === undefined) {
    throw new Error(`cutout script output not understood:\n${stdout.slice(0, 500)}`);
  }
  const key = /^key:\s*([0-9A-Fa-f]{6})\b/m.exec(stdout)?.[1];
  return { method, coveragePct: Number(cov), ...(key ? { plateColor: `#${key}` } : {}) };
}

function run(python: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(python, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    child.stdout.on('data', d => {
      out += d;
    });
    child.stderr.on('data', d => {
      err += d;
    });
    child.on('error', e => reject(new Error(`cannot run ${python}: ${e.message}`)));
    child.on('close', code => {
      if (code === 0) resolve(out);
      else reject(new Error(`token_cutout.py exited ${code}: ${(err || out).slice(0, 800)}`));
    });
  });
}

/** How much key hue survives in the delivered opaque pixels. */
export async function residualKey(file: string, key: ChromaKey | undefined): Promise<number> {
  if (!key) return 0;
  const scores = await scoreKeys(fs.readFileSync(file));
  return Math.round((scores.find(s => s.key === key)?.risk ?? 0) * 1000) / 10;
}

/** Pixels this far from the subject's solid matte are background, whatever their alpha. */
const HAZE_REACH = 4;

/**
 * How much of the delivered canvas is faint matte (alpha 1-127) more than HAZE_REACH px from any
 * solid (alpha 128+) pixel. A clean cut's soft edge sits inside that reach and scores 0; a plate
 * keyed short of its real colour leaves a haze over the whole frame (63% on the off-key goliath
 * plate, 2026-10-15, where the residual check read 0 because it counts only opaque pixels).
 */
export async function hazePct(file: string): Promise<number> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .extractChannel(3)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Square dilation of the solid mask, as two separable passes.
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = data[i] >= 128 ? 1 : 0;
  const rows = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let hit = 0;
      for (let dx = Math.max(0, x - HAZE_REACH); dx <= Math.min(w - 1, x + HAZE_REACH); dx++) {
        if (solid[y * w + dx]) {
          hit = 1;
          break;
        }
      }
      rows[y * w + x] = hit;
    }
  }
  let haze = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[y * w + x];
      if (a === 0 || a >= 128) continue;
      let near = false;
      for (let dy = Math.max(0, y - HAZE_REACH); dy <= Math.min(h - 1, y + HAZE_REACH); dy++) {
        if (rows[dy * w + x]) {
          near = true;
          break;
        }
      }
      if (!near) haze++;
    }
  }
  return Math.round((haze / (w * h)) * 1000) / 10;
}

/** Coverage outside this band means the key was misread (all or nothing was cut). */
const COVERAGE_MIN = 3;
const COVERAGE_MAX = 97;
const RESIDUAL_MAX = 2;
/** Clean cuts score 0 to 0.1; the off-key goliath 63. */
const HAZE_MAX = 1;

export function makeCutout(python: string): CutoutFn {
  return async function cutout(opts: CutoutOptions): Promise<CutoutResult> {
    if (!fs.existsSync(opts.input)) throw new Error(`image not found: ${opts.input}`);
    if (!fs.existsSync(SCRIPT)) throw new Error(`cutout script missing: ${SCRIPT}`);
    const namedKey =
      opts.color && opts.color in CHROMA_KEYS ? (opts.color as ChromaKey) : undefined;

    const attempt = async (method: CutoutMethod) => {
      const stdout = await run(python, buildArgs({ ...opts, method }));
      const parsed = parseScriptOutput(stdout);
      const meta = await sharp(opts.output).metadata();
      const res: CutoutResult = {
        file: opts.output,
        preview: `${opts.output.replace(/\.png$/i, '')}_preview.png`,
        method: parsed.method,
        coveragePct: parsed.coveragePct,
        residualKeyPct: await residualKey(opts.output, namedKey),
        hazePct: await hazePct(opts.output),
        ...(parsed.plateColor ? { plateColor: parsed.plateColor } : {}),
        width: meta.width ?? 0,
        height: meta.height ?? 0,
      };
      return res;
    };

    // Our 'auto' is chroma first (the plate colour is known exactly), rembg only as the fallback.
    // The script's own --method auto prefers rembg whenever it is installed, so never pass it.
    const requested = opts.method ?? 'auto';
    const first = await attempt(requested === 'auto' ? 'chroma' : requested);
    const bad =
      first.coveragePct < COVERAGE_MIN ||
      first.coveragePct > COVERAGE_MAX ||
      first.residualKeyPct > RESIDUAL_MAX ||
      first.hazePct > HAZE_MAX;
    if (bad && requested === 'auto') {
      // Chroma misread the plate, the subject shares the key hue, or the plate keyed short and
      // left a haze. Let the AI matte try.
      try {
        const second = await attempt('rembg');
        return { ...second, fellBackToRembg: true };
      } catch {
        return first; // rembg unavailable: hand back the chroma cut with its numbers visible.
      }
    }
    return first;
  };
}
