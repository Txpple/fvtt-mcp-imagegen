---
name: illustration-builder
description: >-
  Generate campaign art with the imagegen tools, grounded in what the world already says and shows.
  Use when the user wants art for the table: "make a portrait for <NPC>", "generate art for this
  scene/journal/handout", "this actor needs a token", "icons for these items", "illustrate this
  location", "give the inn a picture", "change this token's cloak", "repaint this map". Reads the
  ACTUAL descriptions (actor bios, journals, scene notes, campaign repo) to build prompts, follows
  the campaign's art shelf for the look, runs the generate → look → edit loop, and stages the
  winner for the owner's approval. The imagegen tools own correctness (model per kind, dimensions,
  cutout, file naming, the Pro cost gate); this skill owns the judgment: what to prompt, which
  references to attach, what to reject, when to pay for Pro, where the art goes.
---

# Illustration builder

The judgment layer over `generate-image` / `edit-image` / `cutout-image`. Its job: the prompt comes
from **canon**, the look comes from **the campaign's shelf**, Pro money is never spent without the
owner opting in, and nothing lands in the world uncurated. The imagegen server owns model
selection, dimensions, cutout and file conventions; the dnd5e MCP owns delivery (`upload-asset`,
`set-actor-art`, `add-journal-image`; its `token-cutout` skill is the install half for tokens).

This file is the recipe per kind. The dated record of what was tried and what the owner said is
[lessons.md](lessons.md) beside it: read its section for a kind when that kind misbehaves, never as
a first step. Where the two differ, this file wins.

## Before anything, every job

1. **Cold start:** `imagegen-status` (key, both models, output folder, spend so far).
2. **Read the campaign's `art/SHELF.md`, Part 1** (the rules: house style, the finish table, the
   token rules, canon-to-camera words, the identity anchors, the superseded list) and the catalogue
   section for the kind you are making. The shelf is what makes this generic skill one campaign's:
   every `<the shelf's … finish>` below resolves there, and this skill carries no finish words of
   its own. No shelf yet? Build one from `art/` and the world's assets, and propose committing it.
3. **Ground the prompt in canon.** For a named subject this is mandatory, never from imagination:
   `manage-actors` `get` (bio, species, gender, age, class, gear; the stat block is canon for
   props), the item's description, `search-journals`, the campaign repo's `plot/`, `world/`,
   `sessions/`. **Read the existing art** (hard gate when the actor `hasImage`: export → `img` /
   `prototypeToken.texture.src` → `download-asset` → Read): bios routinely omit what the art
   settles. A scene of a played event means the session record *and* a look at the battlemap it was
   fought on, armed for that session's loot, with only the PCs who were there. Where canon is
   silent, propose ("canon doesn't say; I'll go with …") and offer to write it back afterwards.
   **A PC's look changes in play, and the shelf's identity anchor is only as current as the last
   wrap**: before pasting an anchor's binding phrase, check it against the latest session record
   (loot, gifts, gear changes) and the live portrait; a `character` crop is identity only, so a
   stale phrase dresses the figure wrong however current the crop (the campaign's Tychon lost his
   new robe this way, 2026-10-21). Update the anchor row before rendering, not after.
4. **Pin the kind by the destination**; the kind picks the tool and the tier:

   | destination | kind | route |
   | --- | --- | --- |
   | actor token | `token` | `edit-image` on a base (the restyle); `generate-image` only with no base |
   | actor sheet portrait | `portrait` | `generate-image`, 3:4 at 2K |
   | journal image, handout, splash | `illustration` | `generate-image`, 16:9 at 4K → 2560×1600 |
   | item / spell / feature icon | `icon` | `generate-image`, 512 square |
   | map prop placed as a tile | `prop` | `generate-image` with `footprint`; `edit-image` keeps the source size |
   | a bought battlemap repainted | `battlemap` | `edit-image` only (the tool refuses to paint a map from words) |
   | a regional or world map | `overland` | `edit-image` only, painted bare; names by script |

5. **Flash by default, Pro on request** (owner rule 2026-09-19). When the owner asks for a portrait
   or an illustration, say once that Pro is available for a bit extra (about double) and carry on
   with Flash unless they take it; `tier: "pro"` needs `confirmPro: true`, passed only after a yes.
   Pro earns its cost on crowded scenes and text-heavy handouts; it is not a better fixer.
