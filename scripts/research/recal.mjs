// Recalibration of the two checks against the owner's stage-1 and stage-2 rulings, no renders.
// Head check: four exemplar variants over every ruled plate; anatomy check: three facing
// wordings over every delivered plate (all of which have the head at the top).
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const repo = 'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen';
const out = 'D:/Workbench/LOCAL/artificer-output/headtest/recalibration-2026-10-17';
const desk = 'C:/Users/sippelmc/Desktop/TokenImprovements';
const require = createRequire(`${repo}/package.json`);
const sharp = require('sharp');
const load = f => import(pathToFileURL(path.join(repo, 'dist', f)).href);
const { config } = await load('config.js');
const { Gemini } = await load('gemini.js');
const { HEAD_PROMPT, parseVerdict, inBand } = await load('head.js');
const { loadExemplars } = await load('heads.js');
const { anatomyPrompt, parseAnatomy } = await load('anatomy.js');
const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });
fs.mkdirSync(path.join(out, 'exemplars'), { recursive: true });

const run1 = 'D:/Workbench/LOCAL/artificer-output/headtest/2026-10-17-01-59';
const run2 = 'D:/Workbench/LOCAL/artificer-output/headtest/2026-10-17-13-33-universal';
const m1 = JSON.parse(fs.readFileSync(path.join(run1, 'manifest.json'), 'utf8'));
const m2 = JSON.parse(fs.readFileSync(path.join(run2, 'manifest.json'), 'utf8'));
const r1 = JSON.parse(fs.readFileSync(path.join(run1, 'stage1-rulings.json'), 'utf8'));
const r2 = JSON.parse(fs.readFileSync(path.join(run2, 'stage2-rulings.json'), 'utf8'));
const byId = m => Object.fromEntries(m.items.map(it => [it.id, it]));
const i1 = byId(m1);
const i2 = byId(m2);

// The ruled cells, each with the plate the live check saw.
const cells = [];
for (const r of r1.rulings)
  cells.push({
    stage: 1,
    n: r.n,
    id: r.id,
    plate: r.delivered ? i1[r.id].plate : r.file,
    accepts: r.ownerAccepts,
    owner: r.owner,
    was: r.judge,
  });
for (const r of r2.rulings)
  cells.push({
    stage: 2,
    n: r.n,
    id: r.id,
    plate: i2[r.id].plate,
    accepts: r.owner.accepts,
    owner: r.owner.head,
    was: r.headCheck,
  });
console.log(`${cells.length} ruled cells (${cells.filter(c => c.accepts !== null).length} clear)`);

// Today's exemplars: head-and-shoulders crops of the stage-2 tokens the owner ruled, like the band crops.
const tok = n => path.join(desk, '06-stage-2-hair-line-universal-pcs/tokens', n);
const crops = {
  'far-down': {
    file: tok('08-cecil-combat.png'),
    box: { left: 150, top: 50, width: 220, height: 220 },
    cell: [2, 8],
  },
  down: {
    file: tok('05-lysandra-stand.png'),
    box: { left: 150, top: 60, width: 220, height: 220 },
    cell: [2, 5],
  },
  right: {
    file: tok('03-kartor-stand.png'),
    box: { left: 145, top: 0, width: 220, height: 220 },
    cell: [2, 3],
  },
  up: {
    file: tok('04-kartor-combat.png'),
    box: { left: 145, top: 40, width: 220, height: 220 },
    cell: [2, 4],
  },
};
const legacyFarUp = {
  data: fs.readFileSync(
    path.join(repo, 'mannequins', 'heads', 'band', 'wrong-12-cecil-combat.png')
  ),
  mimeType: 'image/png',
};
const todayCrops = [];
const todayWhole = [];
for (const [grade, c] of Object.entries(crops)) {
  const crop = await sharp(c.file).extract(c.box).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(out, 'exemplars', `${grade}-crop.png`), crop);
  todayCrops.push({ data: crop, mimeType: 'image/png' });
  todayWhole.push({ data: fs.readFileSync(c.file), mimeType: 'image/png' });
}
const prodCecilCombat = 'C:/Users/sippelmc/Desktop/PC Tokens/prod/cecil-edmunds-combat.png';
const farUpWhole = fs.existsSync(prodCecilCombat)
  ? { data: fs.readFileSync(prodCecilCombat), mimeType: 'image/png' }
  : legacyFarUp;
const exemplarCells = new Set(Object.values(crops).map(c => c.cell.join(':')));

