// Shared by generate-image and edit-image: the Pro cost gate, reference loading, prompt
// assembly, and the render → post-process → write → (token) cutout pipeline. Tools own
// correctness; this is it.

import { randomBytes } from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';
import sharp from 'sharp';
import { z } from 'zod';
import { encodeMap, mapBack, mapFormat, type PadPlan } from '../battlemap.js';
import { type ChromaKey, chromaSuffix, pickChromaKey } from '../chroma.js';
import type { CutoutFn, CutoutResult } from '../cutout.js';
import type { PythonCheckFn } from '../doctor.js';
import {
  type Aspect,
  Gemini,
  type InlineImage,
  JUDGE_USD,
  PRICE,
  TEXT_OUT_PRICE,
  THINKING_LEVELS,
  type ThinkingLevel,
  TIERS,
  type Tier,
} from '../gemini.js';
import { type DriftReport, measureDrift, overlandDrifted } from '../drift.js';
import { EDGE_BAND, EDGE_LIMIT, edgeContact } from '../edge.js';
import { type HeadReport, type HeadVerdict, inBand, judgeHead, needsRetry } from '../head.js';
import { type Bust, bustBinding, type HeadAnchor, isBust, loadBust, steerBust } from '../heads.js';
import { type Box, type Dimensions, dimensions, fitRect, postProcess } from '../post.js';
import {
  CREATURE_SIZES,
  type CreatureSize,
  filename,
  KINDS,
  type Kind,
  PRESETS,
  TOKEN_EDGE,
} from '../presets.js';
import { SpendMeter } from '../spend.js';

export interface ToolDeps {
  gemini: Gemini;
  spend: SpendMeter;
  outputDir: string;
  cutout: CutoutFn;
  /** imagegen-status's Python probe (Pillow, numpy, rembg). Omitted = that check is skipped. */
  checkPython?: PythonCheckFn;
}

export const kindSchema = z
  .enum(KINDS)
  .describe(
    'Purpose preset. icon: 1:1 flash → 512 square. prop: a map prop (furniture, barrel, tree) ' +
      'seen straight down, object only, cut to alpha at its tile size (300 px per grid cell; ' +
      'an edit keeps the source size). token: 1:1 flash, top-down full body on a ' +
      'chroma plate, cut to alpha on a 512 square (1024 for creatureSize: "large"), no shadow ' +
      '(framing, plate, and cut are done for you). ' +
      'portrait: 3:4 at 2K. illustration: 16:9 at 4K → 2560×1600 (16:10 crop). ' +
      'battlemap (edit-image only): restyle a bought map with its layout locked, delivered on ' +
      "the source's pixel grid (a whole-number upscale for a small source), drift-checked. " +
      'overland (edit-image only): repaint a regional or world map on the same grid, bare of ' +
      'every name and symbol, with a looser drift check. ' +
      'Every kind defaults to flash; tier: "pro" is opt-in and needs confirmPro.'
  );

export const tierSchema = z
  .enum(TIERS)
  .optional()
  .describe(
    'Default flash (Nano Banana 2.1, ~3-11¢), never needs a confirm. "pro" (Nano Banana Pro, ' +
      '~13-24¢, style-reference slots, stronger multi-figure scenes) needs confirmPro.'
  );

export const confirmProSchema = z
  .boolean()
  .optional()
  .describe(
    'Required true with tier: "pro". Offer pro to the owner as an option for portraits and ' +
      'illustrations ("pro is available for a bit extra"); never assume it.'
  );

export const creatureSizeSchema = z
  .enum(CREATURE_SIZES)
  .optional()
  .describe(
    'Tokens only. medium (default): one grid cell, Tiny through Medium, a 512 square. large: ' +
      'Large, Huge, or Gargantuan, a 1024 square, the native render edge.'
  );

