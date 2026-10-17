---
name: illustration-builder
description: >-
  Generate campaign art with the imagegen tools, grounded in what the world already says and shows.
  Use when the user wants art for the table: "make a portrait for <NPC>", "generate art for this
  scene/journal/handout", "this actor needs a token", "icons for these items", "illustrate this
  location", "give the inn a picture", "change this token's cloak". Reads the ACTUAL descriptions
  (actor bios, journals, scene notes, campaign repo) to build prompts, studies existing art in the
  Foundry data files for precedent and style, runs the generate → look → edit loop, and wires the
  winner into the world. The imagegen tools own correctness (model per kind, dimensions, cutout,
  file naming, the Pro cost gate); this skill owns the judgment: what to prompt, which references
  to attach, what to reject, when to pay for Pro, where the art goes.
---

# Illustration builder

The judgment layer over `generate-image` / `edit-image` / `cutout-image`. Its whole job is to make
sure the prompt comes from **canon**, the style comes from **precedent**, Pro money is never
spent without the owner opting in, and nothing lands in the world uncurated. It adds no mechanics — the
imagegen server owns model selection, dimensions, cutout, and file conventions; the dnd5e MCP owns
delivery (`upload-asset`, `set-actor-art`, `add-journal-image`).

Tools used: `imagegen-status`, `generate-image`, `edit-image`, `cutout-image` (imagegen);
`manage-actors` `get`, `search-journals`, `manage-journals` (`list` / `get`), `manage-scenes` (`list`), `list-assets`, `download-asset`,
`upload-asset`, `set-actor-art`, `add-journal-image` (the dnd5e MCP).

## Step 0 — Pin the subject and the destination

Two questions before anything renders: **what is this a picture of**, and **where does it live**?
The destination picks the `kind`, and the kind picks the model tier:

| destination | kind | tier |
| --- | --- | --- |
| item / spell / feature icon | `icon` | flash |
| actor token (top-down, cut to alpha automatically) | `token` | flash |
| map prop placed as a tile (furniture, barrel, tree) | `prop` | flash |
| actor sheet portrait | `portrait` | flash; mention Pro is available for a bit extra |
| journal image page / player handout / location splash | `illustration` | flash; mention Pro is available for a bit extra |
| a bought battlemap, repainted in the house style (scene background) | `battlemap`, `edit-image` only | flash |

Battlemaps are bought as UVTT packs with their walls; never try to generate one (the tool
refuses). Restyling one is a `battlemap` edit; see **Battlemaps** below.

