// The mannequin library: HeroForge captures that fvtt-mcp-imagegen's edit-image turns into
// humanoid tokens (its notes/mannequin-tokens/PLAN.md holds the rules). This script checks an
// export against the capture rules before any credit is spent, and files it under its name.
//
//   node scripts/mannequin.mjs check [file ...]        default: ~/Downloads/*-Portrait*.png (HeroForge exports)
//   node scripts/mannequin.mjs take <file> <body> <sex> <pose> [setup] [--force]
//   node scripts/mannequin.mjs list
//   node scripts/mannequin.mjs takeset "<model>" <pose> <setup>   all 12 in the fixed order
//   node scripts/mannequin.mjs grid       setup x body from the files; ❌ where a body or sex is missing
import { copyFileSync, existsSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, join } from 'node:path';
import sharp from 'sharp';

const root = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const libDir = join(root, 'mannequins');

/** The imagegen edge check reads the plate's outer 3 px; anything of the subject there is a clip. */
const CLIP_BAND = 3;
/** Under this many clear pixels the model has no room: a spear 9 px from the edge rendered, but barely. */
const TIGHT = 24;
const SIZE = 1024;

const bodies = ['human', 'dwarf', 'small', 'large', 'orc', 'elf'];
const sexes = ['male', 'female'];
const poses = ['combat', 'stand', 'dead', 'prone', 'twohand', 'cast'];

async function inspect(file) {
  const img = sharp(file);
  const m = await img.metadata();
  const r = { file, width: m.width, height: m.height, alpha: m.hasAlpha, problems: [], notes: [] };
  if (m.width !== SIZE || m.height !== SIZE)
    r.problems.push(`${m.width}x${m.height}, not ${SIZE} square`);
  if (!m.hasAlpha) {
    r.problems.push('no alpha channel: export with transparency');
    return r;
  }
  const { data, info } = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels } = info;
  let top = h,
    bottom = -1,
    left = w,
    right = -1,
    count = 0;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * channels + 3] > 8) {
        count++;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  if (count === 0) {
    r.problems.push('empty: nothing opaque');
    return r;
  }
  r.box = { left, top, right, bottom };
  r.margins = { left, top, right: w - 1 - right, bottom: h - 1 - bottom };
  for (const [side, px] of Object.entries(r.margins)) {
    if (px < CLIP_BAND) r.problems.push(`clips the ${side} edge (${px} px clear)`);
    else if (px < TIGHT)
      r.notes.push(`tight on the ${side} (${px} px clear; ${TIGHT}+ is comfortable)`);
  }
  r.fill = Math.round((((right - left + 1) * (bottom - top + 1)) / (w * h)) * 100);
  if (r.fill < 10)
    r.notes.push(`subject fills ${r.fill}% of the frame: check the camera did not zoom out`);
  return r;
}

function report(r) {
  const verdict = r.problems.length ? '❌ FAIL' : r.notes.length ? 'ok  ' : 'OK  ';
  const m = r.margins
    ? `margins L${r.margins.left} T${r.margins.top} R${r.margins.right} B${r.margins.bottom}`
    : '';
  console.log(
    `${verdict} ${basename(r.file)}  ${r.width}x${r.height}${r.alpha ? ' alpha' : ''}  ${m}${r.fill ? `  fill ${r.fill}%` : ''}`
  );
  for (const p of r.problems) console.log(`       x ${p}`);
  for (const n of r.notes) console.log(`       - ${n}`);
}