export const referenceSchema = z.object({
  path: z.string().min(1).describe('Absolute path of a PNG/JPEG on disk.'),
  role: z
    .enum(['character', 'object', 'style', 'pose'])
    .describe(
      'character: hold the features, hair, skin, build and kit of this person (up to 4 on flash, ' +
        '5 on pro); the pose, head angle and camera come from the prompt and the source image, so ' +
        'a crop already at the angle you want beats a frontal portrait. object: reproduce this ' +
        'exact object (a crop of a weapon head, a shield face, a garment) in shape, materials, ' +
        'colours and markings (up to 10 on flash, 6 on pro). style: match palette, brushwork, ' +
        'light, camera angle; never copy the subject (works on both tiers in practice). pose: ' +
        'match only its pose, head direction, camera angle, and silhouette, never its drawing; ' +
        'for replacing a weak token, attach the old one as the ONLY image with this role.'
    ),
  label: z
    .string()
    .optional()
    .describe('Short name used to bind the reference in the prompt, e.g. "the captain".'),
});
export type Reference = z.infer<typeof referenceSchema>;

export const thinkingSchema = z
  .enum(THINKING_LEVELS)
  .optional()
  .describe(
    'How much the model thinks before it draws (Nano Banana 2.1: minimal, medium, high; the ' +
      'default is medium). Thinking is billed at the text rate, from a fraction of a cent to a ' +
      'few cents a render; the result reports thinkingTokens. Try "high" on a prompt that ' +
      'carries many constraints at once (a mannequin token with a face and gear to match).'
  );

/** Resolve the tier and enforce the Pro gate. Throws the owner-facing refusal. */
export function resolveTier(
  kind: Kind,
  tier: Tier | undefined,
  confirmPro: boolean | undefined
): Tier {
  const resolved = tier ?? PRESETS[kind].tier;
  if (resolved === 'pro' && !confirmPro) {
    const usd = PRICE.pro[PRESETS[kind].size];
    throw new Error(
      `tier: "pro" (Nano Banana Pro) costs about $${usd.toFixed(2)} per ${kind}. Confirm with ` +
        'the owner, then pass confirmPro: true; or omit tier for flash (no confirm needed).'
    );
  }
  return resolved;
}

const MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export function loadImage(p: string): InlineImage {
  const mimeType = MIME[path.extname(p).toLowerCase()];
  if (!mimeType) throw new Error(`unsupported image type: ${p}`);
  if (!fs.existsSync(p)) throw new Error(`image not found: ${p}`);
  return { data: fs.readFileSync(p), mimeType };
}

/**
 * Build the reference preamble. Images are attached in the order given; the preamble tells the
 * model which is which by 1-based index, so the caller's prompt can say "the captain" and be bound.
 * A battlemap's style reference lends its finish only: "match its camera angle" would tilt a
 * straight-down map, and its subject is another map whose layout must not leak in.
 */
export function referencePreamble(refs: Reference[], kind?: Kind, source?: string): string {
  if (refs.length === 0) return '';
  const lines: string[] = [];
  refs.forEach((r, i) => {
    const n = i + 1;
    const who = r.label ? ` (${r.label})` : '';
    if (r.role === 'character' && source === 'mannequin') {
      // On a mannequin edit the character reference is the approved token head (owner rule
      // 2026-10-16): a head-and-shoulders crop at the token camera held the band four of four
      // and carries its own tilt, where a frontal portrait crop pulled the face to the camera.
      lines.push(
        `Image ${n}${who} is a CHARACTER reference: this figure's head as it appears on its ` +
          'approved tokens, seen from this same overhead token camera. Take the face, hair, ' +
          'skin, eyes and the tilt of the head from it, the head tipped exactly as it is there, ' +
          'and nothing of its framing, lighting or background.'
      );
    } else if (r.role === 'character') {
      // "keep this exact face" carried a frontal portrait crop's angle onto top-down tokens
      // (two campaign tokens, 2026-10-11 to 16): identity is bound here, pose and camera are not.
      lines.push(
        `Image ${n}${who} is a CHARACTER reference: paint the features, hair, skin, build and ` +
          'kit of this person faithfully, posed and framed as the prompt and the source image say.'
      );
    } else if (r.role === 'object') {
      // Gemini treats object references as their own category (up to 10 on flash, 6 on pro):
      // a crop of a weapon head or a shield face, reproduced rather than described (2026-10-16).
      lines.push(
        `Image ${n}${who} is an OBJECT reference: reproduce this exact object, its shape, ` +
          'materials, colours and markings, belonging to the figure, held or worn where the ' +
          'instruction says.'
      );
    } else if (r.role === 'pose') {
      // Wording proven on the bear, hound, and troll (2026-09-24): angle and silhouette held,
      // the old drawing did not come back.
      lines.push(
        `Image ${n}${who} is a POSE reference only: match its exact pose, body position, head ` +
          'direction, camera angle, and silhouette. Do not copy its drawing, colours, rendering, ' +
          'or level of detail; it is an old low-quality image being replaced.'
      );
    } else if (kind === 'battlemap' || kind === 'overland') {
      lines.push(
        `Image ${n}${who} is a STYLE reference only: match its palette, brushwork, and painted ` +
          'finish. Copy nothing else from it: no layout, no objects, no rooms, no shapes.'
      );
    } else {
      lines.push(
        `Image ${n}${who} is a STYLE reference only: match its palette, brushwork, lighting, and ` +
          'camera angle; do not copy its subject.'
      );
    }
  });
  return `${lines.join(' ')} `;
}