6. **The chat is the gallery** (owner preference): Reading a PNG shows it; finals also go out by
   `SendUserFile`. **Nothing goes to Foundry uncurated**: finals land in the campaign's
   `art/staging/`, the owner approves, then upload and wiring, then the file graduates to `art/`
   with a shelf row. After an installed batch, offer `art-audit`.

## The flaw pass (every render, before anyone sees it)

Read the PNG twice. First against canon: wrong gender, species, props or mood are rejections on a
beautiful render. Then count, out loud: limbs and digits per creature; duplicated effects and props
(a second fireball, a floating extra weapon); every referenced face present once and on the right
figure; signatures, lettering, watermark marks; objects that make no sense (a strap to nothing, a
staff through a body); nothing touching the frame edge; nothing crossing a face. For tokens and
portraits pass the book's line as `anatomy` and read the result's `anatomy` report (counts, each flaw
placed, a token's facing with the rotation that fixes it), then count anyway: the judge can be wrong.

A flaw that is obvious goes through one `edit-image` naming every flaw precisely and ending with
"keep everything else identical"; **name it anatomically, not by count** ("delete the rear pair of
legs trailing behind its front talons" worked where "exactly two legs" failed twice). Two edit
passes at most; a third miss means re-generate (or re-base a token). A facing flaw is a Pillow
rotation of the PNG, never a render. **The pass is mandatory every time; the edit is not**: a render
with no obvious flaw is finished, and every edit re-rolls the pixels. Show the owner only the best
surviving render with a one-line note of what was fixed or rejected on the way.

## Tokens: the restyle

A token starts from an existing image, **the base**, and one `edit-image` kind `token`, flash, turns
it into the finished token with the base's pose and camera kept and the words supplying race, face,
kit, colours and finish. The tool frames it, picks the chroma plate, cuts it to alpha on a 512 square
(1024 with `creatureSize: "large"`) and reports the cut; Read the `*_preview.png` before trusting the
edge. The mannequin pipeline of 2026-10-15 to 17 (grey pose captures, a server-attached bust, a head
judge) was tried at length and retired 2026-10-18: never a grey pose library, never a head anchor,
never a judge of the head.

1. **Pick the base by pose, never by race** (owner, 2026-10-14). Read file names across every
   folder of the owner's library (`Category - Subject`; `M_`/`F_`; the role words; `_hi` and numbers
   are not subject) for the stance the character needs, already steeply overhead (head and
   shoulders large, legs tucked): the restyle changes species, skin, hair, horns and gear in one
   pass and never changes the pose or the camera. **The camera angle is the base's and no edit
   changes it** (owner, 2026-10-11): a frontal base reads as lying on its back on the canvas, and six
   passes of angle words did not fix one. Wrong angle or wrong limbs: pick another base, don't edit.
   The actor's own world token is the base for a gear change or a quality refresh; a capture the
   owner made (a HeroForge pose, a screenshot) is a base too.
2. **Write the instruction light, the way the owner types in the Gemini app**, opening with the
   paint-in-place line the shelf gives ("Paint over this exact figure, keeping its pose, limbs, head
   angle, camera and outline unchanged; change only: …"), then the change in words, then the shelf's
   token finish line. No angle, background or plate words: the tool adds the keep line, the shadow
   line and the plate. For a quality refresh: `repaint this token at much higher quality in <the
   shelf's token finish>: keep the exact pose, silhouette, design, colours and camera angle, but
   redraw the anatomy, faces and materials properly with fine painted detail`. Ask for existing
   detail to be sharpened, never for new detail to be added, and never for rim light, glow or an
   outline (they come through the cut as a fringe). A refresh only works on a good source.
3. **References.** None beside the source for a nameless figure. For a known face, a head-to-waist
   crop of the approved portrait as `character`, bound **"for identity only, never its lighting,
   palette or camera"**: a portrait crop otherwise brings the portrait's light with it (a cool rim, a
   fungus glow) baked onto the figure, which the shelf forbids. Gear that must match is a **tight
   crop of just that part as `object`** (a weapon head, a shield face, horns, a lute); colours are
   matched by words. **Never attach a whole token beside the source**: a sibling's token as the
   reference comes back as the sibling with a new head, a PC's other look carries its pose in, and a
   style token gets its subject copied. A style image the owner hands over is the one exception and
   costs the camera and the anatomy; expect a redo without it.
4. **Changes that hold and changes that don't.** A pose the owner chose is sacred: several changes
   at once redraw the figure in its default stance, so split them into light passes, each opening
   with the keep line (head and weapon; armour and cloak; the refresh). Size a weapon when it first
   appears, with its length written ("the blade longer than her arm and torso together"); an edit
   will not lengthen it. A different creature in the same pose is an edit too ("turn this rat into a
   red squirrel … keeping the exact pose"). **Never edit anatomy**: a "fix the leg" edit left a third
   leg; re-base instead, and count limbs after any limb or pose edit.
5. **Read the result**: the flaw pass, the `anatomy` report, the facing (Foundry's front is the top),
   the plate preview for a fringe (a glow over the plate picks up the plate colour: name the glow's
   colour; a spell-light token goes on a blue or magenta plate). A sheen or tint the figure has no
   source for is a flaw: one edit ("remove the cool blue-green sheen; light him by flat matte light
   from above"), then the shelf's pixel passes.
6. **From words** (`generate-image` kind `token`) only for a creature with no usable base or a
   redesign the owner asks for: describe the creature and its pose as a camera sees it ("seen from
   steeply overhead, he crouches low …"), a face crop as `character`, no style image, the book's line
   as `anatomy`; never framing, angle or background words (the tool owns them, and vaguer plate
   wording once painted a green disc). The tool's framing covers upright figures (face up) and
   four-legged or crawling creatures (seen along the back). Nothing ever clips off a token: the tool
   re-renders one clip and refuses a second; then rewrite for a compact pose rather than retrying.
7. **Install** by the dnd5e `token-cutout` skill: upload to `tokens/<kind>/<slug>.png`,
   `set-actor-art` (which resets the inherited scale and ring), check the facing before auto-rotate,
   patch placed copies. The shelf says what else the campaign does (size scale, Token Art looks).

## Portraits

`generate-image` kind `portrait`, flash, two or three candidates. The subject as a camera sees it,
one action, the setting full; the shelf's portrait finish line with **the register's light named as
the key from out of frame**: a named lamp, torch or candle gets painted into the picture. Identity
is a face crop of the approved art as `character`, bound "for the face only, never its painting
style, lighting or camera angle"; a whole portrait as `character` carries build, light and pose in,
and a finished portrait as `pose` copies the whole painting. The pose goes in as words. **Mood goes
into the first render** (an edit barely moves it); edits are for flaws, one instruction each, and a
fresh render from a written description does what an edit cannot (slim a figure, re-pose a hand,
move an age). Name the hand by the viewer's side (the model draws a writing hand as the right) and
mirror locally when it comes back wrong. Check the portrait in the actor sheet's circle before
installing; crop locally rather than re-render. Upload as WebP quality 90 to `portraits/<slug>.webp`.

## Illustrations and handouts

`generate-image` kind `illustration`: the shelf's prompt template, the subject, the grandeur line
where the shelf's rules call for it, the register's finish line. References: a face crop of each PC
present as `character` (bound by the shelf's phrase), NPC portraits as `character`, one approved
illustration as `style` (the shelf's standing style shelf, only when its subject matches the scene).
**Compose inside the entity ceiling**: past about six subjects any model collapses into a lineup;
default to duel or vignette compositions (one or two party members, one enemy, one landmark, one
directional action, the hero large). Give every figure exactly one action clause; describe enemies
with contrasting features so a reference face does not land on them. **Pro for crowded scenes**
(flash came back flat on every five-figure scene). An old illustration as `pose` copies its finish.
Upload to `journal/<journal>/` or `handouts/` and wire with `add-journal-image`.

## Icons

`generate-image` kind `icon`, flash; the tool appends "single subject centered, filling the frame, no
text, no border". You supply the style, or the render comes back photoreal: the shelf's icon line in
the proven shape `fantasy RPG inventory icon, <the shelf's finish>, <its light>, rich mid-tones and
soft shadows, plain dark vignetted background. Subject:` then the object with its material. The same
prefix for every icon in a set (twenty in a row held). **An item a character wears in approved art is
drawn from that art**: tight crops of it as `object`, the garment hanging empty, front view. For a set
from a compendium folder, prompt each from its description and upload with `upload-asset-tree`.

## Props, patches and overhead tiles

- **A new prop:** `generate-image` kind `prop` with `footprint` from the file-name convention
  (`TC_Anvil 02_2x1.png` is `"2x1"`), a crop of the map around the spot as `style` so ink and palette
  match, the shelf's prop finish; delivered at 300 px per cell. Never run a prop as a `token` (the
  token wording adds people). Name colours when they matter. **Refreshing a library prop** is
  `edit-image` kind `prop` with the repaint wording; it comes back at the source's exact size.
- **Fine edits to a painted map are tiles, never another draft of the map** (owner, 2026-10-11):
  `upload-asset` to `worlds/<world>/assets/tiles/props/<area>/<slug>_<W>x<H>.png`, find the spot's
  centre on the painting plus the scene's `sceneX`/`sceneY`, `manage-placeables` `tiles` `create`
  sized in the scene's pixels, **unlocked** (a locked tile can't be clicked on the Tiles layer, so
  to the owner it looks missing), move any light that belongs to the object onto it,
  `screenshot-scene` and look.
- **A patch** changes something already painted (close a door, paint out a chest): crop the scene
  image a little wider than the change, `edit-image` kind `battlemap` on the crop, resize the result
  to the crop, feather its alpha about 50 px, place it at the crop's pixels plus `sceneX`/`sceneY`,
  unlocked. The drift check refuses a removal on a small crop (the change is the drift): read the kept
  `-drifted` render and judge by eye. A patch can hold a state (a door painted open, a closed patch
  on top, hidden on the day it opens).
- **Overhead features** (anything a token should pass under): ONE whole-map `battlemap` edit that
  names the *kind* of thing, never positions ("remove every wooden shoring beam, timber post and
  plank … add no new beams; keep every lantern exactly where it is"); a positional instruction
  removed the wrong beams and passed the drift check. Then cut each feature from the ORIGINAL map
  (hand-drawn polygon, dilated about 8 px, feathered about 2 px, saved at its bbox), composite every
  cut over the edited map and compare tile by tile with the original, install the edited map as the
  background and each cut as an overhead tile (elevation 20, `occlusionMode` 1 Fade, `occlusionAlpha`
  0.25), and check with `screenshot-scene` `asToken` under a beam.

## Battlemaps

Battlemaps are bought as UVTT packs with their walls; this server only restyles one in place. The
tool pads the source to an API aspect, maps the render back onto the source's pixel grid, writes a
checkerboard `check` image, and refuses a render whose layout moved. You own the instruction and
the content check.

- **The proven shape:** `repaint this top-down battlemap as <the shelf's battlemap finish>, <the
  shelf's colour words>, rich mid-tones and soft shadows, and crisp fine detail on every surface`.
  "Soft shadows", never "deep" (owner, 2026-10-16: "deep" drifted every map dark; a dark place is not
  a reason to paint a map dark, Foundry's darkness does that). The same words on every map in a set
  make maps from two authors one family; drop the warm word for a map whose cold palette is the
  point. Words only: a map or an illustration as a style reference paints its own layout or invents
  terrain. Keep "crisp fine detail on every surface" or strokes smear at full resolution.
- **Start from the Clean variant when the map is being re-themed** (owner, 2026-10-07): the standard
  map's dressing is the pack's story and the keep line keeps it. Name the dressing you want, carry
  Clean's walls, take lights from the standard scene. **No interactable creatures on a map**: anything
  the party could fight, talk to or herd is a token; critters (fish, bats, rats) are painted.
  **Dress lightly** (owner, 2026-10-11): added solid things have no walls, so keep new dressing low and
  sparse (rugs, bedrolls, a firepit, things flush against existing walls) and leave the open floor open.
- **Dressing a whole scene is one light pass** (owner, 2026-10-12): never scatter prop tiles by hand
  across it; one `battlemap` edit that names each kind of dressing and where it belongs, then "keep
  it sparse and low: leave the open floor open, put nothing in the tunnels, add no tables, crates or
  tall objects", then move each scene light onto its painted source. The drift check reads added
  dressing as moved layout, so pass `dressing: true` on a dressing pass: the check reports instead
  of refusing, and you judge the one render by drawing the pack's walls over it (they must sit on
  every rim). Tiles come after, only for a specific fix the pass got wrong.
- **A pack's own tile layers get the map's restyle too** (owner, 2026-10-25): canopies, overhead
  roofs, level tiles and any other painted layer the pack ships, so nothing on the table is in the
  pack's old style beside the restyled map. Composite every layer over the *restyled* map, one
  `battlemap` edit that names only the layers' things and keeps the ground ("repaint only the tree
  canopies ... in exactly the same painted style, brushwork and palette as the ground around them
  ... keep every tree exactly where it is, at exactly its size and outline ... keep the ground ...
  untouched"), then cut each layer back out of the result with its **original** alpha. The outlines
  stay the pack's, the paint is new, and the ground caught inside the alpha is the map's own, so it
  can't show. If a re-theme changed what a layer should be (a seam map with blight on one side), first
  split or recolour the layer to fit (each tree whole, by its centroid), then restyle. Upload under
  new names (clients cache the old picture) and patch the tiles' `src` only.
- **A roof short of its walls on a v14 level map** (owner, 2026-10-29): packs often paint the outer
  eaves and a bay's hip on the *upper-floor* tile, which v14 shows only on that level, so from the
  ground the roof covers the middle of the house. Before any image call, view the scene per level.
  Fix by hand, no render: repeat shingle courses beside the ridge until the eaves reach the painted
  walls (`Desktop/maplib-scripts/village/stretch-roof.py` picks the band with the best seam), lift
  the missing hip off the upper-floor tile, colour-transfer it to the roof's mean and spread, union
  them into one tile, upload under a new name and set the tile's `src` *and* its rect to the new
  picture (`set-tile.mjs`).
- **Closing a corridor is two steps**: the wall, then a fade pass on a crop beyond it (remove the
  leftover rims and the black block, give the new wall's outer side the same soft rock shoulder
  fading to black), blended only beyond the wall line. Look again at the whole map for a stub.
- **The drift check guards where things are, not what they are.** Read every map (the result and
  the checkerboard) for the slips the model makes in place: a roof or glazing over rooms, a cold
  hearth lit, glows or string lights added, a material swapped (dirt to cobbles, stone walls to
  wood), an object changed identity, something new at the edge. To fix one, render again **from the
  original** naming what must stay; never edit the restyled result (each pass re-rolls the map). A
  drift refusal on a plain restyle means the instruction asked for too much change; lighten it.
  For a dense dungeon name the rooms that matter from the start; if a palette is the map's identity,
  say so. Google sometimes returns no image (nothing billed): run it once more. One call at a time.
- **Installing:** `upload-asset` the WebP to `worlds/<world>/assets/maps/<name>.webp`, then
  `manage-scenes` `update` with `sceneIdentifier` and `backgroundPath` only (never width, height or
  gridSize: the walls are in the scene's coordinates). Note the old path first, draw the walls over
  the restyle and look, `screenshot-scene` after. Only after the owner has approved the map.

## Overland maps

`edit-image` kind `overland` on an existing map (a sourcebook map, a sketch): the tool locks the
geography and paints out every label, marker, road, compass rose and scale bar, so the instruction
is only the finish; names and symbols go on afterwards by script, exact and re-placeable. **The model
will not drop all the lettering in one pass**: Read the result and edit it again naming every word
still visible, until it is bare (give the erase its own pass; bundled with other changes it was
ignored). A busy map never comes clean that way: clean the source locally first (downscale to about
600 px, median filter, scale back, light blur), run the overland edit on that, then one more pass
with the sibling regional map as `style` to sharpen it. **Read the source map's legend into the
instruction** (the model takes cartographic symbols literally: tufted hills became forest), and
cross-check the result against the source quadrant by quadrant before calling it done.

## The prompt cookbook (rules that have held on every model)

- **Say the identity outright** ("old halfling woman innkeeper, grey hair in a neat bun"), never a
  bare pronoun or a species adjective doing the work. **Stack gendered features**: a lean build plus a
  smooth face rendered a canon man as a woman despite the word "male".
- **Describe props concretely**: "crossbow" drifts into muskets; stat-block gear is described, not
  named. **Translate canon into camera words** (owner, 2026-08-26): the model has never heard of the
  campaign's proper nouns; canon decides what is true, the prompt says what a camera sees, and
  effects stay modest (over-described glow becomes neon).
- **Negation backfires**: "no beard" grows a beard. Describe presence ("his chin and jaw are smooth
  bare skin"). **The garment noun overrides its clause**: a "jerkin" is sleeveless whatever you say;
  pick the noun that implies the silhouette and layer. "Pauldrons" render as steel in any prompt.
- **Never "book art", "cover" or "poster"**: they paint title lettering and borders. Style lives in
  the shelf's finish line, never in a product word.
- **Change one axis per render**; with `edit-image` that is natural. **Species proportion is a losing
  fight in a waist-up crop**: facial structure and a scale cue in frame beat size words.
- **The campaign's own words win**: the shelf's canon-to-camera table and its Never list are read
  before every prompt.

## What this skill does not do

Install tokens (the dnd5e `token-cutout` skill), audit an installed batch (`art-audit`), build the
scene or the actor (the dnd5e authoring skills), or carry campaign facts: names, the party, finish
words and the paths on one owner's desk live in the campaign repo's `art/SHELF.md`.
