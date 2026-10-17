// Stage 3's pairs sheet: for every item, the matched-body render (run 1 for the NPCs, stage 2
// for the PCs) on the left and the one-body render on the right, numbered as on the blind
// sheet, no verdicts. The owner rules on build with both in view.
//
//   node compare-sheet.mjs <stage-3 run dir> <out png>
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(
  'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen/package.json'
);
const sharp = require('sharp');
const [runDir, outPng, headerText, leftRun] = process.argv.slice(2);
const run1 = 'D:/Workbench/LOCAL/artificer-output/headtest/2026-10-17-01-59';
const run2 = 'D:/Workbench/LOCAL/artificer-output/headtest/2026-10-17-13-33-universal';
const read = d => JSON.parse(fs.readFileSync(path.join(d, 'manifest.json'), 'utf8'));
const m3 = read(runDir);
const matched = {};
for (const it of [...read(run1).items, ...read(run2).items])
  if (it.file && !matched[it.id]) matched[it.id] = it;
// The PCs' matched renders are stage 2's (the same route and words); run 1's PCs ran on their legacy heads.
for (const it of read(run2).items) if (it.file) matched[it.id] = it;
// An explicit left-hand run (an A/B against another run of the same subjects) wins over both.
if (leftRun) for (const it of read(leftRun).items) if (it.file) matched[it.id] = it;

const items = m3.items.filter(it => it.file);
const cols = 3; // three pairs a row
const img = 360;
const gap = 6;
const pairW = img * 2 + gap;
const labelH = 44;
const pad = 10;
const header = 60;
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
      `<svg width="${W}" height="${header}"><text x="12" y="38" font-family="Arial" font-size="22" fill="#fff">` +
        esc(
          headerText ??
            'Stage 3, pairs, blind: LEFT the matched-body render (runs 1 and 2), RIGHT the same subject and words on the human-male capture. Numbers as on the blind sheet.'
        ) +
        '</text></svg>'
    ),
    left: 0,
    top: 0,
  },
];
for (const [i, it] of items.entries()) {
  const x = (i % cols) * (pairW + 2 * pad) + pad;
  const y = header + Math.floor(i / cols) * (img + labelH + 2 * pad) + pad;
  const m = matched[it.id];
  if (m) layers.push({ input: await fit(m.file), left: x, top: y });
  layers.push({ input: await fit(it.file), left: x + img + gap, top: y });
  const mCap = m?.capture ?? m?.args?.sourceImage?.match(/mannequin-(.+)\.png$/)?.[1] ?? '';
  layers.push({
    input: Buffer.from(
      `<svg width="${pairW}" height="${img + labelH}">` +
        `<rect x="1" y="1" width="${img - 2}" height="${img - 2}" fill="none" stroke="#555" stroke-width="2"/>` +
        `<rect x="${img + gap + 1}" y="1" width="${img - 2}" height="${img - 2}" fill="none" stroke="#777" stroke-width="2"/>` +
        `<text x="6" y="${img + 18}" font-family="Arial" font-size="15" fill="#ccc">${esc(`left: ${mCap}`)}</text>` +
        `<text x="${img + gap + 6}" y="${img + 18}" font-family="Arial" font-size="15" fill="#fff">${esc(`${i + 1} · ${it.id}  one body: ${it.capture ?? ''}`)}</text>` +
        '</svg>'
    ),
    left: x,
    top: y,
  });
}
await sharp({ create: { width: W, height: H, channels: 4, background: '#2a2c2a' } })
  .composite(layers)
  .png()
  .toFile(outPng);
console.log(`${items.length} pairs → ${outPng} (${W}x${H})`);