export interface RenderInput {
  tool: string;
  kind: Kind;
  tier: Tier;
  /** Prompt without the token plate sentence; render() appends it with the chosen key. */
  prompt: string;
  images: InlineImage[];
  slug: string;
  /** Tokens only; defaults to medium (512). */
  creatureSize?: CreatureSize;
  /** Replaces the preset's API aspect (props: from the footprint or the source's shape). */
  aspect?: Aspect;
  /** Props only: the exact finished canvas, e.g. 600x300 for a 2x1 prop. */
  canvas?: Dimensions;
  /** Props only: where the subject goes on that canvas (an edit: where the original sat). */
  box?: Box;
  /** Battlemaps only: the unpadded source and how it was padded for the API. */
  map?: { source: Buffer; plan: PadPlan };
  /** Thinking level for the render; unset leaves the model's default (medium on flash). */
  thinking?: ThinkingLevel;
  /**
   * Tokens from a mannequin: the head anchor the render carries (a bust render() attaches after
   * the images, the caller's character head, or none) and how many steered retries a verdict
   * outside the band may buy.
   */
  head?: { anchor: HeadAnchor; retries: number };
}

/** Kinds rendered on a chroma plate, edge-checked, and cut to alpha. */
const CUT_KINDS: ReadonlySet<Kind> = new Set(['token', 'prop']);

export interface RenderOutput {
  file: string;
  kind: Kind;
  tier: Tier;
  model: string;
  width: number;
  height: number;
  estimatedUsd: number;
  sessionEstimatedUsd: number;
  /** Thinking tokens the model spent, billed at the text rate and folded into estimatedUsd. */
  thinkingTokens?: number;
  /** Tokens and props: the chroma key chosen for this subject and the cut's numbers. */
  chromaKey?: ChromaKey;
  plate?: string;
  cutout?: Omit<CutoutResult, 'file' | 'width' | 'height'>;
  /** Tokens and props: the first render clipped the subject at the edge and was redone. */
  edgeRetried?: boolean;
  /** Mannequin tokens: the judge's word on the head, the anchor used, and any steered retries. */
  head?: HeadReport;
  /** Battlemaps: the source's pixel size and the whole-number scale the map was delivered at. */
  source?: { width: number; height: number };
  scale?: number;
  /** Battlemaps: how far the layout moved against the source (per-mille of the long side). */
  drift?: DriftReport;
  /** Battlemaps: the first render drifted and was redone. */
  driftRetried?: boolean;
  /** Battlemaps: source and result in alternating squares, for the eye to check alignment. */
  check?: string;
}

