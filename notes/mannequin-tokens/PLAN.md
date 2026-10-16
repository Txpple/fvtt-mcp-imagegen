# Plan: tokens from a mannequin pose library ("mannequin tokens")

The handoff for this work: everything needed to pick it up cold is in this file. Tests ran
2026-10-14 and 2026-10-15 on the Echoes of Halruaa campaign (about forty renders, all flash).
This repo is where the work continues; the campaign repo only receives finished art.

## Goal

A small, reusable library of grey 3D mannequins (top-down captures from HeroForge) that turns
into any humanoid token with one `edit-image` call. The mannequin fixes pose, camera,
proportions and grip; the words supply race, sex, kit, colours and finish. About 3–4¢ a token,
no re-rolls, and every token in a world shares one camera and one scale.

## Why mannequins

- **Words-only tokens drift.** `generate-image` makes detailed tokens from words, but pose and
  camera wander from render to render, the API has no seed, and neither Nano Banana 2.1 nor
  Gemini 3 Pro Image can be fine-tuned.
- **Library restyles inherit the library.** A stock token keeps its pose but also its flat
  drawing and odd angle; edits cannot lift it to the house finish or fix the angle.
- **A mannequin is a pose with nothing else in it.** No style to copy, no face to keep. The edit
  only adds.

Next to the skill's other token routes (`illustration-builder`, token section): words-only
`generate` stays the route for creatures with no humanoid body (a beast, a flying sword); a
library restyle stays the route when the owner wants one exact library token kept. **Any
humanoid whose body is in the library starts from a mannequin.**

## Lessons

### Bodies

| Test | Result | Lesson |
| --- | --- | --- |
| An early, heavily muscled human capture made into a dwarf, and into a woman | The dwarf came out a stretched human; the woman got a man's hands | A body far from the target can't be talked out of. |
| The current human male capture made into a woman, armoured, then bare-armed, same prompt as on the current female capture (2026-10-15) | Armoured: near identical. Bare-armed: both clearly a woman; on the male body the arms and shoulders a little heavier, athletic rather than slight | **One human body covers both sexes.** Write "slender" or "slight" for a delicate build. A female body earns its keep only for many slight, bare-skinned figures, and even then it is a small gain. |
| The human body made into an elf, a tiefling, a half-orc, a dragonborn (male and female) | All clean, first pass; the dragonborn got a full draconic head and a tail the mannequin lacks | One human body covers every human-sized race. |
| The dwarf body made into a beardless dwarf woman | Clean | One dwarf body covers both sexes. |
| Six bodies (large, human, dwarf, small, orc, elf), each sex, made into its own race with one shared kit and finish (spear and shield crouch, 2026-10-15) | 12 of 12 clean first pass; pose, grip, spear angle and relative size all held (the halfling stays small in its token) | **Every body works.** The small and large bodies are proven. |
| The same race on its own body and on the human body: dwarf, goliath, orc woman, elf woman | Elf: no difference. Goliath: near identical. Dwarf: the human body gave a taller dwarf with longer legs. Orc woman: the human body gave a slimmer, lighter orc | **A body earns its place by mass and proportion, not by face or ears.** Words carry ears, skin, tusks and hair on any body; they don't carry build. Keep the dwarf, orc and large bodies. The elf body is optional, like the female human body. |
| A goblin on the small body, a bugbear on the large body | Both clean and strongly in character | The groupings hold: small for goblin-sized creatures, large for bugbear-sized ones. |
| Kicking, jumping, running, kneeling presets, looked at from above | Legs barely read top-down | Only the silhouette reads from above: arms and weapons, not legs. |

### Gear

| Test | Result | Lesson |
| --- | --- | --- |
| A weapon written into an open reaching hand | 3 bad grips in 4 renders (sword held by the pommel, staff through the wrist) | **Weapons go in the mannequin's closed fist**, captured in HeroForge. |
| A HeroForge weapon in the fist repainted across types (sword → runed blade → battleaxe → warhammer) | Perfect grip every time | The weapon changes type freely, but **its length and angle are the mannequin's**. A repaint can't shorten a longsword into a dagger: capture a short blade too. |
| A spear restyled by describing only a new head (noble dragonborn, 2026-10-15) | New head, but the base spear's ringed butt cap, cord-wrapped grip and collar all survived | **Anything not named is kept.** |
| The same spear with every part named and replaced: "replace the entire spear from end to end, keeping only its length and angle in her fist: none of the old butt cap, ring bands, cord-wrapped grip or collar remain", then each new part described | Nothing of the base spear left but length and angle | **Replace gear part by part, by name.** |
| "Repaint the spear as a plain ash shaft with a steel leaf-shaped blade" across 18 renders | The blade changed every time, but the cord-wrapped grip and the ringed butt cap survived on about half | Confirms the row above: **repaint keeps what is not named.** Use the full replace wording when the old parts matter. |
| A round shield asked to become a heater or kite shield by description only | Stayed round; only the decoration changed | Describing the new shape is not enough. |
| The same shield with "none of the old round disc, round rim, studs or arm straps remain, and nothing round is left" | A true heater shield | **The shield's outline can change**: name the old parts and forbid the old shape. One round shield in the captures is enough. |
| That heater shield "turned so its face tilts up toward the viewer" | Shape and emblem clearly visible, but the owner found the tilt unnatural | **Keep the mannequin's shield angle** ("keeping its exact position and angle on his forearm, held naturally"). Edge-on, the new outline still reads; the face emblem mostly doesn't. Tilt only when heraldry matters more than realism. |
| A sunburst painted on a shield held edge-on | Came back plain; a "dragon's head boss" landed on the rim instead | Emblems on an edge-on shield face don't show; put them on the rim or accept the loss. |
| A mannequin whose axe handle ran off the frame | Refused twice by the edge-clip check | The capture must hold the weapon wholly inside the frame. A spear 9–16 px from the edge on 1024 rendered fine. |
| A bow drawn across the body | Oversized bow, string and limbs that don't add up | Bows held low, edge-on, clear of the body; never at full draw. |

