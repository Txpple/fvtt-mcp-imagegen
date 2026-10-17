// The eyes gate, calibrated on the 53 ruled plates of stages 1 to 3, no renders. Two forms:
// E1, the tilt call answering two words (tilt, then EYES / NO-EYES / NO-FACE); E2, a separate
// eyes-only call on the plate. Two passes each. Scored on the cells the owner labelled for
// eyes: stage 3's "no eyes" (11) and stage 2's cell 7 against the heads the owner accepted in
// stages 2 and 3 (17). Stage 1 is reported, not scored: its blanket ruling did not look at eyes.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = 'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen';
const outDir = 'D:/Workbench/LOCAL/artificer-output/headtest/recalibration-2026-10-17';
const H = 'D:/Workbench/LOCAL/artificer-output/headtest';
const load = f => import(pathToFileURL(path.join(repo, 'dist', f)).href);
const { config } = await load('config.js');
const { Gemini } = await load('gemini.js');
const { HEAD_PROMPT, parseVerdict, inBand } = await load('head.js');
const { loadExemplars } = await load('heads.js');
const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });
const j = f => JSON.parse(fs.readFileSync(f, 'utf8'));

// The cells and their eyes labels.
const cells = [];
{
  const run = `${H}/2026-10-17-01-59`;
  const m = Object.fromEntries(j(`${run}/manifest.json`).items.map(it => [it.id, it]));
  for (const r of j(`${run}/stage1-rulings.json`).rulings)
    cells.push({
      stage: 1,
      n: r.n,
      id: r.id,
      plate: r.delivered ? m[r.id].plate : r.file,
      eyes: r.n === 19 ? 'no' : 'unknown',
      owner: r.owner,
    });
}
{
  const run = `${H}/2026-10-17-13-33-universal`;
  const m = Object.fromEntries(j(`${run}/manifest.json`).items.map(it => [it.id, it]));
  for (const r of j(`${run}/stage2-rulings.json`).rulings)
    cells.push({
      stage: 2,
      n: r.n,
      id: r.id,
      plate: m[r.id].plate,
      eyes: r.n === 7 ? 'no' : [2, 3, 6].includes(r.n) ? 'yes' : 'unknown',
      owner: r.owner.head,
    });
}
{
  const run = `${H}/2026-10-17-14-08-universal-body-human-male`;
  const m = Object.fromEntries(j(`${run}/manifest.json`).items.map(it => [it.id, it]));
  for (const r of j(`${run}/stage3-rulings.json`).rulings)
    cells.push({
      stage: 3,
      n: r.n,
      id: r.id,
      plate: m[r.id].plate,
      eyes: r.owner.noEyes ? 'no' : r.owner.accepts === true ? 'yes' : 'unknown',
      owner: r.owner.head,
    });
}
console.log(
  `${cells.length} plates; labelled no ${cells.filter(c => c.eyes === 'no').length}, yes ${cells.filter(c => c.eyes === 'yes').length}, unknown ${cells.filter(c => c.eyes === 'unknown').length}`
);

const EYES_RULE =
  'EYES when two open eyes are visible with their whites or irises showing under the brow; ' +
  'NO-EYES when the eyes are shut, hidden under the brow, the hair, a hood or a helmet, turned ' +
  'so far down that only the lids show, or reduced to dark lines; NO-FACE when no face is ' +
  'visible at all (a lying figure seen from behind, a helmet with no visor, the face turned away).';
const E1_PROMPT = HEAD_PROMPT.replace(
  /One word\.$/,
  "Then, separately, say whether both of the figure's eyes read: " +
    EYES_RULE +
    ' Answer with exactly two words: the tilt word, then the eyes word.'
);
if (E1_PROMPT === HEAD_PROMPT) throw new Error('E1 replace failed');
const E2_PROMPT =
  'This is a virtual tabletop token: one figure on a flat coloured plate, seen from directly ' +
  "above. Look only at the figure's face and say whether both of its eyes read. " +
  EYES_RULE +
  ' Judge nothing else: not the angle of the head, the kit, the art or the pose. One word.';

const parseEyes = text => {
  const t = text.toLowerCase().replace(/[_\s]+/g, '-');
  if (/no-face/.test(t)) return 'no-face';
  if (/no-eyes/.test(t)) return 'no';
  if (/\beyes\b/.test(t)) return 'yes';
  return 'unclear';
};
const img = f => ({ data: fs.readFileSync(f), mimeType: 'image/png' });
const exemplars = loadExemplars();

