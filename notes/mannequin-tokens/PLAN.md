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
| Six bodies (large, human, dwarf, small, orc, elf), each sex, made into its own race with one shared kit and finish (spear and shield combat pose, 2026-10-15) | 12 of 12 clean first pass; pose, grip and spear angle held (relative size does not carry: see the token-scale row under Prompting) | **Every body works.** The small and large bodies are proven. |
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
| The dagger-and-shield combat pose (human male) made into a shortsword, a flanged mace, and a longsword "three times as long as the old one" with the full replace wording (2026-10-15) | All three clean, grip held, the longsword inside the frame | **A weapon can grow; it can't shrink.** Lengthening from a short blade works; shortening a longsword into a dagger did not. The short-blade capture is the flexible base for every one-handed weapon. |
| The same dagger made into a hand axe | A good axe, but the fist turned to hold the head pointing down, not along the old blade | A weapon with its mass off to one side may turn the grip. Accept it, or name the head's direction. |
| The same dagger made into a sickle | A good sickle, but the whole figure came back at about half its size | **One render in 12 lost the token's scale.** Look at figure size against the mannequin in the flaw pass; a shrunken figure is redone, since an edit can't grow it back. |
| The dagger made into a lit torch, and a bone wand with a violet spark | Both clean; each light became the key light and lit the hand | Things held in the fist change freely, not only weapons. Name the held light as the key light. |
| "Repaint the blade as a plain steel dagger" | Kept the curved kukri shape on all four | Repaint keeps shape as well as parts; use the replace wording to change an outline. |
| The dagger set's round shield replaced with a blue heater shield with a white tower | A true heater; the emblem reads clearly | This capture holds its shield more face-up than the spear capture, so **emblems show on it**. Pick the capture by how much heraldry matters. |
| The same shield made into a small fist-held buckler, and a tower shield "twice as long" | Both clean: smaller and larger outlines both work | A shield can change size both ways, unlike a weapon. |
| The shield removed entirely ("no disc, rim, studs or arm straps remain anywhere"), the hand given a lantern, or a second dagger | Both clean, forearm bare, the new item held naturally | **A shield capture also covers the shieldless off hand.** The `sword` (no shield) setup may be redundant; `sword-shield` with the shield removed may do. |
| Coverage check (2026-10-15): the sword-and-shield capture made into a duelist with the shield removed and the hand open; the dagger-and-shield capture into a hooded rogue the same way; the sword-and-shield capture into a ranger with a scimitar and a long knife in the freed fist | All three clean first pass: a natural bare forearm where the shield was, the open hand reads as balance, the scimitar a full replacement | **The `sword`, `shortblade` and `twoblades` setups are dropped.** Every combat setup is now a shield capture; the shield comes off in words. |
| **A bow at full draw** (the standing `bow-draw` capture, 2026-10-15): a human ranger, an elf archer, a halfling and an orc hunter, each with "a single taut bowstring from the upper tip to the drawing fingers and on to the lower tip" | All four clean and in character; bow size and angle held, the arrow nocked and pointing true, the tight orc capture (10 px clear) did not clip. But on every one the string ran straight from tip to tip, as if undrawn | **Full draw works except the string.** The earlier full-draw failure was a bow written into the pose; a captured bow holds. The string is never pulled back to the fingers, and one flaw pass asking for "a sharp V whose point is at his fingers" changed nothing. Accept it: at token size it reads as an archer. |
| The capture's carved leafy bow, repainted while "keeping its exact length, curve and angle" (elf) or with "none of the old carved leaf ornament remains" (the other three) | The elf's bow kept the leaves and read like ribbon; the three that named the ornament came back as clean plain bows | Repaint keeps ornament as well as shape. **Name the ornament to remove** whenever a capture's weapon is ornate. (The owner later re-captured the full-draw set with a plain longbow, and added a plain recurve shortbow at full draw.) |
| **The two-handed pose** (2026-10-15): a low braced stance, a greatsword upright at the right shoulder in both fists, on the human male and female, each made into a greatsword knight, a greataxe barbarian woman, a halberd watchman (half again as long), a goliath with a maul, a monk with a quarterstaff reaching below the hands, an elf with a glaive | 12 of 12 clean first pass; every polearm upright and inside the frame. On the male body the barbarian woman came out heavy-built, on the female body lean; the female capture kept the maul at the shoulder where the male one drifted it to the centre | **One two-handed capture covers every two-handed weapon**, longer ones included. Capture it for both sexes like every other pose: the body still sets the build. |
| **Two two-handed stances, eight tests** (2026-10-15). Left stance (blade upright at the left side, body twisting away, a leg out): a dwarf greataxe, an orc woman's spiked greatclub, a gnome woman's oversized brass war pick, an elf's pike twice the sword's length. Right stance (blade at the right shoulder): a bugbear's morningstar, a paladin woman's flaming greatsword, a tiefling's war scythe, a dwarf woman miner's pickaxe | 8 of 8 clean first pass, no clipping, no haze; every shape fully replaced the sword, the flame lit the paladin's face, the scythe blade swept sideways inside the frame. The right stance held on all four. The left stance held on the orc and the elf but straightened into a plain front-facing stance on the dwarf and the gnome | **Any two-handed weapon or tool works from either stance.** The left stance's twist is weak on stocky and small bodies; prefer the right stance for dwarves and small folk, or accept the straighter pose. |
| A mannequin whose axe handle ran off the frame | Refused twice by the edge-clip check | The capture must hold the weapon wholly inside the frame. A spear 9–16 px from the edge on 1024 rendered fine. |
| A bow drawn across the body | Oversized bow, string and limbs that don't add up | Bows held low, edge-on, clear of the body; never at full draw. |

