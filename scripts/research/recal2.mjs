// Stability: V0 (current exemplars) and V1 (today's crops) twice more over the 27 ruled cells,
// so each cell has three words per variant and the majority can be scored.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const repo = 'D:/Workbench/FVTT/Repos/fvtt-suite-openroll5e/fvtt-mcp-imagegen';
const out = 'D:/Workbench/LOCAL/artificer-output/headtest/recalibration-2026-10-17';
const load = f => import(pathToFileURL(path.join(repo, 'dist', f)).href);
const { config } = await load('config.js');
const { Gemini } = await load('gemini.js');
const { HEAD_PROMPT, parseVerdict, inBand } = await load('head.js');
const { loadExemplars } = await load('heads.js');
const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });

const prev = JSON.parse(fs.readFileSync(path.join(out, 'recalibration.json'), 'utf8'));
const cells = prev.head['V0 current'].rows.map(r => ({
  stage: r.stage,
  n: r.n,
  id: r.id,
  plate: r.plate,
  accepts: r.accepts,
  owner: r.owner,
  isExemplar: r.isExemplar,
}));
const PROMPT5 = fs.readFileSync(path.join(out, 'prompt5.txt'), 'utf8');
const img = f => ({ data: fs.readFileSync(f), mimeType: 'image/png' });
const ex = g => img(path.join(out, 'exemplars', `${g}-crop.png`));
const variants = {
  'V0 current': { prompt: HEAD_PROMPT, exemplars: loadExemplars() },
  'V1 today crops': {
    prompt: PROMPT5,
    exemplars: [
      ex('far-down'),
      ex('down'),
      ex('right'),
      ex('up'),
      img(path.join(repo, 'mannequins', 'heads', 'band', 'wrong-12-cecil-combat.png')),
    ],
  },
};

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

const passes = {};
for (const [name, v] of Object.entries(variants)) {
  const first = prev.head[name].rows.map(r => r.verdict);
  const words = cells.map((_, k) => [first[k]]);
  for (let p = 0; p < 2; p++) {
    await pool(cells, 4, async (c, k) => {
      const text = await gemini.judge({ prompt: v.prompt, images: [...v.exemplars, img(c.plate)] });
      words[k].push(parseVerdict(text));
    });
  }
  const rows = cells.map((c, k) => {
    const w = words[k];
    const counts = {};
    for (const x of w) counts[x] = (counts[x] ?? 0) + 1;
    const majority = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    const inBandVotes = w.filter(inBand).length;
    return {
      ...c,
      words: w,
      majority,
      stable: new Set(w).size === 1,
      majorityAccepts: inBandVotes >= 2,
    };
  });
  const scored = rows.filter(r => r.accepts !== null && !(name !== 'V0 current' && r.isExemplar));
  const agree = scored.filter(r => r.majorityAccepts === r.accepts);
  const missed = scored.filter(r => r.accepts === false && r.majorityAccepts);
  const falseRej = scored.filter(r => r.accepts === true && !r.majorityAccepts);
  const unstable = rows.filter(r => !r.stable);
  passes[name] = {
    scored: scored.length,
    agreeByMajority: agree.length,
    missedRejections: missed.map(r => `s${r.stage}#${r.n} ${r.id} ${r.words.join('/')}`),
    falseRejections: falseRej.map(r => `s${r.stage}#${r.n} ${r.id} ${r.words.join('/')}`),
    unstable: unstable.map(
      r => `s${r.stage}#${r.n} ${r.id} ${r.words.join('/')} (owner ${r.owner})`
    ),
    rows,
  };
  console.log(
    `\n${name}: majority agrees ${agree.length}/${scored.length}; missed rejections ${missed.length}; false rejections ${falseRej.length}; unstable cells ${unstable.length}/${rows.length}`
  );
  for (const r of rows) {
    const mark = r.accepts === null ? '~' : r.majorityAccepts === r.accepts ? ' ' : 'X';
    console.log(
      `  ${mark} s${r.stage}#${String(r.n).padStart(2)} ${r.id.padEnd(16)} ${r.words.map(x => x.padEnd(9)).join(' ')} owner: ${r.owner}${r.isExemplar ? ' (exemplar)' : ''}`
    );
  }
}
console.log(
  `\n${2 * 2 * cells.length} check calls, about $${(2 * 2 * cells.length * 0.002).toFixed(2)}`
);
fs.writeFileSync(
  path.join(out, 'recalibration-repeat.json'),
  JSON.stringify({ made: new Date().toISOString(), passes }, null, 2)
);