**Overland maps** (owner rule 2026-10-03: a map never carries names or symbols from the model).
A regional or world map is an `overland` edit of an existing map (a sourcebook map, a sketch):
the tool locks the geography and paints out every label, marker, road, compass rose and scale
bar itself, so the instruction is only the finish. Names and symbols go on afterwards by script
(PIL text on the bare map, positions read off the source), exact and re-placeable. The drift
check is advisory below gross drift: a repainted coastline passes, a swapped geography is
refused. First use: a kingdom from its 3.5e sourcebook map, 2026-10-03; with labels left in, the
model misspelled three of thirty names, which is why the bare map is the rule. **The model will
not drop all the lettering in one pass**, keep line or not: that map took three. Pass
one removed the markers, compass and scale bar but kept (and respelled) most names; pass two,
an edit of pass one asking to erase "every word, letter by letter", left the eleven small
settlement names; pass three, naming those eleven words outright, came back clean with zero
drift. So: run the overland edit, Read it, then edit the result again naming every word still
visible, until it is bare. Each pass is about 11 cents. **A busy map (hundreds of labels and icons,
e.g. a fan continent map) never comes clean that way**: the model traces the clutter and
re-garbles it (a continent map, 2026-10-03, two passes). Clean the source locally first: downscale to
about 600 px wide, median filter, scale back, light blur, which kills the micro-text and keeps
coastlines and region colours. Run the overland edit on that soft sketch (comes back bare but
soft), then one more overland edit on the result with the sibling regional map attached as
`role: "style"` to sharpen it to the same finish. Three renders, about 45 cents, zero drift. **Read the source map's legend into the
instruction** (2026-10-03): the model takes cartographic symbols literally. On that
sourcebook map it painted every round tufted hill symbol as forest, turned dotted plains bare
green, and put a swamp on a mountain massif; a cross-check against the source found seven
wrong regions. Say what each symbol is ("round tufted bumps are rolling hills, never trees;
hatched ridges are mountains; dotted lowlands are farmland; the only forest is ...") and name
any region the model gets wrong. Then cross-check the result against the source quadrant by
quadrant, side by side, before calling it done. Give the label erase its own pass: bundled
with other changes in one instruction it was ignored entirely.

**Battlemaps** (owner goals 2026-10-02: upscale and improve older art, and give maps from
different authors one consistent style; Foundry walls and lights are traced over them). The tool
owns the geometry: it pads the source to an API aspect, maps the render back onto the source's
pixel grid (a whole-number upscale when the source is small), and refuses a render whose layout
moved. You own the instruction and the content check. The proven shape (round 4, 2026-10-02:
faithful on the three maps that had been the worst offenders before it):

`repaint this top-down battlemap as <the shelf's battlemap finish>, <the shelf's colour words>,
rich mid-tones and soft shadows, and crisp fine detail on every surface`

The finish and the colour words come from the campaign's `art/SHELF.md`; the shape is what held.
The shadow words are "soft shadows", never "deep shadows" (owner, 2026-10-16): "deep" here made
every map darker than the shelf asked, a dark-fantasy drift the owner retired. A map is never
painted dark because its place is dark (a deep cave, a crypt); Foundry's darkness does that.
Use the same words on every map in a set; that sentence, not a reference image, is what makes
maps from two authors read as one family. A warm colour word pulls every map toward gold and
brown (that is most of the family resemblance), and it once turned mossy green stone walls to
brown wood; drop it for a map whose cold palette is the point (a crypt, an ice cave).
What did not work, so do not repeat it:
- **A map as a style reference.** It painted its own layout over the source, on both attempts
  (the guard refused both, $0.30 gone). Never attach a map beside a map.
- **An illustration as a style reference.** Safer, but it invented terrain: cliffs and boulders
  at a tavern's edges, dirt over a plain dark background. Words only.
- **A loose brushwork word with nothing about detail.** Big swirling strokes on water and grass
  that smear to mush at full resolution. Keep "crisp fine detail on every surface".
- **Pinning colours and daylight.** "Same colours, same daylight, only the technique changes"
  came back as a colour grade, not a repaint.

The drift check guards where things are, not what they are. Read every map (the result, then
the `check` checkerboard it reports) for the content slips the model makes in place: a roof,
dome, or glazing over rooms; a cold hearth lit, or glows and string lights added; a material
swapped (dirt to cobbles, stone stairs to planks, stone walls to wood); an object changed
identity (an idol became an elephant); something new at the map's edge (a cart, a cliff). To fix
one, render again **from the original**, naming what must stay ("the fireplace is cold grey
stone"). Do not edit the restyled result; each pass re-rolls the whole map. A drift refusal
means the instruction asked for too much change; lighten it rather than retrying it.

What the 2026-10-02 set of 14 (Forgotten Adventures, Tom Cartos, Mad Cartographer) taught:
- **Source file.** Use a pack's gridless file (Foundry draws its own grid) at the resolution
  the scene already uses. FA ships 100 and 200 px-per-cell versions; the 100 one is the one the
  render can match.
- **Big and dense maps slip more.** The render tops out around 4800 px, so a 72×95-cell dungeon
  gets about 50 px a cell, and small details are guessed: on FA's Tomb of Horrors the chapel pews
  became bookshelves, a misty cavern a crater with a chest, blue pillar orbs orange candles, and
  a compass rose appeared. For a dense dungeon, name the rooms that matter in the instruction
  from the start ("the chapel keeps its wooden pews and blue-glowing altar").
- **Strong source palettes survive.** FA's rainbow-void maps kept most of their colour; the
  Feywild Throne's purple and teal forest went autumn. If a map's palette is its identity, say
  so ("the forest stays fey purple and teal").
- **Without "warm" a snow map barely changes.** Fine if that is the point.
- **Google sometimes returns no image** (finishReason NO_IMAGE, nothing billed). Run it again
  once.

What a 2026-10-05 set taught (12 bought caves re-themed as one campaign's home, plus a kitbash;
full write-up in `notes/map-builder/PLAN.md`):
- **Content changes re-theme a map well, and they move it.** "The curved stone structure is a
  forge hearth; the stone block is an anvil" turned a pack's shrine into a forge the owner
  loved, but 10 of 12 such renders drifted 3–5% and were refused (both drafts are kept as
  `-drifted1/2.webp`). When the owner says walls don't matter yet, the drafts are deliverable:
  pick by eye. When walls matter, keep the instruction to paint only.
- **One call at a time.** Four `edit-image` calls in parallel all came back Gemini HTTP 500.
  A timeout happens now and then; retry it once.
- **A repaint is only as rich as its input.** Our own drawn geometry (procedural sketches)
  repainted as clip art, clearly inferior to repainted pack maps. A kitbash of real pack art
  (a Clean variant as the base, props lifted from other maps) repainted at pack quality.
  Never draw our own geometry for a final map.
- **The drift check misfires on composed or sketched input.** It refused renders that kept
  96–98% of the source's floor. For those, compare floor masks (void threshold after a light
  blur) and accept at about 0.95 overlap; read both drafts.
- **The model adds and grows.** Extra braziers and crates appeared; a painted-in door slab grew
  two squares. Keep painted-in pieces prop-sized, and fit walls after the repaint, not before.
- **Name the void.** Some renders painted textured rock into the black around a cave; add "the
  surrounding void stays pure black" when walls will be traced.
- **Regular patterns come back as a printed grid.** Grid-aligned flagstone joints in the input
  repainted as a baked grid that fights Foundry's.
- **The shelf owns the finish words.** A campaign's `art/SHELF.md` says what the brushwork is
  (one banned "visible brushwork" for the swirls it drew and asked for "smooth, refined,
  controlled"); the recipe's shape holds under any finish line.
- **Clean variants are a prop library.** A pack map minus its Clean twin lifts every prop
  with alpha (fill the contours so pale props keep no holes). Combined sheets show which tiles
  the author designed to join.
- **Start from the Clean variant when the map is being re-themed (owner rule 2026-10-07).**
  The standard map's dressing is the pack's story, and the keep line makes the model keep it:
  a predator's gore-strewn lair in one pack map came through into a campaign's home
  tunnels untouched. Clean is the walled blank slate: it ships as its own scene with the
  structural walls (cave rim, rooms, doors) and none of the prop loops or lights. Name the
  dressing you want in the instruction, carry Clean's walls, and take lights from the standard
  scene's sidecar or the fit's glow pass. Water is terrain, not dressing: Clean keeps pools,
  and only a Dry variant (Caves 02) removes them. Use the standard map only when its dressing
  is the point (a plain restyle for a better look).
- **No interactable creatures on a battlemap (owner rule 2026-10-07).** Anything the party
  could fight, talk to, herd, buy or rescue is a token, made separately, so it can move: the
  goats on the ledges, the people at the fire, a guard at a gate. Prompt the pen, the hay
  rack and the stool; leave the goats out. Critters are the exception and should be painted:
  minor, non-interactable life that is set dressing, such as the blind fish in the pool, bats
  in the roof, rats at a spoil heap, moths at a lamp. The test is whether a player would ever
  click on it. The 2026-10-07 goat ledges painted the goats in and will be redone; the deep
  pools' fish stay.
- **Doors read like a standing slab, not like a flag (owner, 2026-10-07).** The map is a
  cutaway seen from above; a door slab painted from words should show the way the first good
  one did (the slab's face foreshortened in the cutaway convention, standing in its
  opening). Several second-pass doors came back as a flat upright flag at right angles to the
  map. Say "a door standing in its opening, seen the same way as the walls" and compare
  against a render that got it right before accepting.
- **A stitched super map needs a blend pass at the seams (owner, 2026-10-07).** Tiles
  repainted separately join with a colour ramp only: one tile's water meets another's as two
  kinds of water, and cave rock changes grain at the line. After stitching, the seam band
  gets its own pass that makes the two halves one continuous painting (water one water, rock
  one rock), fitted again afterwards. Until that pass exists, call the stitch a draft.

- **Dress lightly: the walls only know what the pack drew (owner rule 2026-10-11).** A repaint
  keeps the pack's walls, and those walls only enclose what was on the original map. Every solid
  thing the repaint adds to the floor (beds, tables, cabinets, a forge, stacks of crates) has no
  wall, so tokens walk straight through it, which looks wrong to players. An over-dressed map also
  drifts the layout (a heavily dressed family-chambers repaint drifted 62 of 115 tiles). So keep
  new dressing low and sparse: floor-level things a body could plausibly cross (rugs, baskets,
  scattered tools, a firepit ring, bedrolls) and pieces set flush against existing walls. Leave
  the open floor open. When a big solid piece matters (a long table, a pen), either paint it
  where the pack already has a wall loop, or add a movement wall around it after the repaint
  and say so.
- **Dressing a whole scene is one light pass; tiles are for specific fixes (owner rule
  2026-10-12).** When a scene needs dressing throughout (a sleeping area in every room, hearths,
  fungus), do not scatter `prop` tiles across it by hand: on one chambers map that put beds into
  walls and a mushroom in mid-floor. Run ONE whole-map `edit-image` `kind: "battlemap"` that names
  each kind of dressing and where it belongs ("one sleeping area flush against the cave wall, never
  on or across the wall line", "one small hearth in the open middle of each larger chamber", "a few
  glowing clusters at the base of the walls, never in the open floor"), then "keep it sparse and
  low: leave the open floor open, put nothing in the tunnels or narrow passages, add no tables,
  furniture, crates or tall objects". It comes out consistent, and light enough to pass the drift
  check (the drift check flags the new pieces themselves; look at each flagged spot, as added
  dressing is fine and a moved wall is not). Remove the old tiles, then move each scene light onto
  its painted source (a fire's light centred on the flame by a crop) and add one only where the
  map paints a source. Tiles come after, and only for a specific fix the pass got wrong.
- **Closing a corridor is two steps: the wall, then the fade (owner rule 2026-10-12).** Painting a
  rock wall across a tunnel leaves the tunnel's old rims running on to the map edge past it, and a
  hard-edged black block between them; players see both. Second pass on a crop: "remove the leftover
  tunnel rims and the black block; give the new wall's outer side the same soft pale rock shoulder
  fading into pure black as the other outer edges". Blend only the area beyond the new wall
  (feathered), so the wall line and floor that the walls trace stay put, and look again at the whole
  map: a stub often hides further along (one camp map's lower rim needed its own pass).
- **Fine edits are tiles, never another draft of the map (owner rule 2026-10-11).** Once a
  map is painted, a change to one thing on it (put a lamp on the shrine, add a brazier, swap
  a chest) is a separate `prop`, placed as a Foundry tile over the background. Never re-run the
  whole map for it: every full pass redraws everything, drifts the layout (the drift check
  refused a bench swap on a hall map twice) and quietly breaks details it was told to keep
  (the shrine's seven stars went). The recipe: `generate-image` `kind: "prop"` with `footprint`,
  a crop of the map around the spot attached as `role: "style"` so ink and palette match;
  `upload-asset` to `worlds/<world>/assets/tiles/props/<area>/<slug>_<W>x<H>.png`; find the
  spot's centre on the painting (crop it with a pixel ruler), add the scene's `sceneX`/`sceneY`;
  `manage-placeables { kind: "tiles", action: "create" }` sized in the SCENE's pixels (a prop
  renders at 300 px per cell; on a 140 px grid a small object is about 0.6 of a cell), centred,
  and **unlocked** (a locked tile can't be clicked or box-selected on the Tiles layer, so to the
  owner it looks missing; owner, 2026-10-11); move any light that belongs to the object onto it; `screenshot-scene` and look.
  First used for a lamp prop on a hall's shrine.
  **To change or remove something already painted** (close a painted door, paint out a chest),
  the tile is an opaque *patch*, not a prop, because the prop kind cuts to alpha and would throw
  the floor away. Crop the scene image a little wider than the change, run `edit-image`
  `kind: "battlemap"` on the crop, resize the result to the crop, feather its alpha about 50 px
  at the edges (local PIL), and place it at the crop's pixels plus `sceneX`/`sceneY`, unlocked.
  On a small crop the drift check refuses a removal, because the change itself reads as drift. No
  walls trace a patch, so read the kept `-drifted` render and judge it by eye. A patch can also
  hold a *state*: a great door painted open, with a closed-door patch on top for the
  story. Hide the tile (and unhide the daylight light) on the day it opens.
- **Overhead features are the one exception to "never another draft" (owner rule 2026-10-12).**
  Anything a token should pass *under* (shoring beams, lintels, arches, hanging racks, bridges,
  canopies) is painted into a bought map, so a token walks on top of it. Take every one off with
  ONE whole-map `edit-image` `kind: "battlemap"` that names the *kind* of thing and never a
  position: "Remove every wooden shoring beam, timber post and plank on the whole map … Do not add
  any new beams or objects. Keep every lantern and its glow, [the other objects] exactly where they
  are." A five-beam instruction by position on a mine map removed the wrong beams, kept three of
  the five and painted in a new one, and still passed the drift check (it checks layout, not
  content), so judge the result by eye. Then cut each feature from the ORIGINAL map (local PIL): a
  hand-drawn polygon per feature from pixel-ruler crops, dilated about 8 px (`MaxFilter(17)`; 4 px
  shaved the edge off three of sixteen beams) and feathered about 2 px, saved as an alpha PNG at
  its bbox. Composite every cut over the edited map and compare tile by tile with the original
  before uploading; an outline a few pixels off only shows once the tile fades. Install the edited
  map as the background (below) and each cut at its bbox plus `sceneX`/`sceneY` as an overhead
  tile: elevation 20, `occlusionMode` 1 (Fade: the whole tile ghosts while a token is under it;
  the owner preferred it to 4, Radial, which clears only a circle), `occlusionAlpha` 0.25. Check
  with `screenshot-scene` `asToken` and a token moved under a beam. First used on a mine map:
  sixteen timbers, about $0.23.

**Installing a restyled map** (the dnd5e MCP): `upload-asset` the WebP the tool wrote to
`worlds/<world>/assets/maps/<name>.webp`, then `manage-scenes` `update` with `sceneIdentifier`
and `backgroundPath` only. Never pass width, height, or gridSize: the walls are in the scene's
own coordinates, and a scene (v10+) draws its background at the scene's dimensions, so a bigger
or smaller file still lines up. Note the old background path first so the swap can be undone,
and `screenshot-scene` afterwards. Before the swap, draw the scene's walls over the restyle
(the walls are in the campaign repo's scene export, in canvas pixels: subtract `sceneX` /
`sceneY` from `get-scene-dimensions`) and look: proven on a lair map, live on the hosted world
2026-10-02, all 934 walls and doors on their painted edges. Only after the owner has approved
the map. About 15
cents a map, 30 with a drift retry.

**Props** (the owner's prop library, mostly Tom Cartos at 300 px per
grid cell). Refreshing one is `edit-image` `kind: "prop"` with the repaint wording (`repaint this
prop at much higher quality in <the shelf's prop finish>, with fine painted detail on its materials`);
the result comes back at the source's exact pixel size with the new art in the original's box,
so it replaces the file one for one. A new prop is `generate-image` `kind: "prop"` with
`footprint` from the file-name convention (`TC_Anvil 02_2x1.png` is `"2x1"`). Never run a prop
as a `token`: the token wording adds people. Name the colours when they matter; an oak drifted
toward teal once.

If the user named a subject that exists in the world (an NPC, a location with a journal, an
item), the next two steps are **mandatory** — never prompt from imagination for a named subject.

## Step 1 — Ground the prompt in canon

Pull the authoritative description before writing a word of prompt:

- **Actors**: `manage-actors` `get` — bio, race/species, gender, age, class, notable gear. The stat block is
  canon for props (a bandit statted with a crossbow gets a crossbow, whatever looks cooler).
- **Items**: the item's description and type. An icon of a "rusted iron key" is a rusted iron key,
  not a generic key.
- **Locations / events**: `search-journals` for the subject name; scene notes; quest journals.
- **Campaign repo** (when working in it): `notes/`, `plot/`, `sessions/` often carry richer
  description than the world does.
- **Scenes of played events are a hard gate (owner rule)**: illustrating something that happened
  at the table means reading the session diary page AND the session transcript/gm-notes
  (`sessions/<date>/`), and **looking at the battlemap it was fought on** (`screenshot-scene`, or
  read the scene background) — terrain, layout, and the fight's actual beats come from there,
  never from imagination. Who was present matters too (absent PCs don't appear).
- **Arm the scene for the RIGHT session**: a fight from session 1 predates the party's later
  magic items. Check that session's own loot ledger before putting a weapon in anyone's hand.

Extract the **paintable facts**: species, gender, age, build, clothing, signature props, mood,
lighting, time of day, weather. These become the prompt's spine.

**Where canon is silent, don't silently invent.** For a named NPC whose bio never mentions hair
color, either ask, or propose ("canon doesn't say — I'll go with grey hair in a bun unless you'd
rather") and note what was invented so it can be written back into the bio. Generic subjects
("some bandit") invent freely.

**READ THE TOKEN ART, not just the bio** (learned the hard way 2026-08-28): bios routinely omit
appearance. One PC's bio never mentions his hair; four generations shipped an invented brown
before his token settled it as white hair, a full white beard and a green-crystal staff. Tokens live at
`%LOCALAPPDATA%/FoundryVTT/Data/worlds/<world>/assets/tokens/<name>.png` — the path is in the
actor's `prototypeToken.texture.src`. Open it before writing a word of prompt.

## Step 2 — Study precedent, then attach it as references

All campaign art should feel like one book. On this backend that is done with **reference
images**, not with words alone and not with trained weights.

**The campaign's reference shelf lives in the campaign repo, at `art/SHELF.md`, not in this
skill.** Read it first, every time. It records the approved identity anchors (one file per PC
with the binding phrase to use in the prompt), the standing style shelf, which older files are
superseded and must never be attached, the house finish words, and the staging path. This skill
is generic; the shelf is what makes it one campaign's. If the repo has no `art/SHELF.md` yet,
build the shelf from the `art/` folder and the world's assets as below, then propose committing
one so the next session does not have to.

- `list-assets` on `worlds/<world>/assets/art`. Read the filenames: the `<kind>-<slug>-<id>`
  convention tells you what exists and for whom.
- `download-asset` (or read the campaign repo copies) of the 2–3 pieces closest in subject, and
  **look at them**: palette, rendering style, framing, lighting mood.
- For actor art this is a **hard gate**: when the actor has existing art (`hasImage`), get the
  actual file (`manage-actors` `export` → `img` / `prototypeToken.texture.src` → `download-asset`) and
  **Read it** before writing the prompt. Backstories rarely state appearance facts the art
  settles. One canon orc has bone-white skin his backstory never mentions; the first portrait
  shipped green. Keep continuity with the existing art unless the user asks for a redesign.

**Three kinds of reference, passed as `references: [{ path, role, label }]`.** The tool attaches
them in order and writes a preamble that binds each one by its 1-based index and label, so your
prompt can simply say the character's name and be understood:

- **Character references** hold identity. Both tiers take them (Flash up to 4 characters, Pro up
  to 5). Bind each one with an unmistakable prompt phrase so the model knows which figure is
  which. The tool binds them to features, hair, skin, build and kit only (2026-10-16): pose, head
  angle and camera come from the prompt and the source, so a crop already at the angle you want
  beats a frontal portrait, which used to drag a token's head toward the camera.
- **Object references** hold one thing to reproduce: a crop of a weapon head, a shield face, a
  scarf, an orb (Flash up to 10, Pro up to 6). Label each and say where it goes ("the axe in the
  fist at the lower left is Image 3"). Gear that was only described drifted; gear that is shown
  is copied (2026-10-16): a dwarf's axe head and shield and a bard's lute and scarf came through
  from crops with the head and pose untouched.
- **Style references** hold the house look. The docs say Pro only, up to 3, but they work on
  Flash in practice (spike 2026-09-19; the whole 2026-09-19 batch was Flash and held the look).
  Attach the standing style shelf (from `art/SHELF.md`) on every portrait and illustration
  call unless the owner asks for something deliberately different.
- **Tokens take the world's own tokens as the style reference** (words-only and restyle routes
  only; the mannequin route in Step 4 takes the character's portrait as a head-to-waist crop
  for `character` with `headAnchor: "bust-2-green"` beside it, and crops of signature gear as
  `object`, never a style image). They are top-down full-body
  figures on transparency (`assets/tokens/<name>.png` in the world data). Attach one as
  `role: "style"` and the new token comes out at the same angle and in the same look.
  The tool appends the framing and the chroma plate sentence itself, picks a plate colour the
  subject will not share (it samples the references AND reads the prompt for colour words, so a
  green dragon prompted against a grey token gets a magenta plate), cuts the result to alpha on
  a 512 square, and keeps the plate PNG beside it. Read the `*_preview.png` it reports before
  trusting the edge.

**House finish words come from the shelf too.** With style references attached, words reinforce
the images; they are not a substitute for them. One lesson holds everywhere: "gleaming" invites a
glossy studio sheen; describe armor as `worn … with a soft dull sheen` instead.

## Step 3 — Craft the prompt (the cookbook)

Rules that have held across every model tried. Anything specific to the old local models was
dropped on 2026-09-19; re-earn phrasing lessons on the new backend before writing them here.

- **Say the identity outright**: "old halfling woman innkeeper, grey hair in a neat bun" — never
  a bare pronoun or a species adjective doing the work.
- **Describe props concretely**: "crossbow" drifts into muskets; "wooden crossbow with a drawn
  string" holds. Stat-block gear gets described, not named.
- **Never say "book art", "cover", or "poster"** — that paints title typography and plate
  borders. Style lives in the shelf's finish line, never in a product word. The exception
  is a deliberate text prop (a real wanted poster), which is a Pro illustration.
- **Tokens** (humanoids go the mannequin route in Step 4, whose recipe replaces this): describe
  the creature and its pose only. Never write framing, angle, or
  background words; the tool owns those and vaguer plate wording made Flash paint a green DISC
  on white in the spike. The shelf's token finish words in the prompt reinforce the
  world-token style reference.
- **Icons**: the tool appends "single subject centered, filling the frame, no text, no border";
  you supply the STYLE, or the render comes back photoreal. The set prefix is the shelf's icon
  finish line, in the proven shape `fantasy RPG inventory icon, <the shelf's finish>, <its light>,
  rich mid-tones and soft shadows, plain dark vignetted background. Subject:`, then the object
  with its material ("rusted iron key", "worn oak longbow"). Same prefix for every icon in a set
  so they read as a set; twenty in a row held on Flash.
- **Negation backfires — describe presence, never absence** (proven twice, 2026-08-28). "no large
  tusks" DRAWS large tusks; "no beard" GROWS a beard. Say what IS there instead: "his chin and jaw
  and upper lip are smooth bare hairless skin".
- **The garment NOUN overrides any clause describing it** (proven 2026-08-28, an elf archer's sleeves). A
  "jerkin" is sleeveless whatever you say about its sleeves. Pick a garment noun that already
  implies the silhouette you want, and layer: "a grey-brown wool shirt with long sleeves underneath
  a closed leather vest".
- **"Shoulder caps" / "pauldrons" render as STEEL even in an all-leather prompt.** Say "leather
  vambraces" and leave the shoulders out.
- **Gendered features must be stacked, not stated once**: a lean build + smooth young face
  rendered a canon male elf as a woman despite the word "male". Add redundancy — "a man, a male
  elf" plus a strong square jaw and heavy brow.
- **Change one axis per render.** Rewriting the face clause and the body clause together is what
  costs the likeness. With `edit-image` this is natural: one instruction, one change.
- **Species proportion is a losing fight in a waist-up crop**: facial structure works better
  than size words, and a scale cue in frame beats both.
- **Translate canon into the model's vocabulary — never prompt in-world proper nouns or
  mechanics** (owner rule 2026-08-26). The generator has never heard of First Light, the Maul of
  Momentum, or Spellfire; naming them does nothing or free-associates garbage (a "rose-gold
  blazing" sword rendered as a pink lightsaber). Canon decides WHAT is true; the prompt says only
  what a camera would see: "First Light" → "a longsword catching warm dawn-colored light";
  "spellfire" → "silver-white fire"; "displacement" → "a ghostly after-image a step to one side".
  Keep effects modest — over-described glow becomes neon.
- **Compose inside the entity ceiling.** Past roughly six distinct subjects any model collapses
  into a posed lineup facing the camera, duplicates faces, and floats weapons. The full-party
  group shot is the HARDEST genre and a rare set-piece. Default to **duel/vignette compositions**:
  1–2 party members + one enemy + one landmark, one directional action, hero large and central.
  Give every party member exactly ONE unmistakable action clause; describe enemies with
  contrasting features so a reference face does not land on them.

## Step 4 — Run the loop: generate, look, edit

0. **The chat IS the gallery (owner preference — browser-pane previews don't work for them).**
   Reading a PNG renders it inline, so curating by reading doubles as showing the owner every
   candidate. Finals additionally go out via `SendUserFile` so they get a card.
1. Cold start? `imagegen-status` first: key present, models reachable, spend so far.
2. **Flash by default, Pro on request (owner rule 2026-09-19).** Every kind runs on Flash
   with no confirm. When the owner asks for a portrait or an illustration, say once, in one
   line, that Pro is available for a bit extra (about double: 13 cents at 2K, 24 cents at 4K)
   and carry on with Flash unless they take it. Pro earns its cost on crowded multi-figure
   scenes and text-heavy handouts; it is not a better fixer. `tier: "pro"` needs
   `confirmPro: true`, which you pass only after the owner said yes.
3. `generate-image` with the canon prompt and the references. Two or three candidates for
   portraits and illustrations, one for icons and tokens (they one-shot well; re-roll on a miss).
   Every result reports `estimatedUsd` and `sessionEstimatedUsd`; `imagegen-status` totals by
   tier. The API has no balance call, so these are estimates from the price table.
4. **Read every PNG, twice.** First against canon, not against "is it pretty": wrong gender,
   wrong species, wrong props, wrong mood are **rejections** even on beautiful renders. Then
   **the flaw pass (owner rule 2026-09-19)**: scan the image deliberately for the defects these
   models make and a viewer spots instantly. Count them out loud in your head:
   - **Limbs and digits**: legs per creature (a peryton has two; a wolf four), arms per figure,
     fingers on visible hands, feet that touch the ground.
   - **Duplicated effects and props**: one spell, one effect. A stray second fireball, a floating
     extra weapon, a second bow, a sword with two hilts.
   - **Faces and identity**: every referenced character present once, no reference face on an
     NPC, no twin of a party member in the background.
   - **Signatures and text**: scribbles in a corner, lettering on banners, watermark-like marks.
   - **Objects that make no sense**: a shield strap to nothing, a staff passing through a body,
     a reflection that does not match.
   **The server counts tokens and portraits for you, against the book** (owner rule
   2026-10-16): pass `anatomy` on every token and portrait call, one line from the Monster
   Manual ("two arms, two legs, one large eye, no tail"; "a mushroom with exactly four tendrils
   and no limbs"), and the result's `anatomy` reports the judge's count, each flaw placed in the
   picture, and for a token which edge the head points to with the rotation that fixes it
   (Foundry's front is the top). Read that report before the flaw pass and count anyway: the
   judge can be wrong, and it never fixes or refuses. A `rotate` on a token is a Pillow turn of
   the PNG, never a re-render.
   If any of these is **obvious**, it goes through `edit-image` in one instruction that names
   every flaw precisely and ends with "keep everything else identical", then gets Read again.
   Two edit passes at most; if the third read still shows it, re-generate instead. **Name the
   flaw anatomically, not by count.** "Every peryton must have exactly two legs" failed twice,
   once on Pro; "delete the rear pair of legs trailing behind its front talons, leaving two bird
   legs and a feathered tail" worked first time on Flash. Pro is not a better fixer, and it
   re-cropped the image (2026-09-19); stay on Flash for edits and say precisely what to remove. Subtle
   softness is not a flaw; an extra leg is. **The pass is mandatory every time; the edit is
   not.** A render with no obvious flaw is finished. Do not touch it to make it "better";
   every edit re-rolls the pixels and can introduce a new flaw.
5. **Edit before re-rolling.** A candidate that is right on canon but wrong on one detail goes
   through `edit-image` with a single instruction ("swap the sword for a hand axe", "make the
   cloak forest green"). Edits default to Flash for every kind and hold identity, pose, angle,
   and style (an orc token took new plate armour and a crackling maul in one pass). Re-generate
   only when the composition or the identity is wrong. Editing an existing WORLD token is the
   normal way to change a PC's gear: source the token file, describe the change, and the result
   is already cut. **Write token edits the way the owner types in the Gemini app**: one plain
   sentence ("give this elf a sword and armor instead"), no "keep everything identical", no
   angle or background words. The tool adds a keep-face/hair/angle line and a plate keyed to
   the token's colours; a light prompt beat the strict wording in the elf A/B (2026-09-24).
   **Refreshing an old low-res token** ("upscale this", "give it a finish pass") is the same
   call with this instruction shape, proven on a bronze dragon (2026-09-24):
   `give an updated and upscaled <the shelf's token finish>. Sharpen and refine every detail: <three or
   four details named for THIS subject>, clean confident edges, no blur or pixelation`.
   Read the token first and name what it has: scales, claws and spines for a dragon; fabric
   folds, fingers and facial features for a person; fur and teeth for a beast. Ask for existing
   detail to be *sharpened*, never for new detail to be *added* ("redraw", "add fine texture"
   drifted the palette and lost the glowing eyes), and never ask for rim light, glow, or an
   outline on a token: they come through the cut as a fringe. Do not write "remove shadows" or
   "white background"; the tool appends the shadow line and the chroma plate itself.
   **A refresh only works on a good source.** An edit keeps the source's drawing, so a weak
   token (flat shading, stiff pose, clip-art proportions: most of the `_Free & Lower Quality`
   shelf) comes back as the same weak drawing with sharper lines (20-token test, 2026-09-24).
   **Fidelity to the original comes first (owner rule 2026-09-24).** A refreshed token keeps
   the original's pose, silhouette, design, and colours; only the quality of the drawing
   improves. Too much deviation is unacceptable: a gnome regenerated from a faithful
   description of his token was rejected because his pose, proportions, and look changed.
   So an existing token is ALWAYS reworked with `edit-image`, never regenerated from words.
   For a weak source, push the repaint harder while pinning what must not move:
   `repaint this token at much higher quality in <the shelf's token finish>: keep the exact pose,
   silhouette, design, colours and camera angle, but redraw the anatomy, faces and materials
   properly with fine painted detail`. Tested 2026-09-24: faithful on a gnome, an assassin, a
   stegosaurus, a guard commander, and all four PCs, with clear gains on the weak ones and a
   light polish on good art (the party's tokens barely changed, so do not spend on good art).
   One slip: a cream cat came back Siamese-coloured; name the colours explicitly when they
   matter.
   **Default for every humanoid PC and NPC: the mannequin route (owner, 2026-10-15).** A
   library of 312 grey HeroForge captures lives in this repo under `mannequins/` (its README is
   the shot list; `npm run mannequin -- grid` lists it from the files). One `edit-image` call,
   kind `token`, `source: "mannequin"`, flash, the capture as `sourceImage`, turns a capture
   into a finished token at about 3 cents: the tool binds pose, proportions and grip to the
   capture, sets the camera itself, the owner's standard (2026-10-16): a 90-degree
   orthographic top-down body, and carries the head by a grey bust it attaches at the wanted
   tilt, the same universal anchor for a PC and an NPC; the words supply race, sex, age, face,
   kit, colours and finish, and never a word about the head. **A known character also gets
   references: the portrait's head-to-waist crop as `character` with `headAnchor: "bust-2-green"`
   on the call, and crops of its signature gear as `object`** (below). A new NPC with no
   portrait is words alone. About 120 test renders
   (2026-10-15) and the first real run on the four PCs (about 50 renders, 2026-10-16; the record
   is `notes/mannequin-tokens/PLAN.md`) came out usable on the first pass almost every time;
   the PC run is what added the reference and the guide sentence. The
   words-only `generate-image` route stays for creatures with no humanoid body (a beast, a
   flying sword, an ooze); a library restyle stays for the case where the owner wants one exact
   library token kept.
   *Picking the capture.* File names are `mannequin-<body>-<sex>-<pose>[-<setup>].png`. Choose
   in this order:
   (1) **Pose.** `combat` (a low lunge from steeply overhead, the fighting default), `stand`
   (upright, camera in front and above, chest and face showing: idle, casters, civilians, worn
   gear), `twohand` (both fists on one shaft), `dead` (on the back, arms out), `prone` (knocked
   down on the knees). A set of condition tokens for one character is one capture per pose with
   the same description reused; the character stays recognisably the same.
   (2) **What the hands hold.** The setup is picked by grip, never by class. Combat:
   `spear-shield`, `dagger-shield`, `sword-shield`, `longsword-kite`, `sword-open`,
   `longsword-open`, `empty` (one fist low, one hand high: every caster, monk, unarmed),
   `crossbow-hip`, `crossbow-down`, `bow`, `twodaggers`, `sword-dagger`. Stand: `dagger-shield`,
   `dagger-open`, `empty` (closed fists), `open` (open spread hands), `bow`, `bow-draw`,
   `shortbow-draw`. Twohand: `right` (blade at the right shoulder), `left` (at the left side,
   body twisting), `staff-level`, `staff-diagonal`, `staff-brace`. Dead and prone have no
   setup. Take the *shortest* blade that fits: a weapon grows in words (a dagger became a
   longsword three times its length) but never shrinks. A shield capture also covers no shield:
   remove it by naming its parts.
   (3) **Body and sex.** `human` (every human-sized race: elf, tiefling, dragonborn, half-orc
   all came out clean on it), `dwarf`, `small` (halfling, gnome, goblin, kobold), `large`
   (goliath, bugbear, ogre), `orc`, `elf`; each `male` and `female`. The body sets build and
   mass, which words cannot change (a dwarf on the human body came out tall); face, ears, tusks,
   skin and hair come from words on any body. Scale does *not* carry: every token is fitted to
   its square, so a halfling fills its cell like anyone; size on the map is `creatureSize` and
   the actor's token size.
   *The recipe.* One instruction, in this shape, with the campaign's finish line from its
   `art/SHELF.md` at the end, and `source: "mannequin"` on the call: the tool then carries the
   mannequin guide, the camera, the head anchor and the no-grey rule, so the instruction says
   none of that, and nothing about the head, the angle or the camera, ever. For a known
   character, attach the portrait's head-to-waist crop as `references: [{ role: "character",
   label: "<Name>" }]` **and pass `headAnchor: "bust-2-green"`**: the bust then carries the head and
   the crop is bound to identity only (features, hair, skin, build and kit). Add each signature
   piece of gear as `{ role: "object", label: "<the axe>" }`, cropped from the approved art;
   the tool binds each by its image number, so the instruction only names them. For a new NPC,
   describe the face in full instead and attach nothing: the tool attaches the bust by itself.
   `Paint it as <Name> (Image 2), <race, sex, age, build, skin, hair, eyes; horn shape if any>,
   <anything the mannequin lacks: ONE tail curving out behind to the lower left only, wings
   folded, a hood>, in <his|her> <clothing and armour, materials and colours, always the
   footwear>. Replace
   the entire <weapon> in <his|her> fist at the <lower left>, keeping only the fist's grip and
   the line it points along: none of the old <blade, crossguard, pommel> remain. The new weapon
   is <each part, grip to tip>. Replace the entire shield, keeping its exact position and angle
   on the forearm, held naturally: none of the old round disc, round rim, studs or arm straps
   remain, and nothing round is left. The new shield is <shape, material, emblem>. <Any held
   light or magic, named as the key light>. <The finish line>; nothing left grey clay.`
   The rules behind it, each one paid for:
   - **A known character takes the portrait's head-to-waist crop as `character` beside the
     bust (owner, 2026-10-16 and 17).** Sixteen words-only PC tokens came out 15 of 16 usable,
     and the owner rejected them: the likeness drifted. A head-to-waist crop of the portrait as
     `character` fixed every face and pulled the kit toward the portrait too (plate, shield
     boss, leather, scarf, robe), and then the head review showed it was also the strongest
     pull on the head: a render leans toward the head tilt of whatever reference carries a
     head, and a frontal portrait crop bound on its own lifted faces to the camera. The fix is
     not to anchor PCs to their old token heads (the owner ruled those were luck, not a
     standard) but to put the bust beside the portrait: with `headAnchor: "bust-2-green"` on the
     call the tool attaches the bust after the crop, binds the crop to identity only, and the
     bust wins the head. The universal run (2026-10-17, 02:16; 8 renders, $0.51; `headtest/2026-10-17-02-16-universal/`,
the sheet on the Desktop as `PC Tokens/headtest-2-universal-sheet.png`): 6 of 8 first renders in
the band, 8 of 8 after steering, every face a clear likeness of its portrait and no camera drop.
The heads sit at the low end of the band with the portrait beside bust-2 (six `down`, Lysandra's
stand `up`): Kartor's stand came back `far-down` and landed `down` on bust-3, Lysandra's combat
`far-down` twice and landed `up` on bust-4. The bust-2 NPC run centred on `right`, so a portrait
beside the bust pulls the head a step lower; whether the universal route should default to bust-3
is one `--universal --bust 3` calibration run away (eight renders, about $0.35).
     Horns follow the crop rather than the words, so restate the horn shape when it matters. A
     `character` reference with no `headAnchor` is bound as an approved token head instead (it
     carries its own tilt, no bust); that route is kept for a head the owner has ruled on, and
     is not the default. **A portrait with hair over the brow bows the head** (one PC,
     2026-10-17: seven renders with his portrait beside bust-3 and bust-4 came back with the
     hair over the eyes; words-only on bust-2 with "hair pushed back off his forehead so his
     brow and both eyes are clear" landed first time). For such a face, drop the portrait,
     describe the hair off the brow, and let the bust carry the head. **An instrument or a
     large object cradled across the chest drops the camera** to a front-and-above view; sling
     it on the back or hold it by the neck at the side.
   - **Never attach a whole image beside the mannequin.** A full style token or a full portrait
     gets its subject copied in (a wizard and a harpy came back as the attached drow). The crop
     rule above is the only exception: a crop, bound to the face and kit, nothing else.
   - **The mannequin's guide line lives in the tool (2026-10-16).** `source: "mannequin"` writes
     it: pose, camera, proportions and grip bound to the capture, the head described, nothing
     left grey. "Keep the mannequin's exact pose" and the softer guide sentence bought the same
     pose side by side in the first real run; the tool's line is the firmer of the two, and the
     instruction no longer says any of it.
   - **The camera is the owner's standard, set by the tool and the capture (2026-10-16,
     2026-10-17).** Tokens are seen from straight above at the table, so the standard is a
     90-degree orthographic body (the shoulders and crown the largest shapes, feet beneath the
     body). In the ortho test (Kartor and Cecil, stand and combat, sixteen renders) that wording
     landed eight of eight and the owner called it perfect. Every mannequin capture is shot
     straight down at that same camera, and the tool's `source: "mannequin"` lead sentence
     binds the body to the capture's camera strictly; the words-only token framing carries the
     same camera. The instruction says nothing about the camera, and a capture shot from any
     other angle is re-shot, never corrected by words. Compare every render to the target in
     the flaw pass anyway, and name the footwear: the mannequin is barefoot, and a figure
     described without boots came back barefoot. On `prone` and `dead` the pose words win
     ("knocked down onto the knees", "lying dead, eyes closed") and the camera line does no
     harm.
   - **The server carries the head; the recipe never mentions it (owner rule, 2026-10-16).**
     The owner's standard for every standing or combat token: the head faces the way the body
     faces, tipped just enough toward the camera that brow, eyes, nose and mouth read, hair
     over the top half of the head, never the face lifted to the camera (chin underside,
     throat), which the owner dislikes most. About 95 renders that day showed that words about
     the angle (absolute lines, degrees, gaze targets, edits, "exactly as the mannequin's head")
     fail, and that a render leans toward the head tilt of any reference that has a head. So
     the head is an image: with no `character` reference the tool attaches a grey HeroForge
     bust at the wanted tilt (`mannequins/heads/bust-2-green.png`: bust-2, the middle of the owner's band, with the capture's green eye marks in its sockets; the pipeline's bust since 2026-10-17)
     after your references and binds it as a dial; with one, the reference is the approved
     token head and carries the tilt itself. Then a check model grades the plate beside five
     crops the owner ruled on (`mannequins/heads/band/`, one per step) on five steps, `far-down`, `down`,
     `right`, `up`, `far-up`, plus `camera-dropped` and `unclear`; `down`, `right` and `up` are
     the band and deliver, and a second, eyes-only call asks whether both eyes read, the owner's
     criterion (2026-10-17): a `no` with the tilt in band is fixed by one edit on the plate, the
     eyes opened and nothing else changed (14 of 14 opened on the fourteen it was ruled on, the
     pose kept on every one), and only a second `no` re-renders on the next bust; `head` reports
     `eyes` and `eyesEdited`. Over-opened eyes ("bug eyes") pass the gate: look for them in the
     flaw pass. `far-down` is rendered again with the
     next bust up (bust-3 at least), `far-up` with bust-1, a dropped camera once unchanged, at most two retries, every
     kept plate named `-head<n>-<verdict>.png`, and the result's `head` reports `verdict`,
     `inBand`, `anchorUsed`, `first`, every verdict and the kept plates. Two bad verdicts still
     deliver, flagged, because the check can be wrong (re-cut 2026-10-17 from the owner's blind rulings: every
     rejected head caught over three passes, two accepted NPC heads sent for a re-render):
     read `head` before the flaw pass; a delivered `far-up` or `far-down` is a re-render, not
     an edit. `camera-dropped` twice comes with `advice`: change the capture, not the words
     (Cecil's combat dropped the camera three times on `combat-empty` and landed first time on
     `combat-dagger-shield` with the shield removed). `unclear` with an `error` means the judge
     was not reached and the token went through unchecked; `unclear` without one is a lying,
     hooded or helmeted figure, which is fine. `headAnchor` picks another bust ("bust-1" to
     "bust-4", or "none") and `headRetries` caps the retries; neither is needed in the ordinary
     run. **Never put head wording in the instruction, and never attach a frontal head (a
     portrait crop as `character`, a frontal token head as `pose`)**: both pull the face to the
     camera. Every change to the head path runs through `npm run headtest` in the server repo
     (a fixed set, a contact sheet with every verdict, the hit rate inside the band), never one
     render at a time.
   - **The dwarf `dead` capture loses the dwarf build**: twice it came back lean, older and grey,
     with and without the crop. One flaw pass naming build, age and hair fixed it both times;
     expect it.
   - **Dropped gear on prone and dead**: "lying dropped on the ground beside the fist at the
     <left|right>" landed every time. On the dwarf `prone` capture a haft clipped the frame twice
     until written "tucked close under the fist, haft no longer than his forearm".
   - **Name hands by where they sit in the image** ("the fist at the lower left"), never left
     and right; the model reads those both ways, and even image sides are honoured only most of
     the time (a mirror reads the same on a token, so let it go).
   - **Repaint keeps what is not named; replace renames every part.** "Repaint the spear as an
     ash shaft" kept the old grip and butt cap half the time; "replace the entire spear ... none
     of the old butt cap, ring bands, wrapped grip or collar remain" left nothing. Repaint keeps
     shape and ornament too: a curved dagger stays curved, a carved bow keeps its carving,
     unless the old shape or ornament is named for removal.
   - **A closed empty fist takes a written weapon; an open hand does not.** The standing
     `empty` capture took a sword written into the fist first time; weapons written into open
     hands gripped badly three times in four. An open hand is for a spell, a lantern, a torch, a
     tankard, or nothing.
   - **Shields change freely**: reshaped (heater, kite, tower, buckler), resized both ways,
     removed, or added where a weapon was. Emblems read when the capture's shield faces the
     camera (the standing captures, `longsword-kite`); edge-on shields hide their face.
   - **Worn gear works from the standing camera**: a sheathed sword at the hip, a backpack with
     its bedroll above the shoulders, a greatsword or a shield slung on the back. On the prone
     capture, gear on the back rises over the bowed head; lay it on the ground instead.
   - **Full-draw bows** render in character and never clip, but the string stays straight tip
     to tip; a fix pass did not move it. Accept it.
   - **The twohand `left` stance straightens on stocky and small bodies**; prefer `right` for
     dwarves and small folk.
   - **One render in about twelve loses the figure's scale** (a sickle came back at half size).
     Compare figure size to the mannequin in the flaw pass; a shrunken figure is re-rendered,
     since an edit cannot grow it back.
   - **Fix a fault with one flaw pass on the render**, naming the one thing and ending "keep
     everything else identical". Never re-roll a good pose. Variants (wounded, cloaked, darker)
     are edits of the finished token, and the pose holds.
   - **A batch spreads across poses (owner, 2026-10-16).** The extra poses and setups exist so
     that several tokens made at once (a guard post, a goblin warband, a tavern's regulars, a
     cult) do not share one capture. Read the intent, then pick a spread that matches it: a
     watch post gets `stand-dagger-shield`, `stand-bow`, `combat-spear-shield` and
     `twohand-staff-level`; a warband gets `combat-sword-open`, `combat-twodaggers`,
     `combat-bow`, `combat-spear-shield` and a `twohand-right` champion; villagers get `stand-empty`,
     `stand-open` and `stand-dagger-open` with tools written into the hands. Vary body and sex
     within the race too. Reuse a capture only when the group is meant to look drilled and
     identical (a line of the same soldiers), and say so.
   - **`thinking: "high"` bought nothing on tokens (2026-10-16, two pairs).** Both render tools
     take it and report `thinkingTokens`; Nano Banana 2.1 thinks at medium by default, about 600
     to 1600 tokens a token render, under a cent. At high the counts stayed in the same band,
     one PC came out the same and another's stance drifted into a lean the mannequin lacks. Leave
     it unset for tokens.
   **Drawing a token from words** (`generate-image` kind `token`, flash: the pose written as a
   camera would see it, a face crop as `character`, one finished token as `style`) is now the
   route only for non-humanoid bodies. It matched pro side by side, so pro is not the lever.
   Library restyles are for the case where the owner wants one exact library pose kept;
   everything below about bases applies to that case only.
   **The camera angle is the base token's, and no edit changes it (owner, 2026-10-11).** When
   a library token becomes a campaign NPC, pick a base that is already steeply overhead (head
   and shoulders large, legs tucked under), because the restyle keeps whatever angle it has.
   A `character` reference (a portrait) makes it worse: it drags the face toward the camera,
   and on the canvas a frontal figure reads as lying on its back. For one key NPC,
   six passes of angle wording and `pose` references on a frontal base
   failed. Restarting from an overhead library token, restyled from a written description with
   only a `style` reference (another NPC's finished token), fixed it in two calls. If the angle
   is wrong, start over from a better base; don't keep editing.
   **Search the library by pose, never by race (owner, 2026-10-14).** The restyle changes
   species, skin, hair, horns and gear in one pass; it never changes the pose or the angle. So
   read file names across every race folder for the *pose* the character needs (a sword in
   one hand and a spell in the other, crouched overhead, standing idle) and take the
   best-angled base whatever it was drawn as: a male human warlock base makes a better tiefling
   woman than a tiefling base in the wrong stance. Two restyles from a well-posed base beat
   five edits on a badly posed one.
   **Never edit anatomy; re-base instead.** A "fix the leg" edit redrew a splayed leg and left
   the old one in place: a three-legged figure that passed a careless flaw pass (2026-10-14).
   After any limb or pose edit, count legs and arms on the preview again, out loud. If a
   base's limbs are wrong, pick another base.
   **Size a weapon when it first appears; an edit will not resize it.** "Make the sword longer"
   failed four times on a drawn blade, with and without a reference, once its tip touched the
   frame. Going back one step and drawing the sword into the empty hand with its length written
   out ("a long hand-and-a-half sword, the blade longer than her arm and torso together") worked
   first time (2026-10-14). Same for any prop whose size matters.
   **A pose the owner hands you is sacred: restyle it in light passes, never one big one
   (owner, 2026-10-14).** Three bases the owner chose came back in different poses because
   each instruction asked for seven changes at once (face, beard, hair, armour, shield, weapon,
   cape) plus a frontal portrait crop as `character`; past a few changes the model redraws the
   figure in its default stance, and a frontal face reference pulls the camera frontal. What
   held all three poses exactly: no character reference, and three edits in a row, each opening
   with `keep the exact pose, body position, limb placement, camera angle and silhouette;` then
   one group of changes: (1) head and weapon, (2) armour, shield and cloak, (3) the refresh
   wording above with the subject's details named. Put the base and each pass side by
   side before showing anything, and compare the *pose*, not just the kit.
   **But quality comes from words, not from a base (owner, 2026-10-14).** The pose-locked passes
   above hold a pose; they cannot lift a flat library ink to the finish of a token the model
   drew itself, on flash or on pro (six passes, two of them pro, all short of the bar). A
   `pose` reference does not help either: given a finished token as the pose, generate copied
   its drawing wholesale. What matched the bar first time: `generate-image` kind `token` from
   a written pose ("seen from steeply overhead, he crouches low and leans forward into a
   charge toward the viewer ... axe gripped low in his right hand ... shield on his left arm
   held out beside him"), the portrait's face crop as `character`, and the character's existing
   high-quality token as `style`; flash and pro came out level. So: when the owner wants a
   *pose* kept, edit the base in light passes; when the owner wants *quality*, write the pose
   and generate fresh, on flash.
   **Generate from words only for a creature the library does not have** (a flying sword, a
   new NPC) or when the owner asks for a redesign. The tool's framing covers both body plans:
   upright figures face up, four-legged and crawling creatures are seen along the back in a
   walking stance. **Never attach a second image beside a source**: a style token got its
   subject copied (a wizard and a harpy came back as the drow style token; a bear and a hound
   given each other as style references swapped bodies).
   **A different creature in an existing token's pose is an edit too**: `turn this rat into a
   red squirrel: <colours, markings>, keeping the exact pose, body position and camera angle,
   repainted at high quality in <the shelf's token finish>` on the rat's token gave the rat's exact
   crouch and tail curve (2026-09-24), the same as `role: "pose"` with a description. Use the
   edit; the pose role is a fallback.
   **Glow and aura effects are a cutout weak spot**: a soft glow painted over the chroma plate
   picks up the plate colour (an electric eel's yellow lightning came back fringed pink on a
   magenta plate). Read the magenta preview hard on anything with lightning, fire, or an aura.
   **Nothing ever clips off a token (owner rule 2026-09-24).** The tool re-renders a token whose
   subject touches the frame edge and refuses after a second clip; when it refuses, rewrite the
   prompt with a compact pose (weapon held close to the body, wings folded, tail curled in)
   rather than retrying the same words. Check the edge in every flaw pass anyway: a long spear
   or a whip can reach the margin without crossing it.
   **Long thin objects shrink under the margin rule**: "a flying longsword" came back as a small
   upright dagger (2026-09-24). Say the length and the lay explicitly: "a long two-handed
   longsword, laid diagonally from one corner of the frame to the other".
   **Glows**: the tool moves any prompt with a glow word (glowing, fire, lightning, sigil, aura)
   off the magenta plate; a see-through glow still mixes in some plate colour, so a gold sigil
   can come back a touch yellower. Name its colour in the instruction.
   **Read the file name first; it is prompt material.** The owner's token library
   names files `Category - Subject`:
   the category is the creature type ("Fiend -", "Undead -", "Giant -"), `M_` / `F_` is the
   gender, and the words after it are the role or variant ("archer", "Ripper", "Pale_brute",
   "armored", "flying") that a 400 px image may not show clearly. `_hi` and trailing numbers
   are resolution and variant markers, not subject. Keep the original name beside any working
   copy: "Beast - Wolf Spider" was once shortened to "wolf" and mislabelled.
6. **Self-review is mandatory before showing portrait or illustration art** (owner rules
   2026-08-26 and 2026-09-19): generate → Read (canon, then the flaw pass) → edit or re-generate
   → Read again. Never show a render whose flaw pass you skipped; the owner found a second
   fireball and a four-legged peryton in a scene that had been shown as finished. Show the owner
   only the best surviving render, with a one-line note of what was fixed or rejected on the
   way. Icons and tokens skip the canon critique but not the flaw pass (limb count, symmetry,
   a clean silhouette).
7. Show the user the final (send the file) before or as it lands in the world.

## Step 5 — Stage locally; Foundry only after approval

**Nothing goes to Foundry uncurated by the owner.** Finals land in the campaign repo's staging
area first:

- Copy the finished PNG to `<campaign repo>\art\staging\<kind>-<slug>-<id>.png`. The absolute
  path is in the campaign's `art/SHELF.md`.
- Show the user the file and **stop there by default**. Uploading to the live world
  (`upload-asset`) and wiring (`set-actor-art`, `add-journal-image`) happen only when the owner
  approves — then the file also graduates from `art\staging\` to `art\`.
- Pass `creatureSize: "large"` on any token for a Large, Huge, or Gargantuan actor (1024
  square); everything that sits in one cell is the default (512). Tokens arrive already cut to alpha, shadowless (owner rule 2026-09-24: no
  shadows on tokens; the prompt tells the model to drop a baked one). Read the magenta preview
  the cutout wrote before trusting the edge. For a token from anywhere else, `cutout-image`
  does the same cut. Restyling a world token ("give this an updated finish") is an
  ordinary token edit: point `sourceImage` at the file wherever it lives.
  Installing a token in the world (upload, `set-actor-art`, resetting the inherited prototype
  scale/ring/rotation) follows the dnd5e MCP's `token-cutout` skill, which now holds only that half.
- If canon details were invented in Step 1, offer to write them back into the actor bio/journal so
  the art and the text agree forever after.
- **After a batch is installed, offer the `art-audit` skill** (owner, 2026-10-16): a second
  session's count of limbs, eyes, tendrils, hands and token facing over the whole set, against
  the book, fixed in place by one edit each. The flaw pass above is run by the session that made
  the art, and in one batch of eleven actors it let three flawed pieces through to the table.
