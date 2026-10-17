// The owner's fully-top-down test (2026-10-17, evening): the four PCs and the four Elders on a
// capture shot straight down with the head crown-only (no eyes to see, no green marks), the
// campaign's recipe otherwise (the portrait's head-to-waist crop as `character`, the shelf's
// finish line), `headAnchor: "capture"` so nothing is attached or said about the head, the
// checks report-only. Runs from the rebuilt dist/ (no server restart needed) and copies each
// token to the owner's Desktop folder as it lands.
//
//   node scripts/research/topdown.mjs [--yes] [--only id,id]
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

const CAPTURE = process.env.CAPTURE ?? 'C:/Users/sippelmc/Desktop/EyeColorTests/Mann 15 Stand 3-Portrait2.png';
const DESK = process.env.DESK ?? 'C:/Users/sippelmc/Desktop/EyeColorTests/05-fully-top-down-no-eyes';
const CAMPAIGN = path.resolve(root, '..', '..', 'fvtt-campaign-echoesofhalruaa', 'art', 'headtest');
const ELDER_CROPS = process.env.ELDER_CROPS ?? path.join(DESK, '..', '02-the-elders', 'portrait-crops-attached');

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
  {
    id: 'tychon',
    crop: path.join(CAMPAIGN, 'outfit-tychon-tessarin.png'),
    label: 'Tychon',
    instruction:
      'Paint it as Tychon (Image 2), a lean young man of twenty with short tousled black hair and ' +
      'dark eyes, in his patched blue wool robe, a leather satchel on a strap across his chest, ' +
      `soft leather boots; his hands are empty. ${FINISH('him')}`,
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
      `are empty. ${FINISH('him')}`,
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
      `other forearm. ${FINISH('him')}`,
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
      `the lower left, the key light. ${FINISH('her', 'the flame as the one glowing accent')}`,
  },
  {
    id: 'ansel-lowmarrow',
    crop: path.join(ELDER_CROPS, 'crop-ansel-lowmarrow.png'),
    label: 'Ansel',
    instruction:
      'Paint it as Ansel Lowmarrow (Image 2), an old halfling man, small and slight, pale lined ' +
      'skin, white curly hair thinning at the crown under a flat cap of felted Archivist-grey ' +
      'goat-wool, enormous soft-lobed ears, round brass spectacles, dark brown eyes, in an old ' +
      'Halruaan wizard\'s robe faded to the colour of dried blood with a high stiff collar and ' +
      'bands of tarnished silver-gold sigils and stars down the front and cuffs, the hem torn to ' +
      'rags and the elbows patched with plain cloth, a brown leather satchel on a cross-strap, ' +
      'his broad feet bare in the halfling way; an open leather ledger with brass corners held ' +
      'in the hand at the lower right, the fingers curled over its edge, the other hand open. ' +
      HEARTH('him'),
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
      HEARTH('him'),
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
      HEARTH('him', "the chalk's faint blue glow as the one glowing accent"),
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
      HEARTH('her'),
  },
];

const items = only.length ? ITEMS.filter(it => only.some(n => it.id.includes(n))) : ITEMS;
for (const it of items) {
  if (!fs.existsSync(it.crop)) {
    console.error(`✗ crop missing for ${it.id}: ${it.crop}`);
    process.exit(2);
  }
}
if (!fs.existsSync(CAPTURE)) {
  console.error(`✗ capture missing: ${CAPTURE}`);
  process.exit(2);
}
console.log(`topdown: ${items.length} renders on ${path.basename(CAPTURE)}, headAnchor "capture", checks report-only; about $${(items.length * 0.045).toFixed(2)}`);
if (!yes) {
  console.log('Add --yes to run.');
  process.exit(0);
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '-');
const runDir = path.join(config.outputDir, 'headtest', `${stamp}-topdown`);
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
        slug: `topdown-${it.id}`,
        headAnchor: 'capture',
        headRetries: 0,
        references: [{ path: it.crop, role: 'character', label: it.label }],
      });
      const dest = path.join(DESK, 'tokens', `${String(i + 1).padStart(2, '0')}-${it.id}.png`);
      fs.copyFileSync(r.file, dest);
      results[i] = { id: it.id, file: r.file, desk: dest, head: r.head, anatomy: r.anatomy, usd: r.estimatedUsd };
      console.log(`${it.id.padEnd(16)} ${r.head?.verdict ?? '?'}·${r.head?.eyes ?? '?'}  ${r.estimatedUsd.toFixed(3)}  → ${dest}`);
    } catch (e) {
      results[i] = { id: it.id, error: String(e.message ?? e) };
      console.log(`${it.id.padEnd(16)} ERROR ${String(e.message ?? e).slice(0, 120)}`);
    }
    fs.writeFileSync(path.join(runDir, 'manifest.json'), JSON.stringify({ runDir, capture: CAPTURE, spendUsd: spend.totalUsd, items: results }, null, 2));
  }
}
await Promise.all([worker(), worker(), worker()]);
console.log(`done: $${spend.totalUsd.toFixed(2)}; run ${runDir}`);
