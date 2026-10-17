// The eyes-open edit pass (the plan's own rule: a fault is one flaw pass, never a re-roll). Each
// eyeless delivered token on disk gets one edit-image, kind token, telling it to open the eyes and
// change nothing else; the result's plate is then graded by the head check (tilt and eyes), and
// the before/after pairs are filed blind for the owner. Without --yes it lists the set and the
// estimate and stops.
//
//   node eyes-edit.mjs [--yes] [--only <id,id>]
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const repo = 'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen';
const scratch = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const desk = process.env.DESK ?? 'C:/Users/sippelmc/Desktop/TokenImprovements';
const require = createRequire(`${repo}/package.json`);
const sharp = require('sharp');
const load = f => import(pathToFileURL(path.join(repo, 'dist', f)).href);
const { config } = await load('config.js');
const { Gemini, PRICE, JUDGE_USD } = await load('gemini.js');
const { SpendMeter } = await load('spend.js');
const { makeCutout } = await load('cutout.js');
const { buildToolRegistry } = await load('registry.js');
const { judgeHead, judgeEyes, headOk } = await load('head.js');

const args = process.argv.slice(2);
const yes = args.includes('--yes');
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? args[onlyAt + 1].split(',') : [];
let set = JSON.parse(fs.readFileSync(path.join(scratch, 'eyes-edit-set.json'), 'utf8'));
if (only.length) set = set.filter(s => only.some(o => s.id.includes(o)));

/** The line: a face change, as Cecil's hair was; nothing about the head's angle or where it looks. */
const INSTRUCTION =
  "Open both of the figure's eyes fully beneath the brow so that the whites and the irises of both " +
  'eyes show clearly, the lids up, the eyes alive; keep everything else identical: the same head ' +
  'and its tilt, the same hair, face, expression, pose, gear, colours, lighting and camera.';

const per = PRICE.flash['1K'] + 0.01 + 2 * JUDGE_USD;
console.log(
  `eyes-open edit pass: ${set.length} tokens, one edit-image each, then the tilt and eyes words`
);
for (const s of set) console.log(`  ${s.from.padEnd(16)} ${s.id}`);
console.log(`estimate: about $${(set.length * per).toFixed(2)}`);
if (!yes) {
  console.log('Add --yes to run.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 16);
const runDir = path.join(config.outputDir, 'headtest', `${stamp}-eyes-edit`);
fs.mkdirSync(runDir, { recursive: true });
const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });
const spend = new SpendMeter();
const { dispatch } = buildToolRegistry({
  gemini,
  spend,
  outputDir: runDir,
  cutout: makeCutout(config.pythonBin),
});

const items = set.map((s, i) => ({ n: i + 1, ...s }));
let next = 0;
async function worker() {
  while (next < items.length) {
    const it = items[next++];
    try {
      const r = await dispatch('edit-image', {
        sourceImage: it.file,
        instruction: INSTRUCTION,
        kind: 'token',
        slug: `eyes-${it.id}`,
      });
      const plate = fs.readFileSync(r.plate);
      const tilt = await judgeHead(gemini, plate);
      const eyes = await judgeEyes(gemini, plate);
      spend.recordJudge(2 * JUDGE_USD);
      Object.assign(it, {
        out: r.file,
        plate: r.plate,
        tilt,
        eyes,
        ok: headOk(tilt, eyes),
        anatomy: r.anatomy?.verdict,
        usd: r.estimatedUsd,
      });
      console.log(
        `${it.id.padEnd(16)} ${tilt.padEnd(12)} eyes ${eyes.padEnd(8)} ${it.ok ? 'in band' : 'OUT    '} anatomy ${it.anatomy}  $${r.estimatedUsd.toFixed(3)}`
      );
    } catch (e) {
      it.error = e instanceof Error ? e.message : String(e);
      console.log(`${it.id.padEnd(16)} ERROR ${it.error.slice(0, 100)}`);
    }
    fs.writeFileSync(
      path.join(runDir, 'manifest.json'),
      JSON.stringify({ runDir, instruction: INSTRUCTION, spendUsd: spend.totalUsd, items }, null, 2)
    );
  }
}
await Promise.all([worker(), worker(), worker()]);