/** Render one image through the API, post-process it, write it, meter it; cut tokens and props. */
export async function render(deps: ToolDeps, input: RenderInput): Promise<RenderOutput> {
  const preset = PRESETS[input.kind];
  const cut = CUT_KINDS.has(input.kind);
  let chromaKey: ChromaKey | undefined;
  if (cut) {
    // Sample every attached image (source token for edits, reference tokens for generates) and
    // read the prompt: a generated subject's colour is only in the words.
    chromaKey = await pickChromaKey(
      input.images.map(i => i.data),
      input.prompt
    );
  }
  // A mannequin token's bust goes last, bound by its number; the plate sentence closes the prompt.
  const promptWith = (bust: Bust | undefined) =>
    [
      input.prompt,
      bust ? bustBinding(input.images.length + 1) : '',
      chromaKey ? chromaSuffix(chromaKey) : '',
    ]
      .filter(Boolean)
      .join(' ');

  fs.mkdirSync(deps.outputDir, { recursive: true });
  const id = newId();
  if (input.kind === 'battlemap' || input.kind === 'overland') return renderMap(deps, input, id);
  const once = async (bust?: Bust) => {
    const result = await deps.gemini.generate({
      tier: input.tier,
      prompt: promptWith(bust),
      images: bust ? [...input.images, loadBust(bust)] : input.images,
      aspect: input.aspect ?? preset.aspect,
      size: preset.size,
      ...(input.thinking ? { thinking: input.thinking } : {}),
    });
    const png = await postProcess(result.image.data, preset.post);
    const usd = deps.spend.record(
      input.tool,
      input.tier,
      preset.size,
      thinkingUsd(input.tier, result.usage?.thinking)
    );
    return { result, png, usd };
  };

  let bust: Bust | undefined =
    input.head && isBust(input.head.anchor) ? input.head.anchor : undefined;
  let { result, png, usd: estimatedUsd } = await once(bust);
  let thinkingTokens = result.usage?.thinking;
  let edgeRetried: boolean | undefined;
  const clippedPath = (n: number) =>
    path.join(deps.outputDir, `${input.kind}-${slugOf(input.slug)}-${id}-clipped${n}.png`);
  if (cut && chromaKey) {
    // Nothing may clip off a token or a prop (owner rule 2026-09-24). A subject touching the
    // plate edge is rendered once more; if that is clipped too, refuse rather than deliver it.
    let contact = await edgeContact(png, chromaKey);
    if (contact > EDGE_LIMIT) {
      fs.writeFileSync(clippedPath(1), png);
      const again = await once(bust);
      ({ result, png } = again);
      estimatedUsd += again.usd;
      if (again.result.usage) thinkingTokens = (thinkingTokens ?? 0) + again.result.usage.thinking;
      edgeRetried = true;
      contact = await edgeContact(png, chromaKey);
      if (contact > EDGE_LIMIT) {
        fs.writeFileSync(clippedPath(2), png);
        throw new Error(
          `Both renders clip the subject at the image edge (${contact} subject pixels in the ` +
            `outer ${EDGE_BAND} px); a clipped ${input.kind} is never delivered. Kept for inspection: ` +
            `${clippedPath(1)}, ${clippedPath(2)}. Spent about $${estimatedUsd.toFixed(2)}. ` +
            'Describe a more compact pose (weapon held close, wings folded) and try again.'
        );
      }
    }
  }
  // The head check (owner rule 2026-10-16): a mannequin token's head sits inside the owner's
  // band (down, right or up), never bowed with the eyes hidden, never the face lifted to the
  // camera, never a dropped camera. The judge's word steers a re-render (head.ts, heads.ts):
  // far-down goes up the bust dial, far-up to bust-1, a dropped camera is redone once unchanged
  // and then blamed on the capture. At most `retries` re-renders, then the token is delivered
  // flagged; it never refuses, since the judge can be wrong. A retry that clips is kept and
  // counted, never delivered; the earlier clean plate stays.
  let head: HeadReport | undefined;
  if (cut && chromaKey && input.head) {
    const anchorName = (b: Bust | undefined) =>
      input.head?.anchor === 'character' ? (b ? `character + ${b}` : 'character') : (b ?? 'none');
    let checked = await checkHead(deps, png);
    const verdicts: HeadVerdict[] = [checked.verdict];
    const kept: string[] = [];
    let retries = 0;
    let drops = 0;
    while (!checked.error && needsRetry(checked.verdict) && retries < input.head.retries) {
      const verdict = checked.verdict;
      let next = bust;
      if (verdict === 'camera-dropped') {
        if (drops) break; // twice: the capture is the cause, not the bust
        drops++;
      } else {
        next = steerBust(verdict, bust);
      }
      const keptPath = path.join(
        deps.outputDir,
        `${input.kind}-${slugOf(input.slug)}-${id}-head${kept.length + 1}-${verdict}.png`
      );
      fs.writeFileSync(keptPath, png);
      kept.push(keptPath);
      const again = await once(next);
      estimatedUsd += again.usd;
      if (again.result.usage) thinkingTokens = (thinkingTokens ?? 0) + again.result.usage.thinking;
      retries++;
      if ((await edgeContact(again.png, chromaKey)) > EDGE_LIMIT) {
        // Never delivered; the verdict and the plate stand as they were, so the loop may try again.
        fs.writeFileSync(clippedPath(kept.length + 1), again.png);
        kept.pop();
        fs.rmSync(keptPath, { force: true });
        continue;
      }
      ({ result, png } = again);
      bust = next;
      checked = await checkHead(deps, png);
      verdicts.push(checked.verdict);
    }
    head = {
      verdict: checked.verdict,
      inBand: inBand(checked.verdict),
      anchorUsed: anchorName(bust),
      ...(verdicts.length > 1 ? { first: verdicts[0], verdicts, retried: true, kept } : {}),
      ...(checked.verdict === 'camera-dropped'
        ? {
            advice:
              'The camera dropped (the body seen from the front) on this capture; change the ' +
              'capture rather than the words or the bust.',
          }
        : {}),
      ...(checked.error ? { error: checked.error } : {}),
    };
  }
  const base = {
    kind: input.kind,
    tier: input.tier,
    model: result.model,
    estimatedUsd,
    sessionEstimatedUsd: deps.spend.totalUsd,
    ...(thinkingTokens !== undefined ? { thinkingTokens } : {}),
    ...(edgeRetried ? { edgeRetried } : {}),
    ...(head ? { head } : {}),
  };

  if (cut && chromaKey) {
    const plate = path.join(deps.outputDir, `${input.kind}-${slugOf(input.slug)}-${id}-plate.png`);
    fs.writeFileSync(plate, png);
    const file = path.join(deps.outputDir, filename(input.kind, input.slug, id));
    const isProp = input.kind === 'prop';
    const result = await deps.cutout({
      input: plate,
      output: file,
      method: 'auto',
      color: chromaKey,
      // A token is fitted to its square by the script; a prop keeps the plate canvas here and is
      // fitted to its exact tile size below.
      size: isProp ? 0 : TOKEN_EDGE[input.creatureSize ?? 'medium'],
    });
    const { file: _f, width, height, ...rest } = result;
    if (isProp) {
      const canvas = input.canvas ?? { width: 300, height: 300 };
      fs.writeFileSync(
        file,
        await fitRect(fs.readFileSync(file), canvas.width, canvas.height, 4, input.box)
      );
      return { ...base, file, ...canvas, chromaKey, plate, cutout: rest };
    }
    return { ...base, file, width, height, chromaKey, plate, cutout: rest };
  }

  const dims = await dimensions(png);
  const file = path.join(deps.outputDir, filename(input.kind, input.slug, id));
  fs.writeFileSync(file, png);
  return { ...base, file, width: dims.width, height: dims.height };
}

