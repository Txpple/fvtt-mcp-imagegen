#!/usr/bin/env node
// `npm run headtest`: the measured head-angle test for mannequin tokens (owner rule 2026-10-16:
// every change to the head path runs through this, never one render at a time). It renders a
// fixed set through the real tool path (edit-image, source "mannequin", the server's bust
// anchor and judge), writes a contact sheet with every verdict beside each token, and prints
// the hit rate inside the owner's band, first render and after steering. It loads .env and the
// built server exactly as the MCP does (dist/), so build first.
//
//   node scripts/headtest.mjs [--pcs <pcs.json>] [--npcs-only | --pcs-only] [--repeat <n>]
//                             [--bust <1-4>] [--yes]
//   node scripts/headtest.mjs --rejudge <run dir>          re-judge a run's plates, no renders
//   node scripts/headtest.mjs --judge <image> [<image>...]  judge any plates or tokens, no renders
//
// Without --yes it prints the plan and the estimate and stops. --bust N is the calibration
// mode: one bust across the NPC set, three renders each, no steered retries, so the sheet shows
// where that bust sends a first render. --pcs names a JSON file of PC items (campaign content,
// kept in the campaign repo): [{ "id", "capture", "instruction", "references": [{ "path",
// "role", "label" }] }], paths relative to the file; the character reference is the PC's
// approved token head (mannequins/heads/band/ or the campaign shelf), the object one the
// portrait's head-to-waist crop for the outfit.

import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
if (!fs.existsSync(path.join(dist, 'heads.js'))) {
  console.error(
    '✗ build  dist/ is missing or older than the head anchors. Run `npm run build` first.'
  );
  process.exit(1);
}
const load = file => import(pathToFileURL(path.join(dist, file)).href);
const { config } = await load('config.js');
const { Gemini, PRICE } = await load('gemini.js');
const { SpendMeter } = await load('spend.js');
const { makeCutout } = await load('cutout.js');
const { buildToolRegistry } = await load('registry.js');
const { judgeHead, inBand } = await load('head.js');
const { DEFAULT_BUST } = await load('heads.js');

const mannequin = name => path.join(root, 'mannequins', `mannequin-${name}.png`);

/** One finish line for every NPC, campaign-neutral: the heads are the measurement, not the look. */
const FINISH =
  'Semi-realistic fantasy sourcebook finish, smooth blended shading with crisp edges and fine ' +
  'detail in face, hands and materials.';

/**
 * The words-only NPC set: six bodies and poses, the ones the busts were dialled on (the guard,
 * the knight, the orc, the dwarf woman and the goblin, 2026-10-16) plus a large body. The
 * instructions carry nothing about the head or the camera: the tool does.
 */
