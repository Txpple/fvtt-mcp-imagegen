// The no-green control (the owner, 2026-10-17, evening): the four PCs, the four Elders and ten
// species of the green-eyed sets on the same capture with the green painted out (grey sockets
// like the library), the same words except that the eyes line names the mannequin's eyes and no
// green, the same bust-2 (attached by the server, or named beside a portrait crop as
// `character`), checks report-only. Separates the green marks from the capture itself. Runs from
// dist/ and copies each token to the owner's Desktop folder as it lands.
//
//   node scripts/research/nogreen.mjs [--yes] [--only id,id]
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const dist = path.join(root, 'dist');
const load = file => import(pathToFileURL(path.join(dist, file)).href);
const { config } = await load('config.js');
const { Gemini } = await load('gemini.js');
const { SpendMeter } = await load('spend.js');
const { makeCutout } = await load('cutout.js');
const { buildToolRegistry } = await load('registry.js');

const args = process.argv.slice(2);
const yes = args.includes('--yes');
const onlyAt = args.indexOf('--only');
const only = onlyAt >= 0 ? (args[onlyAt + 1] ?? '').split(',').filter(Boolean) : [];

const CAPTURE = process.env.CAPTURE ?? 'C:/Users/sippelmc/Desktop/EyeColorTests/Mann 15 Stand 3-Portrait-nogreen.png';
// HEAD_ANCHOR=bust-2-eyes runs the same items with that bust on every call (the owner's eyed-bust test).
const ANCHOR = process.env.HEAD_ANCHOR ?? null;
const DESK = process.env.DESK ?? (ANCHOR ? `C:/Users/sippelmc/Desktop/EyeColorTests/09-eyed-bust-${ANCHOR}` : 'C:/Users/sippelmc/Desktop/EyeColorTests/06-no-green-control');
const CAMPAIGN = path.resolve(root, '..', '..', 'fvtt-campaign-echoesofhalruaa', 'art', 'headtest');
const ELDER_CROPS = process.env.ELDER_CROPS ?? path.join(DESK, '..', '02-the-elders', 'portrait-crops-attached');

// The eyes line of the green set, with the green gone: the same ask, at the mannequin's eyes.
// EYES_LINE=green uses the green set's wording (the marks named) for a run on a green-eyed capture.
const EYES = (pro, iris) =>
  process.env.EYES_LINE === 'green'
    ? `The mannequin's two bright green eyes are ${pro} eyes: paint them exactly where the green is, at ` +
      'the same size, the same slant and the same spacing, both open with the white and ' +
      `${iris} showing beneath the brow, and leave no green marker.`
    : `The mannequin's two eyes are ${pro} eyes: paint them exactly where the mannequin's eyes are, at ` +
      'the same size, the same slant and the same spacing, both open with the white and ' +
      `${iris} showing beneath the brow.`;
const FINISH = (pronoun, accent = 'one glowing accent') =>
  'Semi-realistic fantasy character art in the style of modern Dungeons and Dragons sourcebook ' +
  'illustration and premium token packs, realistic proportions, smooth blended shading with ' +
  'crisp edges and fine detail on the face, hands, leather, steel and cloth, warm golden light ' +
  `falling across ${pronoun} from out of frame on the left as the warm key light with a soft cool ` +
  'rim light on the far edges and a gentle fill so the whole figure reads, soft coloured ' +
  `shadows, rich natural colour with warm earth tones and ${accent}, heroic and epic in bearing; ` +
  'nothing touches or crosses the face; nothing left grey clay.';
const HEARTH = (pronoun, accent = 'one glowing accent') =>
  'Semi-realistic fantasy character art in the style of modern Dungeons and Dragons sourcebook ' +
  'illustration and premium token packs, realistic proportions, smooth blended shading with ' +
  'crisp edges and fine detail on the face, hands, leather, steel and cloth, warm ember-golden ' +
  `light falling across ${pronoun} from out of frame on the left as the warm key light with a soft ` +
  'cool blue-green rim light on the far edges and a gentle fill so the whole figure reads, soft ' +
  "coloured shadows, rich natural colour with the Hearth's ember-warm and blue-green fungus " +
  `tones and ${accent}, heroic and epic in bearing; nothing touches or crosses the face; nothing ` +
  'left grey clay.';