/** Ask the judge about a plate's head; a judge that cannot be reached never blocks the render. */
async function checkHead(
  deps: ToolDeps,
  plate: Buffer
): Promise<{ verdict: HeadVerdict; error?: string }> {
  try {
    const verdict = await judgeHead(deps.gemini, plate);
    deps.spend.recordJudge(JUDGE_USD);
    return { verdict };
  } catch (e) {
    return { verdict: 'unclear', error: e instanceof Error ? e.message : String(e) };
  }
}

/** What the thinking tokens of one render cost, at the tier's text output rate. */
export function thinkingUsd(tier: Tier, tokens: number | undefined): number {
  if (!tokens) return 0;
  return (tokens * TEXT_OUT_PRICE[tier]) / 1_000_000;
}

/** Display copy of a drift report: shares as per-mille of the long side, rounded. */
function driftSummary(d: DriftReport): DriftReport {
  const pm = (v: number) => Math.round(v * 10000) / 10;
  return {
    ...d,
    median: pm(d.median),
    p95: pm(d.p95),
    max: pm(d.max),
    structure: Math.round(d.structure * 1000) / 1000,
  };
}

/**
 * A battlemap: render the padded source, map the result back onto the source's pixel grid, and
 * check the layout did not move (owner rule 2026-10-02: Foundry walls and lights are traced over
 * it). A drifted render is redone once (both billed); a second drift is refused, both kept.
 */
