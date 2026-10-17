// Green eyes scripted onto the library (the owner, 2026-10-17, evening): thirty captures across
// bodies, sexes, poses and weapons get the two green marks the owner painted on the 90-degree
// capture, then render words-only with bust-2, checks report-only.
//
//   node scripts/research/greenlib.mjs mark            the check model finds each capture's eye
//                                                      sockets (a fifth of a cent each), the green
//                                                      is drawn, a review sheet of the heads is written
//   node scripts/research/greenlib.mjs render [--yes]  the thirty renders, each copied to the Desktop
//                                                      folder as it lands
//
// Overrides for a missed placement go in `overrides.json` beside the captures: { "<id>": { "left":
// [cx, cy], "right": [cx, cy] } } in capture pixels. Paths: `DESK` overrides the Desktop folder.
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'dist');
const load = file => import(pathToFileURL(path.join(dist, file)).href);
const { config } = await load('config.js');
const { Gemini } = await load('gemini.js');
const { SpendMeter } = await load('spend.js');
const { makeCutout } = await load('cutout.js');
const { buildToolRegistry } = await load('registry.js');

const phase = process.argv[2];
const args = process.argv.slice(3);
const yes = args.includes('--yes');
const DESK = process.env.DESK ?? 'C:/Users/sippelmc/Desktop/EyeColorTests/07-library-green';
const CAPS = path.join(DESK, 'captures');
const GREEN = { r: 190, g: 240, b: 48 };

// Twelve bodies, twenty-four standing setups, thirty picks cycling both.
const BODIES = ['human-male', 'human-female', 'dwarf-male', 'dwarf-female', 'small-male', 'small-female', 'large-male', 'large-female', 'orc-male', 'orc-female', 'elf-male', 'elf-female'];
const SETUPS = ['stand-empty', 'combat-sword-shield', 'twohand-staff-level', 'stand-bow', 'combat-longsword-open', 'combat-twodaggers', 'twohand-right', 'stand-dagger-shield', 'combat-spear-shield', 'combat-crossbow-hip', 'stand-open', 'combat-dagger-shield', 'twohand-staff-brace', 'combat-sword-open', 'stand-shortbow-draw', 'combat-empty', 'twohand-left', 'combat-longsword-kite', 'stand-dagger-open', 'combat-bow', 'twohand-staff-diagonal', 'combat-sword-dagger', 'stand-bow-draw', 'combat-crossbow-down'];