// The blind pairs sheet: before (the eyeless delivered token) left, after (the edit) right.
const stageDir = path.join(desk, '12-eyes-open-edit-pass');
const keyDir = path.join(desk, '99-open-only-after-the-edit-pass');
fs.mkdirSync(path.join(stageDir, 'tokens'), { recursive: true });
fs.mkdirSync(keyDir, { recursive: true });
const cols = 3,
  img = 360,
  gap = 6,
  pairW = img * 2 + gap,
  labelH = 40,
  pad = 10,
  header = 56;
const rows = Math.ceil(items.length / cols);
const W = cols * (pairW + 2 * pad);
const H = header + rows * (img + labelH + 2 * pad);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const fit = f =>
  sharp(f)
    .resize(img, img, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
const layers = [
  {
    input: Buffer.from(
      `<svg width="${W}" height="${header}"><text x="12" y="36" font-family="Arial" font-size="22" fill="#fff">${esc('The eyes-open edit pass, blind: LEFT the eyeless delivered token, RIGHT the same token after one edit asking for open eyes and nothing else. Rule on the right: eyes yes or no, and is everything else the same?')}</text></svg>`
    ),
    left: 0,
    top: 0,
  },
];
for (const [i, it] of items.entries()) {
  const x = (i % cols) * (pairW + 2 * pad) + pad;
  const y = header + Math.floor(i / cols) * (img + labelH + 2 * pad) + pad;
  layers.push({ input: await fit(it.file), left: x, top: y });
  if (it.out) layers.push({ input: await fit(it.out), left: x + img + gap, top: y });
  layers.push({
    input: Buffer.from(
      `<svg width="${pairW}" height="${img + labelH}"><rect x="1" y="1" width="${img - 2}" height="${img - 2}" fill="none" stroke="#555" stroke-width="2"/><rect x="${img + gap + 1}" y="1" width="${img - 2}" height="${img - 2}" fill="none" stroke="#777" stroke-width="2"/><text x="6" y="${img + 18}" font-family="Arial" font-size="15" fill="#ccc">${esc(`before: ${it.from}`)}</text><text x="${img + gap + 6}" y="${img + 18}" font-family="Arial" font-size="15" fill="#fff">${esc(`${it.n} · ${it.id}${it.error ? ' (error)' : ''}`)}</text></svg>`
    ),
    left: x,
    top: y,
  });
  const nn = String(it.n).padStart(2, '0');
  fs.copyFileSync(it.file, path.join(stageDir, 'tokens', `${nn}-${it.id}-before.png`));
  if (it.out) fs.copyFileSync(it.out, path.join(stageDir, 'tokens', `${nn}-${it.id}-after.png`));
}
const sheet = path.join(stageDir, 'SHEET-pairs-blind.png');
await sharp({ create: { width: W, height: H, channels: 4, background: '#2a2c2a' } })
  .composite(layers)
  .png()
  .toFile(sheet);
fs.writeFileSync(
  path.join(stageDir, 'RULINGS-fill-in.md'),
  '# The eyes-open edit pass, blind\n\nFor each number, on the RIGHT token: **eyes** yes or no; **same** yes or no (did anything else change: pose, face, gear, colours); and a word if it is worse.\n\n' +
    items.map(it => `${it.n} ${it.id} (${it.from}):  eyes:   same:  `).join('\n') +
    '\n\n## Notes\n\n'
);
fs.writeFileSync(
  path.join(keyDir, 'eyes-edit-key-the-checks-words-per-number.json'),
  JSON.stringify({ runDir, instruction: INSTRUCTION, spendUsd: spend.totalUsd, items }, null, 2)
);
const okN = items.filter(it => it.ok).length;
const eyesN = items.filter(it => it.eyes === 'yes').length;
console.log(
  `\neyes after the edit, by the gate: ${eyesN}/${items.length}; in band (tilt and eyes): ${okN}/${items.length}; spent about $${spend.totalUsd.toFixed(2)}`
);
console.log(sheet);