const ITEMS = [
  // The four PCs, the campaign's way: the portrait's head-to-waist crop as character beside bust-2.
  {
    id: 'tychon',
    crop: path.join(CAMPAIGN, 'outfit-tychon-tessarin.png'),
    label: 'Tychon',
    instruction:
      'Paint it as Tychon (Image 2), a lean young man of twenty with short tousled black hair and ' +
      'dark eyes, in his patched blue wool robe, a leather satchel on a strap across his chest, ' +
      `soft leather boots; his hands are empty. ${EYES('his', 'a dark iris')} ${FINISH('him')}`,
  },
  {
    id: 'cecil',
    crop: path.join(CAMPAIGN, 'outfit-cecil-edmunds.png'),
    label: 'Cecil',
    instruction:
      'Paint it as Cecil (Image 2), a clean-shaven young man of twenty, tall, fair-skinned, with ' +
      'wavy light brown hair to his jaw and green eyes, in a green wool scarf, a worn brown ' +
      'leather vest over a patched wine-red shirt, a small silver tuning-pipe on a leather cord ' +
      'at his throat, brown leather boots, his lute slung across his back on a strap; his hands ' +
      `are empty. ${EYES('his', 'a green iris')} ${FINISH('him')}`,
  },
  {
    id: 'kartor',
    crop: path.join(CAMPAIGN, 'outfit-kartor-bloodaxe.png'),
    label: 'Kartor',
    instruction:
      'Paint it as Kartor (Image 2), a dwarf of forty-nine, short and broad, strikingly ' +
      'clean-shaven with no beard and no moustache at all, black hair swept back, round dwarf ' +
      'ears, tan skin, green eyes, in his worn steel plate with a soft dull sheen over chain ' +
      'mail, brown leather gloves, heavy boots; a plain battleaxe, a worn wooden haft and a ' +
      'single broad steel bearded blade, held upright in the hand at the lower right, and a ' +
      'round wooden plank shield with a riveted iron rim and a domed steel boss strapped to the ' +
      `other forearm. ${EYES('his', 'a clear deep green iris')} ${FINISH('him')}`,
  },
  {
    id: 'lysandra',
    crop: path.join(CAMPAIGN, 'outfit-lysandra-vane.png'),
    label: 'Lysandra',
    instruction:
      'Paint it as Lysandra (Image 2), a tiefling woman of thirty, slender and wiry, deep ' +
      'brick-red skin, flat gold eyes, black hair cropped at the sides and pulled back, exactly ' +
      'two long dark ridged horns curving up and back, a matched pair, and ONE thin red tail ' +
      'curving out behind to the upper left only, in her worn black leather armour and black ' +
      'hooded cloak, the hood thrown back off her head, tall black boots; her plain old ' +
      'longsword, a straight steel blade with faint violet runes along it and a wire-wrapped ' +
      'grip, held in the hand at the lower right, and a ball of violet flame in the open hand at ' +
      `the lower left, the key light. ${EYES('her', 'a flat gold iris')} ${FINISH('her', 'the flame as the one glowing accent')}`,
  },
  // The four Elders, the same way, with the Hearth's lights.
  {
    id: 'ansel-lowmarrow',
    crop: path.join(ELDER_CROPS, 'crop-ansel-lowmarrow.png'),
    label: 'Ansel',
    instruction:
      'Paint it as Ansel Lowmarrow (Image 2), an old halfling man, small and slight, pale lined ' +
      'skin, white curly hair thinning at the crown under a flat cap of felted Archivist-grey ' +
      'goat-wool, enormous soft-lobed ears, round brass spectacles, dark brown eyes, in an old ' +
      "Halruaan wizard's robe faded to the colour of dried blood with a high stiff collar and " +
      'bands of tarnished silver-gold sigils and stars down the front and cuffs, the hem torn to ' +
      'rags and the elbows patched with plain cloth, a brown leather satchel on a cross-strap, ' +
      'his broad feet bare in the halfling way; an open leather ledger with brass corners held ' +
      'in the hand at the lower right, the fingers curled over its edge, the other hand open. ' +
      `${EYES('his', 'a dark brown iris')} ${HEARTH('him')}`,
  },
  {
    id: 'tobin-hale',
    crop: path.join(ELDER_CROPS, 'crop-tobin-hale.png'),
    label: 'Tobin',
    instruction:
      'Paint it as Tobin Hale (Image 2), an old human man, big-framed and heavy-shouldered, ' +
      'weathered pale skin lined and scarred, thick white hair cut short in uneven terraces, ' +
      'clean-shaven, muddy green eyes, enormous swollen-knuckled hands, in a wool shirt gone ' +
      'colourless with the sleeves rolled to the elbow under a scuffed dark brown leather ' +
      "Delver's apron, his Delver's stone, a shard of clouded ward-glass, on a black cord at his " +
      'throat, dark wool trousers, heavy worn boots; both hands loose and empty at his sides. ' +
      `${EYES('his', 'a muddy green iris')} ${HEARTH('him')}`,
  },
  {
    id: 'brom-korrin',
    crop: path.join(ELDER_CROPS, 'crop-brom-korrin.png'),
    label: 'Brom',
    instruction:
      'Paint it as Brom Korrin (Image 2), an old dwarf man, short and broad, dark brown skin, ' +
      'bald on top with a close fringe of white hair, heavy white brows, pale grey eyes, a long ' +
      'white beard in three braids bound with silver rings, in a heavy dark brown leather coat ' +
      'with flap pockets and a pale worn lining showing at the collar over a brown tunic, a wide ' +
      'leather belt with a steel buckle, dark trousers, heavy boots; a stick of chalk glowing ' +
      'faint blue in the hand at the lower right, the other hand open and empty. ' +
      `${EYES('his', 'a pale grey iris')} ${HEARTH('him', "the chalk's faint blue glow as the one glowing accent")}`,
  },
  {
    id: 'cassia-vell',
    crop: path.join(ELDER_CROPS, 'crop-cassia-vell.png'),
    label: 'Cassia',
    instruction:
      'Paint it as Cassia Vell (Image 2), a lean wiry woman of fifty, tan weathered skin with ' +
      'freckles and old pale scars on her neck and arms, grey hair shaved close at the sides and ' +
      'pulled back into one long braid wrapped in leather, grey-green eyes, in a sleeveless worn ' +
      'brown leather vest laced up the front over a torn cream undershirt, a plain leather belt, ' +
      'dark trousers, worn brown boots; her straight horn-handled skinning knife held in the ' +
      'hand at the lower right, the other hand open and empty. ' +
      `${EYES('her', 'a grey-green iris')} ${HEARTH('her')}`,
  },
  // Ten species, words only: the server attaches bust-2 itself.
  {
    id: 'aasimar-male',
    instruction:
      'Paint it as Oriel, an aasimar man of twenty-five, tall and graceful, golden-bronze skin ' +
      'with a faint inner glow, silver-white hair to the shoulders swept back, pale gold eyes, in ' +
      'a white linen tabard edged in gold thread over a shirt of fine steel scale, a deep blue ' +
      'cloak clasped at one shoulder, tall white leather boots; a plain steel mace held upright ' +
      'in the hand at the lower right, the other hand open and empty, a soft ring of pale gold ' +
      `light hanging above his head. ${EYES('his', 'a pale gold iris')} ${FINISH('him', 'the halo as the one glowing accent')}`,
  },
  {
    id: 'dragonborn-female',
    instruction:
      'Paint it as Vessarith, a dragonborn woman of twenty-eight, lean and long-limbed, with a ' +
      'narrow draconic snout, deep cobalt-blue scales paling to sky blue at the throat, a pair of ' +
      'slim backswept horns, no hair, pale silver eyes, in a fitted coat of blue-grey scale armour ' +
      'over dark wool, a grey travelling cloak thrown back, tall dark boots; a long ash spear with ' +
      'a leaf-shaped steel head held upright in the hand at the lower right, the other hand open ' +
      `and empty. ${EYES('her', 'a pale silver iris')} ${FINISH('her')}`,
  },
  {
    id: 'dwarf-male',
    instruction:
      'Paint it as Thorgrim, a dwarf man of ninety, short and very broad, ruddy weathered skin, a ' +
      'thick red beard in two braids with bronze clasps, red hair cropped short, dark brown eyes, ' +
      'in a shirt of blackened chain mail under a hide jerkin, a wide belt with iron fittings, ' +
      'thick wool trousers, heavy iron-shod boots; a steel warhammer with a short oak haft held in ' +
      'the hand at the lower right and a small iron lantern glowing warm orange hanging from the ' +
      `hand at the lower left. ${EYES('his', 'a dark brown iris')} ${FINISH('him', 'the lantern as the one glowing accent')}`,
  },
  {
    id: 'elf-female',
    instruction:
      'Paint it as Ilyriel, an elf woman of ninety, slim and poised, dark brown skin, silver hair ' +
      'cut to the jaw, pointed ears, pale grey eyes, in a long coat of midnight-blue velvet with ' +
      'silver embroidery over black leather, a short hooded cloak thrown back, slim black boots; a ' +
      'slender steel rapier with a swept silver hilt held point-down in the hand at the lower ' +
      `right, the other hand open and empty. ${EYES('her', 'a pale grey iris')} ${FINISH('her')}`,
  },
  {
    id: 'gnome-male',
    instruction:
      'Paint it as Fizwick, a gnome man of sixty, small and wiry, ruddy tan skin, wild white hair ' +
      'standing up from the head, a bushy white moustache, bright blue eyes, a pair of brass ' +
      'goggles pushed up on his forehead, in a patched leather apron over a green waistcoat and ' +
      'rolled shirt sleeves, a belt hung with small tools, short brown boots; a brass clockwork ' +
      'gadget of cogs and a glowing blue vial held in the hand at the lower right, the other hand ' +
      `open and empty. ${EYES('his', 'a bright blue iris')} ${FINISH('him', 'the vial as the one glowing accent')}`,
  },
  {
    id: 'goliath-female',
    instruction:
      'Paint it as Thotham, a goliath woman of twenty-six, tall and powerfully built, pale grey ' +
      'skin with a faint blue cast and darker mottling along the arms, black hair shaved at the ' +
      'sides and bound in a short tail, ice-blue eyes, in a sleeveless jerkin of layered hide over ' +
      'wrapped linen, bracers of bone and leather, a bundle of three javelins slung on her back, ' +
      'hide boots; a single ash javelin with an iron point held upright and close in the hand at ' +
      `the lower right, the other hand open and empty. ${EYES('her', 'an ice-blue iris')} ${FINISH('her')}`,
  },
  {
    id: 'halfling-male',
    instruction:
      'Paint it as Perrin, a halfling man of thirty-five, small and round-cheeked, tan skin, curly ' +
      'chestnut hair, warm brown eyes, in a green wool waistcoat over a cream shirt with rolled ' +
      'sleeves, brown breeches, a small travelling pack on his back, bare broad feet in the ' +
      'halfling way; a short steel sword held upright in the hand at the lower right and a small ' +
      `tin lantern glowing warm orange hanging from the hand at the lower left. ${EYES('his', 'a warm brown iris')} ${FINISH('him', 'the lantern as the one glowing accent')}`,
  },
  {
    id: 'human-female',
    instruction:
      'Paint it as Maren, a human woman of thirty-two, tall and strong, fair skin with a scar ' +
      'across one cheek, red hair in a tight braid, grey eyes, in a steel breastplate over a blue ' +
      'wool gambeson, mail sleeves, a heavy belt, tall riding boots; a steel flail, a short haft ' +
      'and a spiked ball on a chain, held close and upright in the hand at the lower right and a ' +
      'kite-shaped wooden shield painted blue and white strapped to the other forearm. ' +
      `${EYES('her', 'a grey iris')} ${FINISH('her')}`,
  },
  {
    id: 'orc-male',
    instruction:
      'Paint it as Grash, an orc man of twenty-eight, heavy and muscled, grey-green skin, a ' +
      'jutting lower jaw with two short tusks, small yellow eyes under a heavy brow, a black ' +
      'topknot, in hide and iron-scale armour over a bare chest, a broad belt of leather and ' +
      'bone, fur-wrapped boots; a thick spiked wooden greatclub held upright in the hand at the ' +
      `lower right, the other hand open and empty. ${EYES('his', 'a yellow iris')} ${FINISH('him')}`,
  },
  {
    id: 'tiefling-female',
    instruction:
      'Paint it as Zephyra, a tiefling woman of twenty-four, slender and quick, deep crimson ' +
      'skin, two slim horns rising straight up from the brow, a matched pair, long white hair ' +
      'loose to the shoulders, pale silver eyes, ONE thin crimson tail curving out behind to the ' +
      'lower left only, in a fitted jerkin of dark green leather over a grey shirt, a studded ' +
      'belt, slim dark boots; a long glaive, a wooden haft with a curved steel blade at the top, ' +
      'held upright and close in the hand at the lower right, the other hand open and empty. ' +
      `${EYES('her', 'a pale silver iris')} ${FINISH('her')}`,
  },
];