### Prompting

| Test | Result | Lesson |
| --- | --- | --- |
| Ten classes from existing captures | 8 good first pass; wizard, sorcerer, warlock and druid the strongest | **Open hands and fists make every caster**: the spell is written in. |
| A style token or portrait attached beside the mannequin | The attached subject got copied in | **Never attach a second image.** Words plus one mannequin. |
| A tail asked for on a body that loops it round the figure | Showed in two places, reading as two tails | Say "ONE tail, curving out behind to the upper left only". |
| Variants by editing a finished render (darker, cloak, runes) | Pose held | One mannequin gives a whole wardrobe. Fix faults with a flaw pass, never a re-roll. |
| A black outline round the mannequin (asked, not rendered) | — | Don't: an edit keeps drawing in the source, so an outline would come back as ink. Separate limbs with arms held off the body, or stronger HeroForge lighting. |

## The library

### Bodies

| Body | Covers | Status |
| --- | --- | --- |
| **Human** (the male body) | every human-sized race, both sexes | being captured |
| **Dwarf** | dwarves, both sexes | not yet |
| **Small** (a slim halfling body) | halfling, gnome, goblin, kobold | not yet; prove with 2–3 renders first. A stocky body may stretch a goblin the way the early human stretched a dwarf |
| **Large** (a heavy body) | goliath, orc, bugbear, ogre, hill giant | not yet; prove first. Token size is separate (`creatureSize: "large"` gives the 1024 token) |

**What the owner captures (2026-10-15):** six bodies, each in both sexes: large, human (medium),
dwarf, small, orc and elf. That goes past the table above. The sex test says one human body
covers both sexes, and one human body covers every race, but captures cost nothing. Having
the orc and elf bodies, and both sexes of each, gives the edit less to change. The skill
picks the nearest body and sex. The table above stays the floor of what the library must cover.

### Poses and setups

A **pose** (how the body stands) is expensive to make in HeroForge; a **setup** (what the hands
hold, in the same pose) is a quick re-export. Pick a mannequin by how the hands hold, never by
class.

**Crouch** (the human body, done 2026-10-15): a low forward lunge, one fist leading low, the
other arm back and high. Eight setups:

| Setup | Covers |
| --- | --- |
| empty hands | casters (see open question), monks, unarmed |
| sword | fighters without a shield, duelists; becomes any one-handed weapon of that length (mace, axe, hammer) |
| sword and shield | fighter, paladin, cleric, guards |
| short curved blade | rogue, assassin, thug; dagger, kukri, scimitar, shortsword |
| two short blades | two-weapon rogue or ranger |
| spear and shield | spear guard, soldier, hoplite; any polearm of that length one-handed |
| crossbow and shield | crossbow guard, militia |
| longbow held low | archer, ranger |

**Still to capture on the human body:**

1. **Two-hand weapon**: both fists together at the chest on one long shaft held diagonally
   across the body (greatsword, greataxe, polearm, staff).
2. **Down**: on its back, arms out (the dead or unconscious token for anything).
3. **Cast**, only if the open question below says so: one arm thrust straight out, the other
   hand drawn back to the chest.

**Open question: does the empty-handed crouch make a good caster?** An empty-handed lunge on an
older capture gave one of the best class tests (a druid). If the crouch does as well for a
wizard and a sorcerer, the cast pose drops out for every body. Test with two renders before
capturing it.

Then repeat for the other bodies: dwarf (crouch setups, two-hand, down), small (crouch setups
less the crossbow, down), large (crouch empty, two-hand, down; large creatures rarely carry
shields).

**Out of the library:** kneeling, jumping, running, kicking and idle standing poses.