async function pool(items, n, fn) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        await fn(items[k], k);
      }
    })
  );
}

const forms = {
  'E1 two words in the tilt call': async c => {
    const text = await gemini.judge({ prompt: E1_PROMPT, images: [...exemplars, img(c.plate)] });
    const tilt = parseVerdict(text);
    return {
      tilt,
      eyes: parseEyes(text.replace(/^\s*[a-z-]+/i, '')),
      raw: text.trim().slice(0, 40),
    };
  },
  'E2 eyes-only call': async c => {
    const text = await gemini.judge({ prompt: E2_PROMPT, images: [img(c.plate)] });
    return { eyes: parseEyes(text), raw: text.trim().slice(0, 40) };
  },
};

const results = {};
for (const [name, ask] of Object.entries(forms)) {
  const answers = cells.map(() => []);
  for (let p = 0; p < 2; p++) await pool(cells, 4, async (c, k) => answers[k].push(await ask(c)));
  const rows = cells.map((c, k) => {
    const e = answers[k].map(a => a.eyes);
    const no = e.filter(x => x === 'no').length;
    return {
      ...c,
      answers: answers[k],
      eyesMajority:
        no >= 1 && e.every(x => x === 'no')
          ? 'no'
          : no === 0
            ? e.every(x => x === 'yes')
              ? 'yes'
              : 'mixed'
            : 'split',
      stable: new Set(e).size === 1,
    };
  });
  const scored = rows.filter(r => r.eyes !== 'unknown');
  const caught = scored.filter(r => r.eyes === 'no' && r.answers.every(a => a.eyes === 'no'));
  const caughtOnce = scored.filter(r => r.eyes === 'no' && r.answers.some(a => a.eyes === 'no'));
  const falseNo = scored.filter(r => r.eyes === 'yes' && r.answers.some(a => a.eyes === 'no'));
  const falseNoBoth = scored.filter(r => r.eyes === 'yes' && r.answers.every(a => a.eyes === 'no'));
  const s1no = rows.filter(r => r.stage === 1 && r.answers.every(a => a.eyes === 'no')).length;
  results[name] = {
    labelledNo: scored.filter(r => r.eyes === 'no').length,
    labelledYes: scored.filter(r => r.eyes === 'yes').length,
    caughtBothPasses: caught.length,
    caughtEitherPass: caughtOnce.length,
    falseNoEitherPass: falseNo.length,
    falseNoBothPasses: falseNoBoth.length,
    unstable: rows.filter(r => !r.stable).length,
    stage1SaidNoBothPasses: s1no,
    rows,
  };
  console.log(
    `\n${name}: of ${results[name].labelledNo} no-eyes cells caught ${caught.length} both passes (${caughtOnce.length} at least once); of ${results[name].labelledYes} accepted heads said NO-EYES on ${falseNo.length} (${falseNoBoth.length} both passes); unstable ${results[name].unstable}/${rows.length}; stage 1 originals it would send back: ${s1no}/19`
  );
  for (const r of rows) {
    const mark =
      r.eyes === 'unknown'
        ? '~'
        : r.eyes === 'no'
          ? r.answers.every(a => a.eyes === 'no')
            ? ' '
            : 'X'
          : r.answers.some(a => a.eyes === 'no')
            ? 'X'
            : ' ';
    console.log(
      `  ${mark} s${r.stage}#${String(r.n).padStart(2)} ${r.id.padEnd(16)} owner ${String(r.eyes).padEnd(8)} said ${r.answers
        .map(a => (a.tilt ? `${a.tilt}/` : '') + a.eyes)
        .join('  ')
        .padEnd(34)} ${r.owner}`
    );
  }
}
const calls = cells.length * 2 * 2;
console.log(`\n${calls} check calls, about $${(calls * 0.002).toFixed(2)}`);
fs.writeFileSync(
  path.join(outDir, 'eyes-gate.json'),
  JSON.stringify({ made: new Date().toISOString(), E1_PROMPT, E2_PROMPT, results }, null, 2)
);
fs.writeFileSync(
  path.join(outDir, 'eyes-prompts.json'),
  JSON.stringify({ EYES_RULE, E1_PROMPT, E2_PROMPT }, null, 2)
);