const items = only.length ? ITEMS.filter(it => only.some(n => it.id.includes(n))) : ITEMS;
for (const it of items) {
  if (it.crop && !fs.existsSync(it.crop)) {
    console.error(`✗ crop missing for ${it.id}: ${it.crop}`);
    process.exit(2);
  }
}
if (!fs.existsSync(CAPTURE)) {
  console.error(`✗ capture missing: ${CAPTURE}`);
  process.exit(2);
}
console.log(`nogreen: ${items.length} renders on ${path.basename(CAPTURE)}, bust-2 throughout, checks report-only; about $${(items.length * 0.045).toFixed(2)}`);
if (!yes) {
  console.log('Add --yes to run.');
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
const runDir = path.join(config.outputDir, 'headtest', `${stamp}-nogreen${ANCHOR ? `-${ANCHOR}` : ''}`);
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
        sourceImage: CAPTURE,
        instruction: it.instruction,
        kind: 'token',
        source: 'mannequin',
        slug: `nogreen-${it.id}${ANCHOR ? `-${ANCHOR}` : ''}`,
        headRetries: 0,
        ...(ANCHOR ? { headAnchor: ANCHOR } : {}),
        ...(it.crop
          ? { headAnchor: ANCHOR ?? 'bust-2', references: [{ path: it.crop, role: 'character', label: it.label }] }
          : {}),
      });
      const dest = path.join(DESK, 'tokens', `${String(i + 1).padStart(2, '0')}-${it.id}.png`);
      fs.copyFileSync(r.file, dest);
      results[i] = { id: it.id, file: r.file, desk: dest, head: r.head, anatomy: r.anatomy, usd: r.estimatedUsd };
      console.log(`${it.id.padEnd(18)} ${r.head?.verdict ?? '?'}·${r.head?.eyes ?? '?'}  ${r.estimatedUsd.toFixed(3)}  → ${dest}`);
    } catch (e) {
      results[i] = { id: it.id, error: String(e.message ?? e) };
      console.log(`${it.id.padEnd(18)} ERROR ${String(e.message ?? e).slice(0, 120)}`);
    }
    fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify({ runDir, capture: CAPTURE, spendUsd: spend.totalUsd, items: results }, null, 2));
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`done: $${spend.totalUsd.toFixed(2)}; run ${runDir}`);
