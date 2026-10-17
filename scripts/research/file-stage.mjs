// File a headtest run into the owner's review folder the stage-1 way: a blind numbered sheet
// (delivered tokens, then every kept first render) and a rulings template in the stage folder;
// the run's own sheet (verdicts on it) and the key (the head check's and the anatomy check's
// words per number) in 99-open-only-after-<stage>.
//
//   node file-stage.mjs <run dir> <stage n> <folder label> <sheet title>
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(
  'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen/package.json'
);
const sharp = require('sharp');

const [runDir, stage, label, title, folderNo] = process.argv.slice(2);
if (!runDir || !stage || !label || !title) {
  console.error('usage: file-stage.mjs <run dir> <stage n> <folder label> <sheet title>');
  process.exit(2);
}
const desk = process.env.DESK ?? 'C:/Users/sippelmc/Desktop/TokenImprovements';
const nn = folderNo ?? String(Number(stage) + 5).padStart(2, '0'); // stage 3 → 08 (06 is stage 2, 07 the recalibration)
const stageDir = path.join(desk, `${nn}-stage-${stage}-${label}`);
const keyDir = path.join(desk, `99-open-only-after-stage-${stage}`);
fs.mkdirSync(path.join(stageDir, 'tokens'), { recursive: true });
fs.mkdirSync(keyDir, { recursive: true });

const manifest = JSON.parse(fs.readFileSync(path.join(runDir, 'manifest.json'), 'utf8'));
const items = manifest.items.filter(it => it.file);

const cells = [];
for (const it of items) {
  cells.push({
    n: cells.length + 1,
    id: it.id,
    file: it.file,
    label: `${cells.length + 1} · ${it.id}`,
    headCheck: (it.head?.verdicts ?? [it.head?.verdict]).at(-1),
    anchor: it.head?.anchorUsed,
    anatomy: it.anatomy
      ? { verdict: it.anatomy.verdict, facing: it.anatomy.facing, flaws: it.anatomy.flaws }
      : undefined,
    capture: it.capture,
    delivered: true,
  });
}
for (const it of items) {
  for (const [i, k] of (it.head?.kept ?? []).entries()) {
    cells.push({
      n: cells.length + 1,
      id: it.id,
      file: k,
      label: `${cells.length + 1} · ${it.id}, first render (redone)`,
      headCheck: it.head.verdicts[i],
      anchor: it.head.anchorUsed,
      capture: it.capture,
      delivered: false,
    });
  }
}

// The blind sheet.
const cols = 6;
const img = 420;
const labelH = 40;
const pad = 8;
const header = 56;
const rows = Math.ceil(cells.length / cols);
const W = cols * img;
const H = header + rows * (img + labelH);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const layers = [
  {
    input: Buffer.from(
      `<svg width="${W}" height="${header}"><text x="12" y="36" font-family="Arial" font-size="22" fill="#fff">${esc(title)}</text></svg>`
    ),
    left: 0,
    top: 0,
  },
];
for (const c of cells) {
  const x = ((c.n - 1) % cols) * img;
  const y = header + Math.floor((c.n - 1) / cols) * (img + labelH);
  layers.push({
    input: await sharp(c.file)
      .resize(img - 2 * pad, img - 2 * pad, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer(),
    left: x + pad,
    top: y + pad,
  });
  layers.push({
    input: Buffer.from(
      `<svg width="${img}" height="${img + labelH}">` +
        `<rect x="2" y="2" width="${img - 4}" height="${img - 4}" fill="none" stroke="#666" stroke-width="2"/>` +
        `<text x="10" y="${img + 26}" font-family="Arial" font-size="18" fill="#fff">${esc(c.label)}</text>` +
        '</svg>'
    ),
    left: x,
    top: y,
  });
}
const blind = path.join(stageDir, `SHEET-blind-${cells.length}-tokens.png`);
await sharp({ create: { width: W, height: H, channels: 4, background: '#2a2c2a' } })
  .composite(layers)
  .png()
  .toFile(blind);
fs.copyFileSync(blind, path.join(runDir, `stage${stage}-blind.png`));

// Each token as its own file.
for (const c of cells) {
  const n = String(c.n).padStart(2, '0');
  fs.copyFileSync(
    c.file,
    path.join(
      stageDir,
      'tokens',
      c.delivered ? `${n}-${c.id}.png` : `${n}-${c.id}-first-render-redone.png`
    )
  );
}

// The rulings template.
const lines = cells.map(c => `${c.n} ${c.id}${c.delivered ? '' : ', first render (redone)'}:`);
fs.writeFileSync(
  path.join(stageDir, 'RULINGS-fill-in.md'),
  `# Stage ${stage} rulings: ${label.replace(/-/g, ' ')}, blind\n\n` +
    `Open \`SHEET-blind-${cells.length}-tokens.png\` (or \`tokens/\` to zoom). After each number write one word for the\n` +
    'head: **right**, **bowed**, **lifted**, **dropped** or **unclear** (defined in the top README). Then,\n' +
    'for a known character, whether the face is them (**likeness ok** or **off**), and anything\n' +
    'wrong with the body, gear or facing under Notes. A "first render (redone)" cell is one the\n' +
    'head check sent back; it is here so a rejection is scored too.\n\n' +
    `${lines.join('\n')}\n\n## Notes\n\n`
);

// The key and the verdict sheet, apart.
fs.writeFileSync(
  path.join(keyDir, `stage-${stage}-key-the-checks-words-per-number.json`),
  JSON.stringify(
    { runDir, spendUsd: manifest.spendUsd, body: manifest.body ?? null, cells },
    null,
    2
  )
);
if (fs.existsSync(path.join(runDir, 'sheet.png')))
  fs.copyFileSync(
    path.join(runDir, 'sheet.png'),
    path.join(keyDir, `stage-${stage}-run-SHEET-with-the-checks-verdicts.png`)
  );

console.log(`${cells.length} cells → ${stageDir}`);
console.log(blind);