const NPCS = [
  {
    id: 'guard',
    capture: 'human-male-combat-spear-shield',
    instruction:
      'Paint it as a town guard: a stocky human man of forty, weathered tan face, short dark ' +
      'beard, bare-headed with cropped grey-brown hair, a quilted gambeson in faded ochre over a ' +
      'mail shirt, a round wooden shield with an iron boss on the forearm, a plain ash spear with ' +
      `a leaf-shaped iron head in the fist, brown leather boots. ${FINISH}`,
  },
  {
    id: 'knight',
    capture: 'human-female-combat-longsword-open',
    instruction:
      'Paint it as a human knight: a tall woman of thirty with dark brown skin, black hair in a ' +
      'tight bun, a steel breastplate over a blue gambeson, mail sleeves, a long straight sword ' +
      `in the fist, the off hand open, tall riding boots. ${FINISH}`,
  },
  {
    id: 'orc',
    capture: 'orc-male-combat-sword-shield',
    instruction:
      'Paint it as an orc raider: a heavy grey-green orc with a jutting lower jaw and two short ' +
      'tusks, small yellow eyes under a heavy brow, a black topknot, hide and iron-scale armour ' +
      'over a bare muscled chest, a notched iron sword in the fist, a crude wooden shield rimmed ' +
      `with iron on the forearm, fur-wrapped boots. ${FINISH}`,
  },
  {
    id: 'dwarf-woman',
    capture: 'dwarf-female-stand-empty',
    instruction:
      'Paint it as a dwarf woman of sixty, broad and short, ruddy cheeks, a grey braid coiled at ' +
      "the nape of her neck, a leather smith's apron over a rust-brown wool dress with the " +
      `sleeves rolled, both hands empty at her sides, sturdy boots. ${FINISH}`,
  },
  {
    id: 'goblin',
    capture: 'small-male-combat-twodaggers',
    instruction:
      'Paint it as a goblin skirmisher: wiry, green-grey skin, large pointed ears, a long hooked ' +
      'nose, yellow eyes, no helmet, a scrap of red cloth tied round the brow, a patched leather ' +
      `jerkin, a curved dagger in each fist, bare feet. ${FINISH}`,
  },
  {
    id: 'bugbear',
    capture: 'large-male-twohand-right',
    instruction:
      'Paint it as a bugbear brute: a hulking hairy figure with coarse rust-brown fur, a broad ' +
      'flat nose, small dark eyes under a heavy brow, bat-like ears, a wide mouth with yellow ' +
      'teeth, a patchwork of hide and scavenged iron plates over the chest, a thick-hafted ' +
      `spiked morningstar in both fists, bare clawed feet. ${FINISH}`,
    creatureSize: 'large',
  },
];

const args = process.argv.slice(2);
const flag = name => args.includes(name);
const opt = name => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const pcsFile = opt('--pcs');
const repeat = Number(opt('--repeat') ?? 3);
const bust = opt('--bust');
const rejudgeDir = opt('--rejudge');
const judgeAt = args.indexOf('--judge');
const yes = flag('--yes');
if (bust && !/^[1-4]$/.test(bust)) {
  console.error('--bust takes 1, 2, 3 or 4');
  process.exit(2);
}

const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });

// --judge: verdicts on any images, no renders. For calibrating the judge on ruled sheets.
if (judgeAt >= 0) {
  const files = args.slice(judgeAt + 1).filter(a => !a.startsWith('--'));
  if (!files.length) {
    console.error('--judge needs one or more image files');
    process.exit(2);
  }
  for (const f of files) {
    const plate = await sharp(f).flatten({ background: '#ff00ff' }).png().toBuffer();
    const verdict = await judgeHead(gemini, plate);
    console.log(`${verdict.padEnd(15)} ${inBand(verdict) ? 'in band ' : 'OUT     '} ${f}`);
  }
  process.exit(0);
}