/** The five-step prompt with a FAR-DOWN exemplar: Images 1 to 5 graded, Image 6 the token. */
const PROMPT5 =
  'You are grading the head angle of a virtual tabletop token: one upright figure on a flat ' +
  'coloured plate, seen from directly above, the camera looking straight down onto the tops of ' +
  'the shoulders. The wanted head faces the way the body faces and is tipped just enough toward ' +
  'the camera that the brow, both eyes, the nose and the mouth read, with hair over the top ' +
  'half of the head. Images 1 to 5 are heads from tokens at this camera, each with its grade. ' +
  'Image 1 is FAR-DOWN, which is wrong: the head bowed too far, the crown and hair large, the ' +
  'eyes hidden, shut or turned so far down that they do not read. Image 2 is DOWN: the lowest ' +
  'acceptable tilt, the crown and hair still large, the eyes turned down but readable under the ' +
  'brow. Image 3 is RIGHT: the ideal, brow, both eyes, nose and mouth all reading under the hair. ' +
  'Image 4 is UP: the highest acceptable tilt, the face forward with every feature reading and ' +
  'the hair still over the top of the head. Image 5 is FAR-UP, which is wrong: the face lifted ' +
  "to the camera as in a portrait, the eyes at mid-height of the head, the chin's underside or " +
  'the throat showing. Image 6 is the token to grade. Compare the tilt of its head to the five ' +
  'and answer with exactly one of these words. FAR-DOWN: like Image 1 or lower. DOWN: like Image ' +
  '2. RIGHT: like Image 3. UP: like Image 4. FAR-UP: like Image 5 or beyond it. CAMERA-DROPPED: ' +
  'the camera is not above the figure, the chest or the front of the body faces the viewer and ' +
  'the figure is seen from the front or the side rather than from above. UNCLEAR: the figure is ' +
  'lying flat on the ground (on its back or its side, arms out, dropped gear beside it), or no ' +
  'face can be made out (a helmet with no visor, a deep hood, the face turned away). Judge only ' +
  "how far the head is tipped toward the camera, never the figure's race, kit, art or pose. One word.";

const variants = {
  'V0 current': { prompt: HEAD_PROMPT, exemplars: loadExemplars() },
  'V1 today crops': { prompt: PROMPT5, exemplars: [...todayCrops, legacyFarUp] },
  'V2 today whole tokens': { prompt: PROMPT5, exemplars: [...todayWhole, farUpWhole] },
  'V3 current + far-down': { prompt: PROMPT5, exemplars: [todayCrops[0], ...loadExemplars()] },
};

async function pool(items, n, fn) {
  let i = 0;
  const workers = Array.from({ length: n }, async () => {
    while (i < items.length) {
      const k = i++;
      await fn(items[k], k);
    }
  });
  await Promise.all(workers);
}

const results = {};
for (const [name, v] of Object.entries(variants)) {
  const verdicts = new Array(cells.length);
  await pool(cells, 4, async (c, k) => {
    const text = await gemini.judge({
      prompt: v.prompt,
      images: [...v.exemplars, { data: fs.readFileSync(c.plate), mimeType: 'image/png' }],
    });
    verdicts[k] = parseVerdict(text);
  });
  const rows = cells.map((c, k) => ({
    ...c,
    verdict: verdicts[k],
    isExemplar: exemplarCells.has(`${c.stage}:${c.n}`),
  }));
  const scored = rows.filter(r => r.accepts !== null && !(name !== 'V0 current' && r.isExemplar));
  const agree = scored.filter(r => inBand(r.verdict) === r.accepts);
  const missedRej = scored.filter(r => r.accepts === false && inBand(r.verdict));
  const falseRej = scored.filter(r => r.accepts === true && !inBand(r.verdict));
  results[name] = {
    scored: scored.length,
    agree: agree.length,
    missedRejections: missedRej.map(r => `s${r.stage}#${r.n} ${r.id} → ${r.verdict}`),
    falseRejections: falseRej.map(r => `s${r.stage}#${r.n} ${r.id} → ${r.verdict}`),
    rows,
  };
  console.log(
    `\n${name}: ${agree.length}/${scored.length} agree; missed rejections: ${missedRej.length}; false rejections: ${falseRej.length}`
  );
  for (const r of rows) {
    const mark = r.accepts === null ? '~' : inBand(r.verdict) === r.accepts ? ' ' : 'X';
    console.log(
      `  ${mark} s${r.stage}#${String(r.n).padStart(2)} ${r.id.padEnd(16)} ${String(r.verdict).padEnd(14)} owner: ${String(r.owner).padEnd(22)}${r.isExemplar ? ' (exemplar)' : ''}`
    );
  }
}