const LOOK = {
  'human-male': 'a human man of thirty-five, weathered tan skin, short dark hair, a trimmed beard, brown eyes, in a quilted ochre gambeson over a mail shirt, a sword belt, brown leather boots',
  'human-female': 'a human woman of thirty, fair skin with a scar on one cheek, red hair in a tight braid, grey eyes, in a steel breastplate over a blue gambeson, mail sleeves, tall riding boots',
  'dwarf-male': 'a dwarf man of ninety, short and very broad, ruddy skin, a thick red beard in two braids with bronze clasps, dark brown eyes, in blackened chain mail under a hide jerkin, heavy iron-shod boots',
  'dwarf-female': 'a dwarf woman of seventy, short and sturdy, pale freckled skin, ash-blonde hair in a crown of braids, grey-blue eyes, in an iron-studded leather jerkin over a rust-brown wool dress, sturdy boots',
  'small-male': 'a halfling man of thirty-five, small and round-cheeked, tan skin, curly chestnut hair, warm brown eyes, in a green wool waistcoat over a cream shirt, brown breeches, bare broad feet',
  'small-female': 'a gnome woman of forty, small and quick, warm brown skin, dark curly hair pinned up, hazel eyes, in a long purple wool coat with many pockets over a cream blouse, small laced boots',
  'large-male': 'a goliath man of thirty, huge and heavily muscled, grey stone-coloured skin with darker mottling, a bald head with bone-white tattoo lines, dark eyes, in a harness of thick hide and fur, fur-wrapped boots',
  'large-female': 'a goliath woman of twenty-six, tall and powerfully built, pale grey skin with a faint blue cast, black hair bound in a short tail, ice-blue eyes, in a sleeveless jerkin of layered hide, bracers of bone and leather, hide boots',
  'orc-male': 'an orc man of twenty-eight, heavy and muscled, grey-green skin, a jutting lower jaw with two short tusks, small yellow eyes under a heavy brow, a black topknot, in hide and iron-scale armour over a bare chest, fur-wrapped boots',
  'orc-female': 'an orc woman of thirty, tall and powerfully built, olive-green skin, a strong jaw with two small lower tusks, amber eyes, long black hair in thin braids tied back, in a studded jerkin of boiled leather, leather bracers, heavy boots',
  'elf-male': 'an elf man of one hundred and ten, tall and slender, pale skin, long straight honey-coloured hair, pointed ears, leaf-green eyes, in a fitted coat of mottled green and brown leather over a grey linen shirt, soft tall boots',
  'elf-female': 'an elf woman of ninety, slim and poised, dark brown skin, silver hair cut to the jaw, pointed ears, pale grey eyes, in a long coat of midnight-blue velvet with silver embroidery over black leather, slim black boots',
};
const IRIS = { 'human-male': 'a brown iris', 'human-female': 'a grey iris', 'dwarf-male': 'a dark brown iris', 'dwarf-female': 'a grey-blue iris', 'small-male': 'a warm brown iris', 'small-female': 'a hazel iris', 'large-male': 'a dark iris', 'large-female': 'an ice-blue iris', 'orc-male': 'a yellow iris', 'orc-female': 'an amber iris', 'elf-male': 'a leaf-green iris', 'elf-female': 'a pale grey iris' };
const GEAR = {
  'stand-empty': 'both hands empty at the sides',
  'stand-open': 'both hands open and empty',
  'stand-dagger-open': 'a plain steel dagger in the fist, the other hand open and empty',
  'stand-dagger-shield': 'a plain steel dagger in the fist and a round wooden shield with an iron boss on the forearm',
  'stand-bow': 'a longbow of pale yew in the hand, a quiver of arrows on the back',
  'stand-bow-draw': 'a longbow of pale yew drawn, an arrow nocked, a quiver on the back',
  'stand-shortbow-draw': 'a short horn bow drawn, an arrow nocked, a quiver at the hip',
  'combat-empty': 'both fists empty and raised',
  'combat-sword-open': 'a straight steel sword in the fist, the other hand open',
  'combat-sword-shield': 'a straight steel sword in the fist and a round wooden shield with an iron boss on the forearm',
  'combat-sword-dagger': 'a straight steel sword in one fist and a dagger in the other',
  'combat-longsword-open': 'a long straight steel sword in the fist, the other hand open',
  'combat-longsword-kite': 'a long straight steel sword in the fist and a kite-shaped wooden shield on the forearm',
  'combat-dagger-shield': 'a dagger in the fist and a round wooden shield with an iron boss on the forearm',
  'combat-spear-shield': 'a plain ash spear with a leaf-shaped iron head in the fist and a round wooden shield on the forearm',
  'combat-twodaggers': 'a curved dagger in each fist',
  'combat-bow': 'a longbow of pale yew in the hand, an arrow in the other, a quiver on the back',
  'combat-crossbow-hip': 'a heavy wooden crossbow held at the hip in both hands',
  'combat-crossbow-down': 'a heavy wooden crossbow held low in both hands',
  'twohand-right': 'a long-hafted steel battleaxe held in both fists',
  'twohand-left': 'a heavy steel warhammer held in both fists',
  'twohand-staff-level': 'a gnarled wooden quarterstaff held level in both fists',
  'twohand-staff-diagonal': 'a gnarled wooden quarterstaff held across the body in both fists',
  'twohand-staff-brace': 'a gnarled wooden quarterstaff braced low in both fists',
};

const items = [];
for (let i = 0; i < 30; i++) {
  // Past the first twenty-four the body index shifts by six, so no pairing repeats.
  const body = BODIES[(i < SETUPS.length ? i : i + 6) % BODIES.length];
  const setup = SETUPS[i % SETUPS.length];
  const id = `${body}-${setup}`;
  const female = body.endsWith('female');
  const pro = female ? 'her' : 'his';
  const obj = female ? 'her' : 'him';
  items.push({
    n: i + 1,
    id,
    body,
    setup,
    source: path.join(root, 'mannequins', `mannequin-${id}.png`),
    green: path.join(CAPS, `${String(i + 1).padStart(2, '0')}-${id}.png`),
    instruction:
      `Paint it as ${LOOK[body]}, ${GEAR[setup]}. The mannequin's two bright green eyes are ${pro} eyes: paint them exactly where the green is, at the same size, the same slant and the same spacing, both open with the white and ${IRIS[body]} showing beneath the brow, and leave no green marker. ` +
      'Semi-realistic fantasy character art in the style of modern Dungeons and Dragons sourcebook illustration and premium token packs, realistic proportions, smooth blended shading with crisp edges and fine detail on the face, hands, leather, steel and cloth, warm golden light falling across ' +
      `${obj} from out of frame on the left as the warm key light with a soft cool rim light on the far edges and a gentle fill so the whole figure reads, soft coloured shadows, rich natural colour with warm earth tones and one glowing accent, heroic and epic in bearing; nothing touches or crosses the face; nothing left grey clay.`,
    ...(body.startsWith('large') ? { creatureSize: 'large' } : {}),
  });
}