/** Lay the run out as a contact sheet: each token with its verdicts, green in band, red out. */
async function writeSheet(items, title, out) {
  const cols = 6;
  const cell = 352;
  const labelH = 52;
  const header = 44;
  const pad = 8;
  const rows = Math.ceil(items.length / cols);
  const W = cols * cell;
  const H = header + rows * (cell + labelH);
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const layers = [
    {
      input: Buffer.from(
        `<svg width="${W}" height="${header}"><text x="12" y="30" font-family="Arial" font-size="20" fill="#fff">${esc(title)}</text></svg>`
      ),
      left: 0,
      top: 0,
    },
  ];
  for (const [i, it] of items.entries()) {
    const x = (i % cols) * cell;
    const y = header + Math.floor(i / cols) * (cell + labelH);
    if (it.file && fs.existsSync(it.file)) {
      layers.push({
        input: await sharp(it.file)
          .resize(cell - 2 * pad, cell - 2 * pad, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer(),
        left: x + pad,
        top: y + pad,
      });
    }
    const ok = it.head ? it.head.inBand : false;
    const verdicts = it.head
      ? (it.head.verdicts ?? [it.head.verdict]).join(' → ')
      : `error: ${(it.error ?? '').slice(0, 40)}`;
    const line1 = `${it.id}  ${it.head?.anchorUsed ?? ''}`;
    const line2 = `${verdicts}${it.head?.advice ? '  (change the capture)' : ''}`;
    layers.push({
      input: Buffer.from(
        `<svg width="${cell}" height="${cell + labelH}">` +
          `<rect x="2" y="2" width="${cell - 4}" height="${cell - 4}" fill="none" stroke="${ok ? '#4c4' : '#e44'}" stroke-width="4"/>` +
          `<text x="8" y="${cell + 20}" font-family="Arial" font-size="15" fill="#fff">${esc(line1)}</text>` +
          `<text x="8" y="${cell + 40}" font-family="Arial" font-size="14" fill="${ok ? '#9e9' : '#f99'}">${esc(line2)}</text>` +
          '</svg>'
      ),
      left: x,
      top: y,
    });
  }
  await sharp({ create: { width: W, height: H, channels: 4, background: '#2a2c2a' } })
    .composite(layers)
    .png()
    .toFile(out);
}

/** Hit rates for one group: first-render and final verdicts inside the band. */
function rate(items) {
  const n = items.length;
  const first = items.filter(
    it => it.head && inBand((it.head.verdicts ?? [it.head.verdict])[0])
  ).length;
  const final = items.filter(it => it.head?.inBand).length;
  return { n, first, final };
}

function report(items, usd) {
  const groups = [...new Set(items.map(it => it.group))];
  const lines = [];
  for (const g of groups) {
    const r = rate(items.filter(it => it.group === g));
    lines.push(`${g}: first render ${r.first}/${r.n} in band, after steering ${r.final}/${r.n}`);
  }
  const all = rate(items);
  lines.push(`all: first render ${all.first}/${all.n}, after steering ${all.final}/${all.n}`);
  if (usd !== undefined) lines.push(`spent about $${usd.toFixed(2)}`);
  return lines;
}

// --rejudge: the judge again over a run's delivered plates, no renders.
if (rejudgeDir) {
  const manifest = JSON.parse(fs.readFileSync(path.join(rejudgeDir, 'manifest.json'), 'utf8'));
  const items = [];
  for (const it of manifest.items) {
    if (!it.plate) {
      items.push(it);
      continue;
    }
    const verdict = await judgeHead(gemini, fs.readFileSync(it.plate));
    const keptVerdicts = [];
    for (const k of it.head?.kept ?? [])
      keptVerdicts.push(await judgeHead(gemini, fs.readFileSync(k)));
    const head = {
      ...it.head,
      verdict,
      inBand: inBand(verdict),
      verdicts: [...keptVerdicts, verdict],
      previous: it.head?.verdicts ?? [it.head?.verdict],
    };
    items.push({ ...it, head });
    console.log(
      `${it.id.padEnd(16)} was ${(it.head?.verdicts ?? [it.head?.verdict]).join(' → ')}  now ${head.verdicts.join(' → ')}`
    );
  }
  const lines = report(items);
  fs.writeFileSync(
    path.join(rejudgeDir, 'manifest-rejudge.json'),
    JSON.stringify({ ...manifest, items }, null, 2)
  );
  await writeSheet(
    items,
    `headtest re-judged: ${lines.join('; ')}`,
    path.join(rejudgeDir, 'sheet-rejudge.png')
  );
  console.log(lines.join('\n'));
  console.log(`sheet: ${path.join(rejudgeDir, 'sheet-rejudge.png')}`);
  process.exit(0);
}

// The plan.
const items = [];
const pcsOnly = flag('--pcs-only');
const npcsOnly = flag('--npcs-only') || Boolean(bust);
if (!npcsOnly) {
  if (!pcsFile) {
    console.log(
      'No --pcs file given: the PC set is skipped (it is campaign content; see the header).'
    );
  } else {
    const dir = path.dirname(path.resolve(pcsFile));
    const pcs = JSON.parse(fs.readFileSync(pcsFile, 'utf8'));
    for (const pc of pcs) {
      items.push({
        id: pc.id,
        group: 'pc',
        args: {
          sourceImage: mannequin(pc.capture),
          instruction: pc.instruction,
          kind: 'token',
          source: 'mannequin',
          slug: `headtest-${pc.id}`,
          ...(pc.references
            ? {
                references: pc.references.map(r => ({
                  ...r,
                  path: path.resolve(dir, r.path),
                })),
              }
            : {}),
          ...(pc.headAnchor ? { headAnchor: pc.headAnchor } : {}),
        },
      });
    }
  }
}
if (!pcsOnly) {
  for (const npc of NPCS) {
    for (let k = 1; k <= repeat; k++) {
      items.push({
        id: `${npc.id}-${k}`,
        group: bust ? `npc on bust-${bust}` : 'npc',
        args: {
          sourceImage: mannequin(npc.capture),
          instruction: npc.instruction,
          kind: 'token',
          source: 'mannequin',
          slug: `headtest-${npc.id}-${k}`,
          ...(npc.creatureSize ? { creatureSize: npc.creatureSize } : {}),
          ...(bust ? { headAnchor: `bust-${bust}`, headRetries: 0 } : {}),
        },
      });
    }
  }
}
if (!items.length) {
  console.error('Nothing to render.');
  process.exit(2);
}

// The estimate: a 1K flash render plus about a cent of default thinking; steering may add up
// to two renders to any item, and about a third of first renders have needed one.
const perRender = PRICE.flash['1K'] + 0.01;
const retriesOn = !bust;
const expected = items.length * perRender * (retriesOn ? 1.35 : 1);
const worst = items.length * perRender * (retriesOn ? 3 : 1);
console.log(
  `headtest: ${items.length} renders (${items.filter(i => i.group === 'pc').length} PC, ${items.filter(i => i.group !== 'pc').length} NPC)` +
    (bust
      ? ` on bust-${bust}, no retries (calibration)`
      : ` on the server's ${DEFAULT_BUST} anchor, steering on`)
);
console.log(
  `estimate: about $${expected.toFixed(2)} (at most $${worst.toFixed(2)} if every render needed two retries); the judge adds under a cent`
);
if (!yes) {
  console.log('Add --yes to run.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const runDir = path.join(config.outputDir, 'headtest', bust ? `${stamp}-bust-${bust}` : stamp);
fs.mkdirSync(runDir, { recursive: true });
const spend = new SpendMeter();
const { dispatch } = buildToolRegistry({
  gemini,
  spend,
  outputDir: runDir,
  cutout: makeCutout(config.pythonBin),
});

const manifestPath = path.join(runDir, 'manifest.json');
const save = () =>
  fs.writeFileSync(
    manifestPath,
    JSON.stringify(
      { runDir, bust: bust ?? null, started: stamp, spendUsd: spend.totalUsd, items },
      null,
      2
    )
  );

// Three at a time: the API takes it, and 26 renders at half a minute each is long in series.
let next = 0;
async function worker() {
  while (next < items.length) {
    const it = items[next++];
    const t0 = Date.now();
    try {
      const r = await dispatch('edit-image', it.args);
      Object.assign(it, {
        file: r.file,
        plate: r.plate,
        head: r.head,
        usd: r.estimatedUsd,
        seconds: Math.round((Date.now() - t0) / 1000),
      });
      const v = (r.head.verdicts ?? [r.head.verdict]).join(' → ');
      console.log(
        `${it.id.padEnd(16)} ${r.head.inBand ? 'in band ' : 'OUT     '} ${v.padEnd(36)} ${r.head.anchorUsed}  $${r.estimatedUsd.toFixed(3)}`
      );
    } catch (e) {
      it.error = e instanceof Error ? e.message : String(e);
      console.log(`${it.id.padEnd(16)} ERROR    ${it.error.slice(0, 120)}`);
    }
    save();
  }
}
await Promise.all([worker(), worker(), worker()]);

const lines = report(items, spend.totalUsd);
const sheetPath = path.join(runDir, 'sheet.png');
await writeSheet(
  items,
  `headtest ${stamp}${bust ? ` on bust-${bust}` : ''}: ${lines.join('; ')}`,
  sheetPath
);
save();
console.log(lines.join('\n'));
console.log(`sheet: ${sheetPath}`);
console.log(`manifest: ${manifestPath}`);