const defaults = () => {
  const d = join(homedir(), 'Downloads');
  return readdirSync(d)
    .filter(f => /-Portrait( \(\d+\))?\.png$/i.test(f))
    .map(f => join(d, f))
    .sort((a, b) => statSync(a).mtimeMs - statSync(b).mtimeMs);
};

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'check' || cmd === undefined) {
  const files = args.length ? args : defaults();
  if (!files.length) {
    console.log('Nothing to check: no files given and no HeroForge *-Portrait*.png in Downloads.');
    process.exit(1);
  }
  let bad = 0;
  for (const f of files) {
    const r = await inspect(f);
    report(r);
    if (r.problems.length) bad++;
  }
  process.exit(bad ? 1 : 0);
} else if (cmd === 'take') {
  const force = args.includes('--force');
  const [file, body, sex, pose, setup] = args.filter(a => a !== '--force');
  if (!file || !body || !sex || !pose) {
    console.log('take <file> <body> <sex> <pose> [setup] [--force]');
    process.exit(2);
  }
  if (!bodies.includes(body)) {
    console.log(`body must be one of ${bodies.join(', ')}`);
    process.exit(2);
  }
  if (!sexes.includes(sex)) {
    console.log(`sex must be one of ${sexes.join(', ')}`);
    process.exit(2);
  }
  if (!poses.includes(pose)) {
    console.log(`pose must be one of ${poses.join(', ')}`);
    process.exit(2);
  }
  const r = await inspect(file);
  report(r);
  if (r.problems.length && !force) {
    console.log('❌ Not taken: fix the capture, or --force to keep it anyway.');
    process.exit(1);
  }
  const name = `mannequin-${[body, sex, pose, setup].filter(Boolean).join('-')}.png`;
  const dest = join(libDir, name);
  if (existsSync(dest) && !force) {
    console.log(`❌ Not taken: ${name} exists (--force replaces it).`);
    process.exit(1);
  }
  copyFileSync(file, dest); // Downloads and the repo may sit on different drives: no rename
  unlinkSync(file);
  console.log(`Taken: mannequins/${name}`);
} else if (cmd === 'list') {
  const files = existsSync(libDir)
    ? readdirSync(libDir)
        .filter(f => f.endsWith('.png'))
        .sort()
    : [];
  if (!files.length) console.log('The library is empty.');
  for (const f of files) report(await inspect(join(libDir, f)));
} else if (cmd === 'takeset') {
  // takeset "<HeroForge model name>" <pose> <setup>: files all 12 exports of one model in the fixed
  // order (human, large, small, dwarf, orc, elf; male then female), sorted by HeroForge's export
  // number, which can skip (8-11 once came out as 12-15). Refuses unless exactly 12 are present.
  const [model, pose, setup] = args;
  if (!model || !pose) {
    console.log('takeset "<model name>" <pose> [setup]');
    process.exit(2);
  }
  const d = join(homedir(), 'Downloads');
  const num = f => Number(f.match(/\((\d+)\)\.png$/i)?.[1] ?? 0);
  const files = readdirSync(d)
    .filter(f => f.startsWith(`${model}-Portrait`) && /\.png$/i.test(f))
    .sort((a, b) => num(a) - num(b));
  if (files.length !== 12) {
    console.log(`❌ ${files.length} exports of "${model}", not 12. Nothing taken.`);
    process.exit(1);
  }
  const order = ['human', 'large', 'small', 'dwarf', 'orc', 'elf'].flatMap(b =>
    sexes.map(x => [b, x])
  );
  const results = await Promise.all(files.map(f => inspect(join(d, f))));
  const bad = results.filter(r => r.problems.length);
  for (const r of results) report(r);
  if (bad.length) {
    console.log(`❌ ${bad.length} failed the check. Nothing taken.`);
    process.exit(1);
  }
  for (const [i, f] of files.entries()) {
    const [b, x] = order[i];
    const name = `mannequin-${[b, x, pose, setup].filter(Boolean).join('-')}.png`;
    const dest = join(libDir, name);
    if (existsSync(dest)) {
      console.log(`❌ ${name} exists; skipped ${f}`);
      continue;
    }
    copyFileSync(join(d, f), dest);
    unlinkSync(join(d, f));
    console.log(`Taken: ${f} -> mannequins/${name}`);
  }
} else if (cmd === 'grid') {
  const files = existsSync(libDir) ? readdirSync(libDir).filter(f => f.endsWith('.png')) : [];
  const have = new Set(files);
  const setups = new Map();
  for (const f of files) {
    const m = f.match(/^mannequin-([a-z]+)-(male|female)-(.+)\.png$/);
    if (!m) {
      console.log(`❌ unrecognised name: ${f}`);
      continue;
    }
    setups.set(m[3], true);
  }
  let misses = 0;
  console.log(`| Setup | ${bodies.join(' | ')} |`);
  console.log(`| --- |${' --- |'.repeat(bodies.length)}`);
  for (const setup of [...setups.keys()].sort()) {
    const cells = bodies.map(b => {
      const gone = sexes.filter(x => !have.has(`mannequin-${b}-${x}-${setup}.png`));
      if (!gone.length) return '✓';
      misses++;
      return `❌ no ${gone.join(', ')}`;
    });
    console.log(`| \`${setup}\` | ${cells.join(' | ')} |`);
  }
  console.log(misses ? `\n❌ ${misses} missing cell(s)` : '\nNo misses.');
  process.exit(misses ? 1 : 0);
} else {
  console.log(
    'commands: check [file ...] | take <file> <body> <sex> <pose> [setup] [--force] | takeset ' <
      model >
      ' <pose> <setup> | list | grid'
  );
  process.exit(2);
}