// The facing question: every delivered plate, head at the top on all of them.
const delivered = [
  ...m1.items.filter(it => it.plate).map(it => ({ stage: 1, id: it.id, plate: it.plate })),
  ...m2.items.filter(it => it.plate).map(it => ({ stage: 2, id: it.id, plate: it.plate })),
];
const facingWordings = {
  'F0 current': anatomyPrompt('token'),
  'F1 head nearest edge': anatomyPrompt('token')
    .replace(
      "Then say which edge of the image the creature's head or front points to. ",
      "Then say which edge of the image the creature's head is nearest to. The token is seen from " +
        'above, so the head sits toward one edge of the image and the feet or the tail toward the ' +
        'opposite edge; answer with the edge the head is at, whatever direction the eyes look. '
    )
    .replace(
      'FACING: TOP, BOTTOM, LEFT or RIGHT; NONE for a creature with no front (a mushroom, a ' +
        'radial creature, a hanging stalactite); UNCLEAR when you cannot tell',
      'FACING: the edge the head is nearest, TOP, BOTTOM, LEFT or RIGHT; NONE for a creature with ' +
        'no head end (a mushroom, a radial creature, a hanging stalactite); UNCLEAR when you cannot tell'
    ),
  'F2 upper or lower half': anatomyPrompt('token')
    .replace(
      "Then say which edge of the image the creature's head or front points to. ",
      'Then locate the head within the figure as seen from above: if the head is in the upper ' +
        'part of the figure and the feet or tail in the lower part, the facing is TOP; head in the ' +
        'lower part, BOTTOM; head toward the left edge, LEFT; toward the right edge, RIGHT. Ignore ' +
        'which way the eyes look. '
    )
    .replace(
      'FACING: TOP, BOTTOM, LEFT or RIGHT; NONE for a creature with no front (a mushroom, a ' +
        'radial creature, a hanging stalactite); UNCLEAR when you cannot tell',
      'FACING: TOP, BOTTOM, LEFT or RIGHT as located above; NONE for a creature with no head end ' +
        '(a mushroom, a radial creature, a hanging stalactite); UNCLEAR when you cannot tell'
    ),
};
for (const [name, prompt] of Object.entries(facingWordings)) {
  if (
    name !== 'F0 current' &&
    !prompt.includes('head is nearest') &&
    !prompt.includes('upper part')
  )
    throw new Error(`${name}: replace failed`);
}
const facing = {};
for (const [name, prompt] of Object.entries(facingWordings)) {
  const rows = new Array(delivered.length);
  await pool(delivered, 4, async (d, k) => {
    const data = await sharp(d.plate)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .png()
      .toBuffer();
    const text = await gemini.judge({ prompt, images: [{ data, mimeType: 'image/png' }] });
    const rep = parseAnatomy(text, 'token');
    rows[k] = {
      ...d,
      facing: rep.facing,
      verdict: rep.verdict,
      flaws: rep.flaws.filter(f => !/Foundry's front/.test(f)),
    };
  });
  const top = rows.filter(r => r.facing === 'top').length;
  facing[name] = {
    top,
    of: rows.length,
    others: rows.filter(r => r.facing !== 'top').map(r => `${r.id} → ${r.facing}`),
    flawedOtherwise: rows.filter(r => r.flaws.length).map(r => `${r.id}: ${r.flaws.join(' | ')}`),
  };
  console.log(
    `\n${name}: facing TOP on ${top}/${rows.length}${facing[name].others.length ? `; others: ${facing[name].others.join(', ')}` : ''}`
  );
  if (facing[name].flawedOtherwise.length)
    console.log(`  other flaws: ${facing[name].flawedOtherwise.join('; ')}`);
}

const calls =
  Object.keys(variants).length * cells.length +
  Object.keys(facingWordings).length * delivered.length;
console.log(`\n${calls} check calls, about $${(calls * 0.002).toFixed(2)}`);
fs.writeFileSync(
  path.join(out, 'recalibration.json'),
  JSON.stringify({ made: new Date().toISOString(), calls, head: results, facing }, null, 2)
);
console.log(path.join(out, 'recalibration.json'));