async function figureBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minx = 1e9, maxx = 0, miny = 1e9, maxy = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 20) { if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
  return { minx, miny, maxx, maxy, w: info.width, h: info.height };
}

const SOCKET_PROMPT =
  'This is a grey clay mannequin figure seen from above. Find its two eye sockets, the two small ' +
  'dark hollows under the brow ridge on either side of the top of the nose. Answer with JSON only, ' +
  'no prose: {"left": [ymin, xmin, ymax, xmax], "right": [ymin, xmin, ymax, xmax]} with each box ' +
  'normalized to 0..1000 on this image, "left" the socket nearer the left edge of the image. If ' +
  'the sockets cannot be seen, answer {"left": null, "right": null}.';

if (phase === 'mark') {
  fs.mkdirSync(CAPS, { recursive: true });
  const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });
  const overridesPath = path.join(CAPS, 'overrides.json');
  const overrides = fs.existsSync(overridesPath) ? JSON.parse(fs.readFileSync(overridesPath, 'utf8')) : {};
  const placements = {};
  const cells = [];
  for (const it of items) {
    const box = await figureBox(it.source);
    // The figure, with a margin, upscaled to 1024 on its long side, so the sockets are not slivers.
    const m = 24;
    const left = Math.max(0, box.minx - m), top = Math.max(0, box.miny - m);
    const width = Math.min(box.w - left, box.maxx - box.minx + 2 * m), height = Math.min(box.h - top, box.maxy - box.miny + 2 * m);
    const scale = 1024 / Math.max(width, height);
    const crop = await sharp(it.source).extract({ left, top, width, height }).resize(Math.round(width * scale), Math.round(height * scale)).flatten({ background: '#ffffff' }).png().toBuffer();
    let eyes = overrides[it.id] ?? null;
    let fromModel = null;
    if (!eyes) {
      try {
        const text = await gemini.judge({ prompt: SOCKET_PROMPT, images: [{ data: crop, mimeType: 'image/png' }] });
        const json = JSON.parse(text.replace(/```json|```/g, '').trim());
        if (json.left && json.right) {
          const cw = Math.round(width * scale), ch = Math.round(height * scale);
          const toCap = ([ymin, xmin, ymax, xmax]) => ({ cx: left + ((xmin + xmax) / 2 / 1000) * cw / scale, cy: top + ((ymin + ymax) / 2 / 1000) * ch / scale, w: ((xmax - xmin) / 1000) * cw / scale, h: ((ymax - ymin) / 1000) * ch / scale });
          fromModel = { left: toCap(json.left), right: toCap(json.right) };
          eyes = { left: [fromModel.left.cx, fromModel.left.cy], right: [fromModel.right.cx, fromModel.right.cy] };
        }
      } catch (e) {
        console.log(`${it.id}: socket call failed: ${String(e.message ?? e).slice(0, 80)}`);
      }
    }
    placements[it.id] = { eyes, fromModel, source: overrides[it.id] ? 'override' : eyes ? 'model' : 'none' };
    // Draw: a lens-shaped sliver per eye, sized to the figure (the owner's marks were about 3.5%
    // of the figure height wide and 40% as tall as wide), the owner's green.
    const fh = box.maxy - box.miny;
    const ew = Math.max(8, Math.round(fh * 0.038)), eh = Math.max(3, Math.round(ew * 0.42));
    let svg = '';
    if (eyes) for (const k of ['left', 'right']) {
      const [cx, cy] = eyes[k];
      svg += `<ellipse cx="${cx}" cy="${cy}" rx="${ew / 2}" ry="${eh / 2}" fill="rgb(${GREEN.r},${GREEN.g},${GREEN.b})"/>`;
    }
    const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${box.w}" height="${box.h}">${svg}</svg>`);
    await sharp(it.source).composite([{ input: overlay, left: 0, top: 0 }]).png().toFile(it.green);
    // The review cell: the head region around the marks (or the figure's top) at 3x.
    const cxy = eyes ? [(eyes.left[0] + eyes.right[0]) / 2, (eyes.left[1] + eyes.right[1]) / 2] : [(box.minx + box.maxx) / 2, box.miny + fh * 0.2];
    const r = Math.round(fh * 0.22);
    const cl = Math.max(0, Math.round(cxy[0] - r)), ct = Math.max(0, Math.round(cxy[1] - r));
    const cell = await sharp(it.green).extract({ left: cl, top: ct, width: Math.min(2 * r, box.w - cl), height: Math.min(2 * r, box.h - ct) }).resize(300, 300, { fit: 'contain', background: '#ffffff' }).flatten({ background: '#ffffff' }).png().toBuffer();
    cells.push({ id: `${it.n} ${it.id}`, cell, src: placements[it.id].source });
    console.log(`${String(it.n).padStart(2)} ${it.id.padEnd(40)} ${placements[it.id].source}${eyes ? ` L ${eyes.left.map(Math.round)} R ${eyes.right.map(Math.round)}` : ''}`);
  }
  fs.writeFileSync(path.join(CAPS, 'placements.json'), JSON.stringify(placements, null, 2));
  const label = (t, w) => Buffer.from(`<svg width="${w}" height="26"><rect width="${w}" height="26" fill="#222"/><text x="4" y="18" font-size="12" font-family="sans-serif" fill="#fff">${t}</text></svg>`);
  const per = 6, comps = [];
  cells.forEach((c, i) => comps.push({ input: c.cell, left: (i % per) * 306, top: Math.floor(i / per) * 332 + 26 }, { input: label(`${c.id} · ${c.src}`, 300), left: (i % per) * 306, top: Math.floor(i / per) * 332 }));
  await sharp({ create: { width: 306 * per - 6, height: 332 * Math.ceil(cells.length / per) - 6, channels: 4, background: '#ffffff' } }).composite(comps).png().toFile(path.join(DESK, 'REVIEW-eye-placements.png'));
  console.log(`marked ${items.length}; review ${path.join(DESK, 'REVIEW-eye-placements.png')}`);
  process.exit(0);
}