async function renderMap(deps: ToolDeps, input: RenderInput, id: string): Promise<RenderOutput> {
  const kind = input.kind;
  const preset = PRESETS[kind];
  const map = input.map;
  if (!map) throw new Error(`${kind} render needs its source and pad plan`);
  const once = async () => {
    const result = await deps.gemini.generate({
      tier: input.tier,
      prompt: input.prompt,
      images: input.images,
      aspect: input.aspect ?? preset.aspect,
      size: preset.size,
      ...(input.thinking ? { thinking: input.thinking } : {}),
    });
    const usd = deps.spend.record(
      input.tool,
      input.tier,
      preset.size,
      thinkingUsd(input.tier, result.usage?.thinking)
    );
    const back = await mapBack(result.image.data, map.plan);
    const measured = await measureDrift(map.source, back.png);
    // An overland map has nothing traced over it: only a grossly moved geography fails.
    const drift =
      kind === 'overland' ? { ...measured, failed: overlandDrifted(measured) } : measured;
    return { result, ...back, drift, usd };
  };
  const stem = path.join(deps.outputDir, `${kind}-${slugOf(input.slug)}-${id}`);
  let r = await once();
  // Every render of one map has the same size, so one format serves the drifted copies too.
  const format = mapFormat(r.width, r.height);
  const keep = async (n: number) => {
    const kept = `${stem}-drifted${n}.${format}`;
    fs.writeFileSync(kept, await encodeMap(r.png, format));
    return kept;
  };
  let estimatedUsd = r.usd;
  let driftRetried: boolean | undefined;
  if (r.drift.failed) {
    const kept1 = await keep(1);
    const first = driftSummary(r.drift);
    r = await once();
    estimatedUsd += r.usd;
    driftRetried = true;
    if (r.drift.failed) {
      const kept2 = await keep(2);
      const d = driftSummary(r.drift);
      throw new Error(
        `Both renders moved the map's layout (${first.drifted} of ${first.tiles} and ` +
          `${d.drifted} of ${d.tiles} measured tiles drifted, worst ${d.max}‰ of the long ` +
          (kind === 'overland'
            ? 'side); the geography moved too far to be the same map. '
            : 'side); a drifted battlemap is never delivered, since walls and lights are traced ' +
              'over it. ') +
          `Kept for inspection: ${kept1}, ${kept2}. Spent ` +
          `about $${estimatedUsd.toFixed(2)}. Ask for a lighter change and try again.`
      );
    }
  }
  const file = path.join(deps.outputDir, filename(kind, input.slug, id, format));
  fs.writeFileSync(file, await encodeMap(r.png, format));
  const check = `${stem}-check.jpg`;
  fs.writeFileSync(check, await checkerboard(map.source, r.png));
  return {
    file,
    kind,
    tier: input.tier,
    model: r.result.model,
    width: r.width,
    height: r.height,
    estimatedUsd,
    sessionEstimatedUsd: deps.spend.totalUsd,
    ...(r.result.usage ? { thinkingTokens: r.result.usage.thinking } : {}),
    source: { ...map.plan.source },
    scale: r.scale,
    drift: driftSummary(r.drift),
    ...(driftRetried ? { driftRetried } : {}),
    check,
  };
}

/** Squares across the short side of the alignment check image. */
const CHECK_SQUARES = 8;

/**
 * Source and result in alternating squares at up to 2048 px: a moved wall or path breaks at every
 * square boundary it crosses, which the eye catches at once. JPEG: it is for looking at, and a
 * PNG of it ran to 8 MB.
 */
async function checkerboard(source: Buffer, result: Buffer): Promise<Buffer> {
  const m = await sharp(result).metadata();
  const k = Math.min(1, 2048 / Math.max(m.width ?? 1, m.height ?? 1));
  const w = Math.max(1, Math.round((m.width ?? 1) * k));
  const h = Math.max(1, Math.round((m.height ?? 1) * k));
  const [a, b] = await Promise.all(
    [source, result].map(img =>
      sharp(img).removeAlpha().resize(w, h, { fit: 'fill' }).raw().toBuffer()
    )
  );
  const cell = Math.max(1, Math.round(Math.min(w, h) / CHECK_SQUARES));
  const out = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const from = (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0 ? a : b;
      out[i] = from[i];
      out[i + 1] = from[i + 1];
      out[i + 2] = from[i + 2];
    }
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } })
    .jpeg({ quality: 85 })
    .toBuffer();
}

function slugOf(slug: string): string {
  return filename('token', slug, 'x')
    .replace(/^token-/, '')
    .replace(/-x\.png$/, '');
}

export function newId(): string {
  return randomBytes(4).toString('hex');
}