## Capture rules (HeroForge)

1. Unpainted grey body, no clothing, no base, no rim (Stage tab: base and rim off).
2. **One saved top-down camera for every capture** (Share › Booth): about fifteen degrees off
   vertical for standing figures, straight down for the down pose.
3. Export with alpha (the PNG comes out already cut) at 1024 square.
4. Weapon in a **closed fist** and **wholly inside the frame**. Plain weapons are better than
   ornate ones: there is less to replace.
5. Arms held off the torso so the silhouette reads from above.
6. After switching body or weapon, check the weapon is still inside the frame and the grip and
   shield strap still line up.
7. No outline.
8. Name `mannequin-<body>-<pose>-<setup>.png`: `mannequin-human-crouch-sword-shield.png`,
   `mannequin-dwarf-twohand.png`, `mannequin-small-down.png`.

**Licensing:** HeroForge captures are a private intermediate. They never go in this repo (it is
public) or any other public repo. For anything commercial, read HeroForge's terms or swap the
capture step to an open source (PoseMy.Art, MakeHuman).

## The render recipe

`edit-image`, `kind: "token"`, flash, the mannequin as `sourceImage`, **no references**:

```
Turn this grey mannequin into <race, sex, age, build, face, hair, eyes>, <anything the mannequin
lacks: ONE tail curving out behind to the upper left only, wings folded, a cloak>.
<He|She> wears <clothing and armour, materials and colours>.
Replace the entire <weapon> from end to end, keeping only its length and angle in <his|her> fist:
none of the old <butt cap, ring bands, wrapped grip, collar, crossguard, pommel> remain.
The new weapon is <each part, bottom to top: pommel or butt, shaft or grip, collar or guard, head
or blade>.
Replace the entire shield, keeping its exact position and angle on <his|her> forearm, held
naturally the way the original is held: none of the old round disc, round rim, studs or arm
straps remain, and nothing round is left. The new shield is <shape, material, rim>.
<Any magic: "the hand at the lower right casts a crackling ball of violet force">.
Dark epic painterly rendering, the figure mostly in deep shadow with <light source> as the key
light and a faint cold rim light on the far edges, deep blacks and <dark colours>, crisp fine
detail on <materials>; nothing bright except <light source>, nothing left grey clay.
```

- Name hands by **where they are in the image** ("the hand at the lower left"), never left and
  right: the model reads those both ways.
- Name everything the mannequin lacks; it adds nothing unasked. Name every gear part you want
  gone; it keeps everything not named.
- The finish line is the house style (the campaign's `art/SHELF.md`); swap it for another
  campaign's.
- Fix a fault with one flaw pass on the render, naming the one thing and ending "keep everything
  else identical". Never re-roll: the pose survives a pass, not a new render.
- Variants (darker, cloaked, wounded) are edits of the finished token.

## Build-out steps

1. **Answer the open question** (two caster renders from the empty-handed crouch).
2. **Capture** the rest of the human body: two-hand, down (and cast, if step 1 says so).
3. **Prove** the small and large bodies with two or three renders each before capturing all
   their setups; then capture dwarf, small and large.
4. **Store** the captures in the owner's private art repo `fvtt-assets-actors`, under
   `mannequins/` (never here). Its `npm run mannequin -- check` reads HeroForge's exports in
   `~/Downloads` against the capture rules (1024 square, alpha, clear pixels on every side,
   frame fill) and `npm run mannequin -- take <file> <body> <pose> <setup>` files a passing
   one under its name; `mannequins/README.md` there carries the shot list.
5. **Skill:** add a "mannequin route" to `illustration-builder`'s token section (it already
   points here): when to use it, where the library lives, picking by how the hands hold, and the
   recipe above. Make it the default for humanoid PCs and NPCs.
6. **No new tool.** This is skill judgment over the existing `edit-image` token kind (tools do,
   skills decide). Revisit only if the recipe's fixed wording starts repeating in every call;
   then a `mannequin` source hint on `kind: "token"` could carry it.

## Status (2026-10-15, evening)

- **Filed:** `crouch-spear-shield` and `crouch-dagger-shield` for all six bodies, male and female
  (24 captures), in `fvtt-assets-actors/mannequins/`. The shot list there is a grid of setup by
  body. The owner captures one setup at a time across every body; `crouch-sword-shield` is in
  progress.
- **Tested:** 18 renders on the spear set (the body lessons above). The tokens and comparison
  sheets are on the owner's Desktop, `Manny Tests`.
- **Cutout defect found:** one render came back on a duller magenta plate, (235, 33, 231) against
  the usual (252, 26, 249). The chroma cut left every background pixel faintly opaque, a visible
  box on a dark canvas, and the tool still reported zero residual key. It belongs to the token
  cut, not to mannequins.
- **Next:** finish the crouch setups, then `crouch-empty` and step 1 (the caster question).