if (phase === 'render') {
  const missing = items.filter(it => !fs.existsSync(it.green));
  if (missing.length) {
    console.error(`✗ ${missing.length} green captures missing; run \`mark\` first`);
    process.exit(2);
  }
  console.log(`greenlib: ${items.length} renders, words only, bust-2 by the server, checks report-only; about $${(items.length * 0.045).toFixed(2)}`);
  if (!yes) {
    console.log('Add --yes to run.');
    process.exit(0);
  }
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
  const runDir = path.join(config.outputDir, 'headtest', `${stamp}-greenlib`);
  fs.mkdirSync(runDir, { recursive: true });
  fs.mkdirSync(path.join(DESK, 'tokens'), { recursive: true });
  const gemini = new Gemini({ apiKey: config.geminiApiKey, timeoutMs: config.timeoutMs });
  const spend = new SpendMeter();
  const { dispatch } = buildToolRegistry({ gemini, spend, outputDir: runDir, cutout: makeCutout(config.pythonBin) });
  const results = [];
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      const it = items[i];
      try {
        const r = await dispatch('edit-image', {
          sourceImage: it.green,
          instruction: it.instruction,
          kind: 'token',
          source: 'mannequin',
          slug: `greenlib-${it.id}`,
          headRetries: 0,
          ...(it.creatureSize ? { creatureSize: it.creatureSize } : {}),
        });
        const dest = path.join(DESK, 'tokens', `${String(it.n).padStart(2, '0')}-${it.id}.png`);
        fs.copyFileSync(r.file, dest);
        results[i] = { id: it.id, file: r.file, desk: dest, head: r.head, anatomy: r.anatomy, usd: r.estimatedUsd };
        console.log(`${String(it.n).padStart(2)} ${it.id.padEnd(40)} ${r.head?.verdict ?? '?'}·${r.head?.eyes ?? '?'}  ${r.estimatedUsd.toFixed(3)}`);
      } catch (e) {
        results[i] = { id: it.id, error: String(e.message ?? e) };
        console.log(`${String(it.n).padStart(2)} ${it.id.padEnd(40)} ERROR ${String(e.message ?? e).slice(0, 100)}`);
      }
      fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify({ runDir, spendUsd: spend.totalUsd, items: results }, null, 2));
    }
  }
  await Promise.all([worker(), worker(), worker()]);
  console.log(`done: $${spend.totalUsd.toFixed(2)}; run ${runDir}`);
  process.exit(0);
}

console.error('usage: greenlib.mjs mark | render [--yes]');
process.exit(2);