### Prompting

| Test | Result | Lesson |
| --- | --- | --- |
| Ten classes from existing captures | 8 good first pass; wizard, sorcerer, warlock and druid the strongest | **Open hands and fists make every caster**: the spell is written in. |
| **The caster question** (2026-10-15): the empty-handed combat pose made into a human wizard (a blue arcane sphere in the cupped low hand, light trailing from the raised one) and a human sorceress (a fireball low, flames on the raised hand) | Both strong on the first pass; long robes widened the wizard's figure but read well | **The empty-handed pose makes casters; no cast pose is needed**, for any body. Put the spell in the cupped hand and make it the key light. |
| **Token scale** (measured 2026-10-15 on the adventurer test): figure size in the token against the mannequin | Every token fills its square: the figure is trimmed to its outline and fitted at about 0.9 of the frame, so a kneeling capture filling 0.33 of its frame came back 2.7× taller, as large as a standing one | **The mannequin's scale never reaches the token.** `scripts/token_cutout.py` fits each cut to the square on purpose (VTT scale 1.0); size on the map is the token's grid size (`creatureSize`, Foundry's token width). A halfling or a downed figure fills its cell like anyone else. Earlier notes that "the halfling stays small" were wrong. |
| **Three adventurers in four poses** (2026-10-15): a fighter (longsword, blue heater shield), a rogue (two curved daggers), a wizard (oak staff), each from the combat, standing, dead and a new kneeling capture, one character description reused across the four | 12 of 12 clean first pass; each character is plainly the same person in every pose; dead reads as dead (eyes closed, blood, gear lying beside the hands); the kneeling capture reads as knocked down | **One description carries a character across poses.** A set of pose tokens for one PC is four edits. |
| The kneeling capture with a shield "slung on his back" | From this front-and-above camera the shield's top rose over his head like a hat | On a figure bowed toward the camera, gear on the back rises over the head. Lay it on the ground instead. |
| A style token or portrait attached beside the mannequin | The attached subject got copied in | **Never attach a whole second image.** Words plus one mannequin, with the one exception below. |
| **The first real run** (the four Echoes of Halruaa PCs, 2026-10-15/16, about 50 renders, $1.71; the renders are on the owner's Desktop, `testpcs` and `testpcs-head-angle`): sixteen words-only tokens, four PCs by stand, combat, prone and dead | 15 of 16 usable first pass, and the owner rejected them: the likeness drifted, "it's not good" | **Words alone do not hold a known face.** |
| The same sixteen with a tight face crop of the approved portrait (centred on the pupils, about four interpupillary distances wide) as `character`, bound "Image 2 is <Name>, use it for the face only, never its painting style, lighting, framing or camera angle" | All sixteen faces fixed, pose and camera held, no render copied the portrait's angle | **A crop as `character` is the exception to the no-second-image rule.** The copying lesson came from whole tokens and portraits, not crops. |
| A head-to-waist crop instead, bound "use it for the face, outfit and equipment only, never its painting style, lighting, background, framing or camera angle" | Faces as good as the face crop, the kit pulled toward the portrait (plate, shield boss, leather, scarf, robe), pose and camera held; horns followed the crop, not the words | **Head-to-waist is the crop to use.** Restate horn shape when it matters. |
| "Keep the mannequin's exact pose, proportions and steep overhead camera" against "The grey mannequin is a guide for the pose, the overhead camera and the body proportions, not a rig to copy: paint <Name> in roughly this stance from roughly this angle, and let <him\|her> stand naturally, with <his\|her> own weight, head and hands" | Side by side the pose did not change | **The guide sentence replaces the exact-pose line.** It buys the same and treats the mannequin the way the owner wants. |
| Heads on standing and combat renders | Most looked down at the ground or tilted up at the camera. A strict "look straight ahead at eye level" block made the figure look further up, toward the camera; a frontal portrait crop pulls the head that way too | **Two causes, both in the pixels (2026-10-16).** The captures' own heads bow toward the ground (the stand and combat human male look at their feet), and the frontal crop bound "keep this exact face" pulled heads up to the camera. So the head is never bound to the mannequin's: `edit-image`'s `source: "mannequin"` keep line describes it (held level, looking ahead along the ground, crown and brow largest, eyes and nose showing, chin mostly hidden), the character preamble binds identity only, and a per-PC token-head anchor (the face already at the token camera) replaces the frontal crop. The re-capture with raised heads is the owner's lock beneath all three. |
| The dwarf `dead` capture, with and without the crop | Came back lean, older and grey, twice | One flaw pass naming build, age and hair fixed it both times; expect it. |
| Gear "lying dropped on the ground beside the fist at the left/right" on prone and dead; `twohand-staff-diagonal` with a glowing orb at the staff head; `stand-open` with an orb and a book; `stand-empty` with a lute slung on the back | All landed first time, except a haft on the dwarf `prone` capture that clipped the frame twice until written "tucked close under the fist, haft no longer than his forearm" | Dropped gear works; keep it tucked under the fist on the small-framed prone captures. |
| A tail asked for on a body that loops it round the figure | Showed in two places, reading as two tails | Say "ONE tail, curving out behind to the upper left only". |
| Variants by editing a finished render (darker, cloak, runes) | Pose held | One mannequin gives a whole wardrobe. Fix faults with a flaw pass, never a re-roll. |
| A black outline round the mannequin (asked, not rendered) | — | Don't: an edit keeps drawing in the source, so an outline would come back as ink. Separate limbs with arms held off the body, or stronger HeroForge lighting. |

### The standing pose (2026-10-15)

A second pose: standing, arms held a little out from the body, the camera from in front and above
(the face shows more than in the combat pose). Three human male captures, 16 renders, all usable first
pass (Desktop, `Manny Tests/Stand`).

| Test | Result | Lesson |
| --- | --- | --- |
| Two daggers pointing down made into a longsword and dagger, a sword and an added round shield, two hand axes, a mace and a lantern, a warhammer and a tower shield, a rapier and a parrying dagger | All six clean; the longsword three times the dagger, the tower shield shoulder to ankle, the rapier's swept hilt | Everything the combat pose showed holds here. **A shield can also be added** where a weapon was, not only removed. |
| Empty, loosely closed fists made into a wizard with a tall staff, a monk, a mercenary with a sword written into the empty fist, a civilian holding two tankards | All clean, including the sword | **A weapon can be written into a closed empty fist.** The combat-pose failure was an *open* hand. In a closed fist the grip held. |
| Worn gear on the empty capture: a sheathed longsword at the hip with a backpack and bedroll, a greatsword slung across the back, a round shield slung on the back | All three read clearly: the bedroll above the shoulders, the greatsword's hilt over one shoulder, the shield's rim and emblem behind the head | **Worn gear works.** From this camera, gear on the back shows above the shoulders. |
| The dagger-and-shield capture made into a kite shield with a lion, a torch with the shield removed, a dwarf on this human body with a spiked buckler, a tiefling with ONE tail, a scimitar and a heater shield | All clean; the lion emblem reads fully, since this shield faces the camera | Heraldry shows on this pose's shield. Race and size words work on the standing human body too. |
| Sides named "the fist at the left/right of the image" | Honoured in 10 of 12; the round shield and the wizard's staff went to the other hand | Side names are mostly kept, not always. For a token it rarely matters (a mirror reads the same). |

**Verdict: two captures per body** (empty fists, and a short blade with a shield) cover everything
tried here. The empty capture alone came close, since closed fists take written weapons.

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

**Combat** (named `crouch` until 2026-10-15; the human body, done 2026-10-15): a low forward lunge, one fist leading low, the
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

**Answered 2026-10-15: yes (see Prompting).** The question was: does the empty-handed combat pose make a good caster? An empty-handed lunge on an
older capture gave one of the best class tests (a druid). If the combat pose does as well for a
wizard and a sorcerer, the cast pose drops out for every body. Test with two renders before
capturing it.

Then repeat for the other bodies: dwarf (combat setups, two-hand, down), small (combat setups
less the crossbow, down), large (combat empty, two-hand, down; large creatures rarely carry
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
8. Name `mannequin-<body>-<pose>-<setup>.png`: `mannequin-human-male-combat-sword-shield.png`,
   `mannequin-dwarf-twohand.png`, `mannequin-small-down.png`.

**Licensing (ruled 2026-10-16):** the captures are unpainted grey poses with no copyright of their
own, so they live in this public repo under `mannequins/`. They were first kept in the private
`fvtt-assets-actors`, which the owner reserves for finished art. For anything commercial, read
HeroForge's terms or swap the capture step to an open source (PoseMy.Art, MakeHuman).

## The render recipe

`edit-image`, `kind: "token"`, flash, the mannequin as `sourceImage`, and for a known character
one reference, a head-to-waist crop of the approved portrait as `character` (no reference for a
new NPC). This is the 2026-10-15 shape; the skill's mannequin route carries the current recipe,
which adds the guide sentence and the crop binding from the first real run (the Prompting
lessons above):

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

1. **Answer the open question** (two caster renders from the empty-handed combat pose).
2. **Capture** the rest of the human body: two-hand, down (and cast, if step 1 says so).
3. **Prove** the small and large bodies with two or three renders each before capturing all
   their setups; then capture dwarf, small and large.
4. **Store** the captures in this repo under `mannequins/` (moved here from the private
   `fvtt-assets-actors` on 2026-10-16). `npm run mannequin -- check` reads HeroForge's exports
   in `~/Downloads` against the capture rules (1024 square, alpha, clear pixels on every side,
   frame fill), `npm run mannequin -- take <file> <body> <sex> <pose> <setup>` files a passing
   one under its name, `takeset` files a whole set in the fixed order, and `grid` shows the
   library from the files; `mannequins/README.md` carries the shot list.
5. **Skill: done 2026-10-15.** `illustration-builder`'s token rules (Step 4, item 5) open with the
   mannequin route: when to use it, picking a capture (pose, then grip, then body and sex), the
   recipe, and the rules learned here. It is the default for every humanoid PC and NPC; the
   words-only route stays for non-humanoid bodies.
6. **No new tool; a source hint (2026-10-16).** The recipe's fixed wording repeated in every call
   of the first real run, so `edit-image` kind `token` took `source: "mannequin"`: the tool writes
   the guide line, the head and the no-grey rule, and the skill's recipe shrinks to the character
   and the references (`character` for the face, `object` for gear crops).

## Status (2026-10-15, night)

**The library is captured: 312 files**, six bodies (large, human, small, dwarf, orc, elf) in both
sexes, in this repo's `mannequins/` (its README is the shot list; `npm run mannequin -- grid`
shows it from the files). Every body and sex was verified; no flags are open.

| Pose | Setups |
| --- | --- |
| combat (was crouch) | spear-shield, dagger-shield, sword-shield, longsword-kite, sword-open, longsword-open, empty, crossbow-hip, crossbow-down, bow, twodaggers, sword-dagger |
| stand | dagger-shield, dagger-open, empty, open, bow, bow-draw, shortbow-draw |
| twohand | right, left, staff-level, staff-diagonal, staff-brace |
| dead | (none) |
| prone | (none) |

Tested on the way (about 120 renders, all on the owner's Desktop, `Manny Tests`): every body
and race, gear limits, coverage, casters, the standing pose, worn gear, four poses for one
character, full-draw bows, and the two-handed stances. The lessons are in the tables above. Three
staff setups (level, diagonal, brace) are captured but not yet rendered.

**Why so many setups (the owner, 2026-10-16):** a batch of tokens made at once (a guard post, a
warband, a crowd) should spread across the poses and grips that fit the intent, so a map never
shows one capture repeated. The skill carries that rule.

**Step 5 is done, and the first real run is in (2026-10-16):** the four PCs' tokens went the
mannequin route in another session, and its lessons (a portrait crop as `character` for a known
face, the mannequin as a guide not a rig, the dwarf `dead` build fix) are in the skill and the
Prompting table above.

**2026-10-16, day.** The library moved into this repo (`mannequins/`). The review of the first
real run (the sheets in `_tests/testpcs` on the owner's Desktop) found the head's two causes, the
captures' bowed heads and the frontal crop, and the server changed: `source: "mannequin"`, the
`object` role, identity-only character binding, a described head in the token framing, and
`thinking`. Next: a token-head anchor per PC (the approved face rendered at the token camera,
approved once, filed on the campaign shelf), gear crops as `object` references, and a
twelve-render head test (the four PCs standing, three ways) after a Claude Code restart.

**The first anchor attempt (2026-10-16, six portrait renders, $0.30; on the owner's Desktop in
`imagegentests`).** From words plus the face crop: Cecil and Tychon came back near the target
(head pitched forward, crown and brow large, eyes visible but rolled up to the camera), Kartor
looked straight down with his eyes shut, Lysandra up at the camera. The approved Kartor token's
head attached as a `pose` reference pulled both retries frontal: that token is itself nearly
frontal, so it is no angle reference. The reference to use is a grey head at the target pitch (the
owner's re-capture), which has no face to copy and only carries the angle.
