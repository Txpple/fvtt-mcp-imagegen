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
| **Twenty characters, each on its matched body and on the human male** (the owner's own sheet, the evening of 2026-10-16: dwarves, a gnome, halflings, a goliath, humans of both sexes, a tiefling woman; Desktop `TestTokens5/compare-matched-vs-human-male.png`) | To the owner's eye the human-male column held race, sex, build and kit. By its timestamps the matched arm predates the busts and the human-male arm the server's bust anchor; the first head check's words are on its labels | **One body is a live hypothesis, not a ruling.** It contradicts the 2026-10-15 rows (a taller dwarf, a slimmer orc woman) and has never met the head anchor; "Research: one body and the head anchor, together" below tests them as one. |
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
2. **One saved camera for every capture** (Share › Booth): straight down, a 90-degree
   orthographic top-down view, the down pose included (the owner's rule of 2026-10-17; the
   library of 2026-10-15 was shot about fifteen degrees off vertical and is being re-shot).
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
HeroForge's terms or swap the capture step to an open source (PoseMy.Art, MakeHuman). **Per-character
HeroForge builds are out (owner ruling, 2026-10-16):** a PC modelled with HeroForge's own gear, horns
and parts would carry their designs into the art, so the library stays grey, unclothed poses only;
a character's gear comes from the approved portrait as `object` crops and from words.

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
<The campaign's token finish line from its art/SHELF.md, its key light named>; nothing left grey
clay.
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

**The head test (2026-10-16, after the restart; fourteen token renders, $0.59; on the owner's
Desktop in `imagegentests/head-test`, with a contact sheet).** All on `source: "mannequin"`, flash,
the head-to-waist crop as `character`. A: the tool's absolute head line ("held level, looking
ahead") left all four PCs bowed like the capture (Cecil, Tychon, Kartor) or up at the camera
(Lysandra). B: one relative sentence at the top of the instruction, "the mannequin's head is bowed
toward the ground; lift the head up from that position until he looks ahead along the ground
three paces in front, face tilted only a little up, so that the brow, both open eyes and the nose
show clearly below the top of the head while the chin stays hidden", landed four of four. D: B plus
gear crops as `object` references (Kartor's axe head and shield, Cecil's lute and scarf) came
through with the head and pose untouched. E: B on the owner's four raised-head re-exports (the
highest HeroForge allows without looking awkward) landed four of four again, the faces a touch more
forward: the raised heads help and are not required. The sentence now leads the tool's mannequin
prompt (`MANNEQUIN_EDIT_SOURCE`), to be confirmed on the first render after the next restart.
Three of the re-exports are filed over their captures (`human-male-stand-open`,
`human-male-stand-empty`, `human-male-combat-dagger-shield`); the fourth, the female combat lunge
with the dagger and the off hand open, was filed as a new setup and dropped the same day (the
owner's call): `combat-dagger-shield` with the shield removed already covers it (the 2026-10-15
coverage check), and a one-body setup would flag six cells in the grid for good. Since the raised
heads changed nothing the lifting sentence had not already done, the library is not re-exported. Side lessons: name the
footwear (the mannequin is barefoot and Tychon came back barefoot); thinking at the default medium
runs 600 to 1600 tokens a token render, under a cent, and is now in the estimate.

**Round two (2026-10-16, six renders, $0.26; `imagegentests/head-test-2`).** `thinking: "high"` on
Cecil and Tychon standing: the thinking counts stayed in the medium band (1184 and 1535), Cecil
came out the same, Tychon's stance drifted into a lean the mannequin lacks; leave it unset for
tokens. The lifting sentence on the other poses: Cecil on `combat-empty` (dagger in the low fist,
motes from the raised hand) and Tychon on `twohand-staff-level` both landed with the head at the
target and the pose kept; Lysandra on `prone` came back kneeling with her head up, alert, which
reads well; Kartor on `dead` lay on his back with his eyes closed, the sentence overruled by "lying
dead, eyes closed", so the tool may carry it on every mannequin edit. The tool-side placement
(`MANNEQUIN_EDIT_SOURCE`) was confirmed after the owner's restart: one Cecil standing token with
nothing about the head in the instruction came back with the head lifted to the target, pose and
kit kept. The recipe says nothing about the head from here on.

**The camera changed the same evening (owner ruling, 2026-10-16).** Tokens are true top-down at
the table, so the owner tested a 90-degree orthographic camera and an 85 (sixteen renders on
Kartor and Cecil, `OrthoTests` on the Desktop). Plain 90 and 85 gave an overhead body with no face
(a sliver of brow at 85). "Seen from directly above, a 90-degree orthographic top-down view, the
camera looking straight down onto the tops of the shoulders, the feet directly beneath the body;
the head is tilted up a little so that, even from straight above, the brow, both eyes and the nose
show in front of the crown of the head" gave an overhead body with the face showing, eight of
eight, and the owner called it perfect. It is now the tool's mannequin line and the words-only
token framing; the fifteen-degree pitch and the lifting sentence are retired, and the head check
judges for the new target (`up` now means the camera dropped). The library stays as captured: the
words override its pitch, and pose, proportions and grip are all it gives.

**The first run at the new camera (2026-10-16, the four PCs in four poses, sixteen tokens, about
$1.04; `PCTokens90` on the Desktop and the campaign's `art/staging`).** With the head check live:
every stand and prone and three of four combats were judged `ahead` first time and look it. Cecil's
combat on the empty-hands capture came back with the camera dropped three times (the judge caught
each, the retries did not fix it) and landed first time on the dagger-shield capture with the
shield removed: when a capture keeps dropping the camera, change the capture, not the words. The
three dead PCs lying on their backs were judged `up`, since a lying figure is face-on from above by
nature; the judge prompt now calls a lying figure `unclear` first. The owner's HeroForge heads were
not raised (ruled not worth it); the words carry the camera.

The same day the tool grew a head check
(`src/head.ts`): the plate goes to a judge model for one word, a bowed or up first render is redone
once, and `head` is reported; it never refuses, since the judge can be wrong. Its first verdicts on
real renders, below, found it noise on the head.

**The head is an image, never words (2026-10-16, evening; about 95 renders, about $1.30; the
sheets are on the owner's Desktop in `PC Tokens`, numbered 1 to 37 across `head-angle-sheet.png`,
`head-test-sheet.png`, `npc-anchor-sheet.png`, `generic-anchor-sheet.png`, `bust-test-sheet.png`,
`bust-2-bodies-sheet.png`, `bust-dial-sheet.png` and `busts-range-sheet.png`).** The owner called
head drift "a real issue in all our tokens" and asked for a systemic, measured fix instead of more
wording. What the day established:

1. **The band.** The owner ruled on `head-angle-sheet.png`: heads 5, 6, 7, 9, 10, 11 (the live
   standing and combat tokens of Tychon, Kartor and Lysandra) are right; 1 (a face to the camera)
   and Cecil's 8 and 12 are wrong. The band runs from eyes-down (5) to face-forward (11): the head
   faces the way the body faces, tipped just enough toward the overhead camera that brow, eyes,
   nose and mouth read, hair over the top half of the head; never the face lifted to the camera
   (chin underside, throat), which the owner dislikes most.
2. **A render leans toward the head tilt of any reference image that has a head.** Words about
   the angle (absolute lines, degrees, gaze targets, edits, "exactly as the mannequin's head")
   fail; binding the head to the mannequin by words held 1 of 4, and a frontal portrait crop was
   the stronger pull.
3. **PCs: the approved token head as `character`.** A head-and-shoulders crop of the approved
   token (about 190 px of the 512, upscaled) held the band 4 of 4 and carries its own tilt; the
   portrait's head-to-waist crop then goes in as `object` for the outfit only.
4. **Words-only NPCs: a grey bust as a dial.** The owner captured four busts of the bald human
   mannequin from the library's Booth camera (`mannequins/heads/bust-1.png` to `bust-4.png`: crown
   only; brow and eye sockets; eyes, nose and mouth; plus the chin edge; none shows the throat).
   Bound as a `pose` reference ("a grey clay head showing only how far a head is tipped toward
   this overhead camera: tip the figure's head exactly like it ... take nothing else from it"),
   bust-1 sent a guard eyes-down, bust-2 mid-band, bust-3 face-forward; bust-2 on an orc, a goblin,
   a knight and a dwarf centred the heads with about one step of spread (the goblin and one knight
   eyes-down); bust-4 sent one guard eyes-down. A bias with spread, not a lock; no identity bleed.
   The dwarf `stand-empty` capture dropped the camera twice (a front-on body), the known "change
   the capture" problem, separate from the head.
5. **The first judge was noise on the head.** It called bowed heads `up` (13, 21, 35), a
   face-to-camera head `ahead` (1), in-band heads `up` (17, 29, 32) and a bowed one `ahead` (25);
   its `up` ("the camera dropped") it did catch (32, 33). Its identical re-roll was a coin flip that
   doubled the cost.

**What the server does now (committed the same night).** `mannequins/heads/` holds the busts and
the ruled band crops with a README. `edit-image` with `source: "mannequin"` attaches bust-2 after
the caller's references and binds it as the dial whenever no `character` reference is attached;
a `character` reference is taken as the approved token head and bound to carry the tilt; the head
words left the mannequin lead and keep lines (an image carries the head, the words only the
camera and the no-grey rule; `headAnchor: "none"` brings the words back for a test). The judge
(`src/head.ts`) sees three band exemplars (`right-05` as DOWN, `right-10` as RIGHT, `right-11` as
UP) and `wrong-12` as FAR-UP beside the plate and grades `far-down`, `down`, `right`, `up`,
`far-up`, `camera-dropped`, `unclear`; `down`, `right` and `up` deliver. On the owner's ruled set
of 21 heads, flash-lite hit the band 16 times (and called a bowed guard `camera-dropped`);
`gemini-3.5-flash` with the same prompt hit 19 with every known step matched (5 down, 10 right,
11 up, the bust-3 guard up), and a feature checklist or a locate-then-crop step bought nothing, so
the judge is flash (a fifth of a cent a call). `render()` steers: `far-down` re-renders with the
next bust up (bust-3 at least), `far-up` with bust-1, a dropped camera once unchanged and then
`advice: change the capture`; at most two retries (`headRetries`), then delivered flagged; a PC
render is steered by adding the bust beside the character head. `head` reports `verdict`,
`inBand`, `anchorUsed`, `first`, every verdict and the kept plates. `npm run headtest` is the
measurement: the four PCs on a stand and a combat capture (their band crops as `character`, the
portrait crop as `object`; Cecil words-only until the owner approves a head of his) and six
words-only NPCs across bodies (a guard, a knight, an orc, a dwarf woman, a goblin on the small
body, a bugbear on the large body), three renders each, on bust-2 with steering on; a contact
sheet with every verdict, the hit rate first render and after steering; `--bust N` runs one bust
across the NPC set with no retries, `--rejudge` re-grades a run's plates, `--judge` grades any
images. Every change to the head path runs through it, never one render at a time. The PC set
is campaign content and lives in the campaign repo (`art/headtest/pcs.json` with the crops).

**The first headtest run (2026-10-17, 01:59; 26 renders, $1.22, under the $1.53 estimate;
`headtest/2026-10-17-01-59/` in the output folder, the sheet copied to the Desktop as `PC
Tokens/headtest-1-sheet.png`).** PCs on their token heads: 7 of 8 first renders in the band
(Tychon's stand `down`, Lysandra's stand `up`, the other five `right`), 8 of 8 after steering:
Lysandra's combat came back `far-down` on her token head alone and landed `up` with bust-3 added
beside it. NPCs on bust-2: 17 of 18 first renders in the band, 18 of 18 after steering: one goblin
`far-down`, landed `right` on bust-3; the knight's three, a guard, a dwarf woman and a goblin read
`down`, the orcs, the bugbears and the rest `right`. No dropped camera, no clip, no refusal; two
retries in 26 renders against the old judge's coin flips. Cecil, words-only on bust-2, landed
`right` on both captures. **The owner ruled the sheet passes (2026-10-17)** and picked Cecil's
stand render as his approved head: its head-and-shoulders crop is filed beside the PC set in the
campaign repo (`art/headtest/anchor-head-cecil-edmunds-stand.png`, with the render itself) and
his two headtest entries now carry it as `character` with his portrait crop as `object`, like the
other three. The fix is live in `dist/` after the owner's next Claude Code restart.

**The universal route (owner ruling, 2026-10-17).** The legacy PC token heads were luck, not a
standard, so new renders are not anchored to them: a PC renders on the bust like any NPC, with the
portrait's head-to-waist crop as `character` and `headAnchor: "bust-2"` on the call, which binds
the crop to identity only (features, hair, skin, build and kit) and lets the bust carry the head;
steering swaps the bust and keeps the crop (`anchorUsed` reads `bust-2 + identity`). The
token-head binding stays for a `character` reference with no `headAnchor`, for a head the owner
has ruled on. `npm run headtest -- --universal` renders each PC's `universal` entry this way.
The universal run (2026-10-17, 02:16; 8 renders, $0.51; `headtest/2026-10-17-02-16-universal/`,
the sheet on the Desktop as `PC Tokens/headtest-2-universal-sheet.png`): 6 of 8 first renders in
the band, 8 of 8 after steering, every face a clear likeness of its portrait and no camera drop.
The heads sit at the low end of the band with the portrait beside bust-2 (six `down`, Lysandra's
stand `up`): Kartor's stand came back `far-down` and landed `down` on bust-3, Lysandra's combat
`far-down` twice and landed `up` on bust-4. The bust-2 NPC run centred on `right`, so a portrait
beside the bust pulls the head a step lower; whether the universal route should default to bust-3
is one `--universal --bust 3` calibration run away (eight renders, about $0.35).

**Cecil, the hard case (2026-10-17; eleven renders, about $0.80; `Desktop/Headtest/cecil`).** The
owner passed the other seven universal renders and failed Cecil's two: the body not at 90 degrees
and the heads weird. Two pulls, found one at a time. The lute cradled across his chest dropped the
camera to a front-and-above view on the `stand-open` capture; slung on his back or held by the
neck at his side (on `stand-dagger-open`, the dagger replaced) the body came back true top-down on
every render since. His wavy jaw-length hair then fell over the eyes from above on every render
with the portrait crop beside the bust, and bust-3 and bust-4 could not lift it (seven heads
`far-down` or `down` with the hair over the eyes); "hair pushed back off his forehead so his brow
and both green eyes are clear" is a face word, not a head word, and with it the combat landed
`down` with the eyes clear. The stand still failed with the portrait (a dropped camera, then two
bowed heads on bust-1 and bust-3), and landed `right` first time words-only on bust-2 with the
same hair words, as his run 1 head had. **A frontal portrait with a fringe bows the head and can
drop the camera; such a character goes words-only on the bust, the hair described off the brow.**
The other three PCs' portraits (short, swept-back or pulled-back hair) rode beside the bust
without harm. The owner passed that head (the body and kit of a headtest render are a measurement,
not a token: the real tokens come through the skill's recipe with the campaign's finish line and
gear crops, after the restart).

**No carve-outs (owner ruling, 2026-10-17, late).** The route has to make hundreds of tokens with
nobody tuning an instruction, so a words-only exception for one character is refused. The
universal fix is in the tool, unmeasured as of this note: the mannequin keep line now says "any
hair lies back over the top of the head, leaving the brow and both eyes clear of it", a
description of the figure, not of the head's angle, a no-op for short or swept-back hair. Cecil's
headtest entries are back on his portrait like the other three (the lute by the neck or low, which
fixed his camera, stays). **Open, to pick up next:** run `npm run headtest -- --universal` (the
eight PCs, Cecil on his portrait, about $0.47; the full 26 with the NPCs about $1.50) and rule on
the sheet; one unit test fails after the keep-line change and has not been looked at (183 of 184
pass); the skill's rule for a portrait with a fringe (words-only on the bust) is superseded by the
tool's line and wants rewriting once the run confirms it.

## Research: one body and the head anchor, together (2026-10-17)

Nothing in this section is ruled. Three efforts ran apart over two days and each is
unfinished: the head carried by an image (the busts, the head check, steering), the anatomy count,
and the question whether one human male capture per setup can replace the library of 312. The
owner's own twenty-pair sheet of 2026-10-16 (the Bodies table) is the reason to pursue the
last; by its timestamps its matched arm was rendered at 21:10, before the busts existed, and
its human-male arm at 21:29, before the server carried the bust anchor (21:40), so one body has
never been rendered through the head path. This section is the level set and the programme
that tests the three together: each stage a question, a measured run, a sheet the owner rules
on, and a decision rule, in an order that changes one thing at a time. The direction is better
token art for hundreds of tokens untended; what the library and the head path look like at the
end is what the stages say, and the owner says it.

### Level set

**Measured** at the 90-degree camera, each by one run (the sheets are on the Desktop in `PC
Tokens` and `Headtest`, the runs under `headtest/` in the output folder):

| What | Result | Run |
| --- | --- | --- |
| Words-only NPCs on bust-2: six subjects across six bodies, three renders each | 17 of 18 first renders in the band, 18 of 18 after steering; one `far-down` (a goblin) | run 1, 2026-10-17 01:59, $1.22 with the PCs |
| PCs on their legacy token heads as `character` | 7 of 8, 8 of 8 | run 1 |
| PCs universal: the portrait's head-to-waist crop as `character` beside bust-2 | 6 of 8, 8 of 8; the heads a step lower than the NPCs' (six `down`), three steered retries in eight | run 2, 02:16, $0.51 |
| The head check (flash, four exemplars) against the owner's 21 ruled PC heads | 19 of 21 | 2026-10-16 |
| A frontal portrait with a fringe beside any bust | hair over the eyes, seven of seven; words-only on bust-2 with the hair described, `right` first time | Cecil, eleven renders, $0.80 |
| A camera drop belongs to the capture | `combat-empty` with a lute across the chest, three of three; `dwarf-female-stand-empty`, two of two; a different capture, first time | 2026-10-16 |

**Believed**, not measured under the current head path:

- **One body.** The twenty-pair sheet: dwarves, a gnome, halflings, a goliath, a tiefling,
  humans of both sexes, each on its matched body and on the human male, and to the owner's eye
  the human-male column held. Against it, the 2026-10-15 rows above (the old camera, no
  anchor): a dwarf on the human body came out taller, an orc woman slimmer. Neither sheet had a
  bust, the calibrated head check or the anatomy count behind it.
- **The hair sentence** in the keep line (universal; a no-op for short hair). Unmeasured.
- **The anatomy check.** Live on every token and portrait since last night; never scored
  against a sheet the owner has marked.
- **The head check on NPC heads.** Its 19 of 21 is on human PC heads, and its exemplars are four
  PC crops. On an orc, a goblin, a bugbear, a hood or a helmet nobody has checked its words
  against the owner's eye.

**Unknown**, and what the stages exist to answer:

- Does the head band rate change with the body under the figure? The busts are the bald human
  mannequin's head; a human-male capture matches them in proportion, a dwarf or a goblin does
  not.
- With the body gone, do the words and the portrait crop carry build (a dwarf PC, a goblin, a
  bugbear), standing and lying down (the dwarf `dead` lost its build even on the dwarf body)?
- How many of the 26 human-male captures drop the camera, and which? One body makes that a
  list of 26 to vet once each instead of 312.
- Does a portrait beside the bust want bust-3 to centre the band, and does a tighter face crop
  pull the head less than the head-to-waist crop?
- (Answered by the owner, 2026-10-17: the busts were shot straight down with only the head tilted,
  so they already sit at the 90-degree standard; the library itself is at about 80 degrees.)
- What else the owner has in mind for the head path; the list above is what the record shows,
  not the owner's.

### The stages

Every render goes through `npm run headtest`; the sheet (head verdicts, anatomy verdicts, the
captures used) is what the owner rules on, and a stage changes one thing against the stage
before it. Nothing renders without the owner's word.

| Stage | Question | Renders, about | The owner rules on | Decides |
| --- | --- | --- | --- | --- |
| 1. The head check on NPC heads | Is the head check right on non-human heads? | none: run 1's 18 NPC plates are on disk (`headtest/2026-10-17-01-59/`) | each NPC head, right or wrong | the head check's accuracy across races and gear; whether ruled NPC crops join the exemplars; the first scored set |
| 2. The hair line | Does the universal hair sentence keep Cecil's eyes clear and leave the other three alone? | 8 PC renders, $0.47 (`--universal --pcs-only`) | each head; Cecil's hair | the sentence stays or goes; the skill's fringe rule |
| 3. One body, the full set | The same subjects, words and busts, on the human-male capture of each pose and setup | 26 renders, $1.53 (`--universal --body human-male`) | the head per cell against run 1 and stage 2; the build per cell (the dwarf woman, the goblin, the bugbear, the orc, Kartor); every anatomy verdict by eye | whether the band rate holds or moves on one body; whether build survives in words; the anatomy check's first score |
| 4. One body, lying down and the hard builds | Prone and dead on the human-male captures for a dwarf, a goblin and a bugbear; a halfling woman and an ogre standing | about 8 renders, $0.45 | build; the lying head (`unclear` is right there) | the last body cases before any ruling |
| 5. The head anchor tweaks | From stages 1 to 3 and the owner's own list: bust-3 as the universal default (8, $0.35); a tight face crop against the head-to-waist crop (8, $0.47); wider exemplars (free, then a re-check of every run, cents) | each an A/B through headtest | each sheet beside its baseline | the head path for hundreds of tokens: band rate first render, retries per token |
| 6. The camera vetting | Which of the 26 human-male captures drop the camera? | the 15 captures stage 3 does not reach, $0.90; the other 11 are in stage 3's manifest | the dropped ones | the captures to re-export before any pose is added |

Stages 1 and 2 first, the baseline on the bodies we have, one of them free; 3 and 4 only
after, so a change in the head rate can be read as the body's. Stage 5 takes its shape from 1
to 3 (the owner had no tweaks in mind as of the morning of 2026-10-17; the candidates are the
record's). About $3.50 for stages 1 to 4; 5 and 6 as picked.

**Stage 1 result (2026-10-17, no renders).** The owner ruled blind on run 1's 18 delivered NPC
heads and the one first render the head check sent back (a numbered sheet, no verdicts on it; the
rulings and the score are `stage1-rulings.json` beside the run's manifest and in the Desktop
review folder): the 18 are right ("what I expect"), and the rejected goblin render is bowed ("I
prefer 14 over 19 because I can see its eyes"). The head check had called the 18 `right` (11) or
`down` (7) and the rejected one `far-down`, so it agrees with the owner 19 of 19 on in-band
against out, across a human man and woman, an orc, a dwarf woman, a goblin and a bugbear; its
`down` against `right` is unscored, since the owner accepts both. The set holds one rejected
head and no hoods or helmets, so this scores the head check's acceptances and barely its rejections;
those get scored as stages 2 and 3 produce them. Nothing in the head path changes on it.

**Stage 2 result (2026-10-17, 13:33; 8 renders, $0.36; `headtest/2026-10-17-13-33-universal/`,
filed blind as `06-stage-2-hair-line-universal-pcs` in the review folder, awaiting the owner's
ruling).** The universal route with the hair sentence in the keep line, the same four PCs,
captures and words as run 2: 8 of 8 first renders in the band and no retries, where run 2 had 6
of 8 and three retries. Tychon and Cecil `down`, Kartor `right`, Lysandra `up`. Cecil on his
portrait, which bowed seven of seven heads the night before, came back `down` twice with the
brow and both eyes showing under the parted hair. The anatomy check counted every figure sanely
(two of everything, Lysandra's one tail, the held objects, four visible fingers on a few hands,
unflagged) and then called the facing `bottom` on all eight with a 180-degree rotation each, on
tokens whose heads sit at the top of the image: a systematic miss in the facing question, not in
the renders (a top-down face looks toward the camera, and the check model reads that as the
bottom edge). Until the question is reworded and re-checked on these eight plates (a few
cents), `anatomy.verdict` reads `flawed` on every token, and the rotation it gives must not be
followed. Not changed yet.

**Stage 2 ruled (2026-10-17; the words and the score in `stage2-rulings.json` beside the run and
in the review folder).** The owner, blind: 2 (Tychon combat), 3 (Kartor stand) and 6 (Lysandra
combat) right with the likeness good; 1 (Tychon stand) "head too dropped" and 8 (Cecil combat)
"too far down", the two heads the check had passed as `down`; 4 (Kartor combat) "maybe too high",
the likeness inferior and stylistically off; 5 (Lysandra stand) "a bit down" where the check said
`up`; 7 (Cecil stand) "OK head, no eyes". And a word the check does not have: 1 and 7, both
standing captures, "need closer to the 90-degree ortho aspect, not fully top down". Side notes:
Tychon's staff done badly (2), Cecil's combat pose not combat-like (8).

What it says. *The head check's low end is below the owner's eye*: its `down` step took two
heads the owner rejects, and both its `up` calls on Lysandra were low or right to the owner, so
the exemplars want re-ruling on today's heads (a FAR-DOWN exemplar from 8 or 1, the DOWN one
checked against 5 or 2) and every plate re-checked and scored against both rulings sets, cents,
no renders. *The universal route sits low*: four of eight `down`, two of them rejected, with the
portrait beside bust-2, which is the open bust-3 question made concrete (8 renders, $0.47).
*The hair sentence did not deliver Cecil's eyes* on the stand (7) and left the other three
alone; it is neither kept nor dropped on this run alone, and no per-character line follows from
it. *The camera on the standing captures leans toward front-and-above* (1 and 7, both human-male
`stand` captures, which were shot with the camera in front and above), which the check has no
grade for between top-down and dropped; a capture-level cause that the one-body question
inherits, since those are the captures it would keep. None of these is changed yet.

**The checks recalibrated (2026-10-17; about 320 check calls, $0.65, no renders;
`headtest/recalibration-2026-10-17/` in the output folder, filed as `07-recalibration-of-the-checks`
in the review folder).** The owner's 27 ruled plates (stage 1's 19, stage 2's 8) were re-graded
under four rulers: the legacy four crops; a five-step ruler cut from the stage-2 renders the owner
ruled (cell 8 "too far down" as FAR-DOWN, 5 "a bit down" as DOWN, 3 "about perfect" as RIGHT, 4
"maybe too high" as UP, the legacy 12 as FAR-UP); the same five as whole tokens; and the legacy
four plus the FAR-DOWN crop. Whole tokens were the worst (five accepted heads rejected); the
legacy-plus-one set missed Tychon's stand. The first pass also showed the check's word wobbling
at the down/far-down boundary between identical calls (2 of 27 changed on the legacy ruler between
the live run and the re-run), so the two front-runners ran three times each. By majority of
three: the legacy ruler agreed 23 of 24, passed Cecil's rejected combat head every pass, and
wobbled on 6 cells; today's ruler agreed 20 of 22 (its four exemplar cells excluded), caught every
rejected head every pass (Tychon's stand, Cecil's combat, the goblin's redone first render, and
Cecil's eyeless stand), rejected two accepted NPC heads every pass (stage-1 cells 3 and 6, guard-3
and knight-3: a re-render on bust-3 each, about 3.5 cents) and wobbled on 3. **Adopted**, on the
asymmetry: a missed rejection ships a head the owner would not take, a false one costs a retry.
The ruler is `JUDGE_EXEMPLARS` in `src/heads.ts` (`band/*-s2-*` and `wrong-12`), the prompt names
six images, the legacy crops stay as the 2026-10-16 record, and three plates through the live
`--judge` path agreed with the owner. The anatomy check's facing question: asked which edge the
head "points to", the check model answered bottom on 30 of 34 top-down tokens whose heads sat at
the top; asked which edge the head is nearest, the eyes expressly ignored, top on 34 of 34 (a
second wording did the same; the shorter is kept in `src/anatomy.ts`). On the side, one pass
flagged the two-dagger goblin's daggers as "painted twice": identical twin weapons can read as a
duplicate. Open from this: the wobble at the boundary (a majority of three per plate would steady
it at three times a fifth of a cent); whether the owner minds a re-render on heads like guard-3
and knight-3; and a grade for a camera leaning front-and-above, which neither check has.

**Stage 3 rendered (2026-10-17, 14:08; 26 renders, $1.68 with eight steered items;
`headtest/2026-10-17-14-08-universal-body-human-male/`, filed blind as
`08-stage-3-one-body-human-male-captures` in the review folder with a pairs sheet, each token
beside its matched-body render from run 1 or stage 2; awaiting the owner's ruling on head, build
and likeness).** The same 26 subjects, words and busts on the human-male capture of each pose and
setup, read by the recalibrated checks: 18 of 26 first renders in the band, 24 of 26 after
steering (NPCs 14 of 18 then 17 of 18; PCs 4 of 8 then 7 of 8); every anatomy count ok and every
facing top. Like for like under the new ruler (the recalibration's majority words on the earlier
plates): run 1's NPC first renders on their own bodies score 15 of 18 and stage 2's PCs 5 of 8, so
the head rate on one body sits in the same range as on the matched bodies, with more retries
than the legacy ruler allowed anywhere. The two delivered out of band are both standing captures:
the dwarf woman's second render on `human-male-stand-empty` stayed `far-down` through bust-3 and
bust-4, and Cecil's stand on `human-male-stand-dagger-open` swung `far-up`, `far-down`, `far-up`
as steering sent it to bust-1 and back to bust-3, a dial that overshoots on that capture. Build is
the owner's call from the pairs sheet; nothing is concluded on it here.

**Stage 3 ruled (2026-10-17; the words and the score in `stage3-rulings.json` beside the run and
in the review folder).** The owner, blind, each one-body render beside its matched original: 14
heads good (1 to 5, 7 to 9, 11, 15, 17, 21 to 23; 4, 5, 21 and 22 with a note on the angle), 11
bad (6, 10, 12 to 14, 16, 18 to 20, 24, 26), and every bad one but 10 for the same reason, **the
eyes do not read** (shut, downcast under the brow, or gone); 25 "head good, no eyes though".
Build good or great on most, Kartor "great" on the human male (3, 4), the dwarf woman good but 20
"bad head and neck posture", the goblin's original "overall better" on 21 and 22 (human-looking
feet on the one-body render) and 23 "improves on the original", the bugbear "terrible" on 24 (the
pose not copied), "improved" on 25, "clumped but reasonable" on 26. **Three renders lost the
pose** (10, 16, 24). Likeness good or decent throughout (12 gloves became hands, 24 lost the
shoulder spikes, 2 the staff wrong again). 7 "could be more 90 degree vertical".

*The head check against the owner: 14 of 25 clear cells.* It passed ten of the eleven rejected
heads, seven as `down` and three as `right` (16, 24, 26), and 24 is a front view it did not call
`camera-dropped`; it sent 7 back as `far-up`, which the owner accepts. The reason is plain in the
words: **the owner's criterion is whether the eyes read, and the check grades tilt.** A ruler re-cut
for tilt cannot fix that; the check needs the eyes asked for by name.

*The eyes are not the body's fault.* The eyeless heads cluster by capture (the knight's
`combat-longsword-open` 3 of 3, the dwarf woman's `stand-empty` 3 of 3, the bugbear's
`twohand-right` 3 of 3), but the human-male and matched grey captures carry the same bowed head
(the knight's and the bugbear's pairs looked at side by side), and run 1's originals of knight-1,
dwarf-woman-1 and bugbear-1 have the same shut or downcast eyes the owner rejected on the one-body
renders. Stage 1's ruling was a blanket "what I expect" over the sheet, not this pair-by-pair
scrutiny, so run 1 is an optimistic baseline for eyes and the like-for-like head comparison above
stands only on tilt. What stage 3 does say about one body: build and likeness held on most, Kartor
included; the goblin reads a little more human; the bugbear is mixed; three poses were lost where
run 1 lost none the owner flagged.

Next, in order and on the owner's word: (1) the head check asks about the eyes by name (a
"both eyes read" gate beside the tilt steps), calibrated on the 53 ruled plates from stages 1 to
3 with the eyeless cells as the test, cents, no renders; (2) run 1's 18 originals ruled for eyes
at stage-3 scrutiny, free, so the body comparison has a fair baseline; (3) the busts and the
captures: why the eyes close (a bowed capture head, a bust that shows the brow but not the eyes,
the model's habit) is the next measured question, since no ruler change delivers eyes.

*Two leads from the owner after ruling (2026-10-17), on the body question, not rulings:* the large
renders come out with forward-facing heads, which the owner puts down to the large mannequin itself
(the large-male and human-male `twohand-right` captures carry the same bowed head, so the pull would
be the large body's mass, not its head pose); and the smaller creatures are "definitely more accurate"
on the small mannequin (the goblin pairs 21 and 22). If those hold, the answer is fewer bodies, not
one: the human male for every medium race, the small body kept, the large body open.

*A third lead, the captures' camera (the owner, 2026-10-17):* the library was shot at about 80
degrees, not straight down (the README's "about fifteen degrees off vertical"), and the owner would
capture at 90 if the mannequins are ever redone. It bears on the standing captures' bodies leaning
front-and-above (stage-2 cells 1 and 7, stage-3 cell 7); the busts are not affected, they were shot
straight down with only the head tilted (the owner, 2026-10-17). For now the words set the camera and the captures give pose, proportions and grip. Something to look
at later, not before the eyes are settled.

**The eyes gate (2026-10-17; 212 check calls, $0.42, no renders; `headtest/recalibration-2026-10-17/eyes-gate.json`,
filed in the review folder's `07-recalibration-of-the-checks`).** Two forms measured on the 53
ruled plates of stages 1 to 3, two passes each, the test being the owner's 13 "no eyes" cells
(stage 3's eleven, stage 2's cell 7, stage 1's cell 19) against the 17 heads the owner accepted
in stages 2 and 3 (stage 1 reported, not scored: its blanket pass did not look at eyes). A second
word folded into the tilt call ("FAR-DOWN NO-EYES") caught 10 of 13 on both passes and sent 0 of
17 back on both; a separate eyes-only call on the plate, no exemplars, caught 12 of 13 on both
passes (the miss is stage 3's cell 24, the bugbear's front view, where the eyes do show) and
sent 3 of 17 back on both (stage 3's cells 4, 9 and 11), with 4 of 53 words changing between
passes. **Adopted: the eyes-only call**, on the asymmetry again, and because it leaves the tilt
call alone. It asks about the eyes by name (`EYES_PROMPT` in `src/head.ts`), answers EYES,
NO-EYES or NO-FACE, and NO is a rejection steered up the dial like `far-down` (the kept plate
named `-no-eyes`); `head` reports `eyes` and `eyesVerdicts`, `inBand` now means the tilt in band
and the eyes not NO, the headtest sheet shows `down·no-eyes`, and a render costs two check calls.
On stage 1's 19 originals the gate would send 11 back: the eye flaw was there all along, on the
matched bodies too, unseen by the blanket ruling. The cost in retries: about one in six accepted
heads re-rendered for nothing (3 of 17), against ten of eleven eyeless heads shipped before.
The live sanity after the build (three plates through `--judge`): the knight's eyeless head sent
back, Kartor's stand in band, and the orc's cell 16, "no eyes" on both calibration passes, answered
"eyes yes" live: the wobble at the boundary reaches the eyes word too, and the majority-of-three
remedy (three times a fifth of a cent per word) is still the open item for it.

**The eight PCs with the gate live (2026-10-17, 15:15; 8 renders, $0.85 with retries;
`headtest/2026-10-17-15-15-universal/`, filed blind as `09-stage-2b-eyes-gate-live-universal-pcs`
with a before/after pairs sheet against stage 2; awaiting the owner's ruling).** Stage 2 repeated,
the same captures, words and bust-2 beside the portrait, now with the eyes gate steering. The
question was whether steering up the dial delivers eyes. First renders: 2 of 8 with eyes (Kartor
stand, Lysandra stand), against 5 of 8 on stage 2's first renders by the same gate in calibration,
which is the render-to-render variance of this route, since nothing in the first render changed.
Of the six eyeless first renders, steering delivered eyes on three (Tychon combat on bust-3,
Lysandra combat on bust-3, Tychon stand on bust-4) and not on three within two retries (Kartor
combat `no-eyes` on bust-2, 3 and 4; Cecil's combat `far-down·no-eyes` three times; Cecil's stand
`far-down` three times, the gate saying eyes on the last two, the tilt still below the band). 5 of
8 delivered in band at about 10.6 cents a token. The anatomy check made its first catch in the
field: six fingers on Lysandra's flame hand (stand), reported, not re-rendered.

What it says: the dial is a weak lever for eyes, about one in two within two retries, and the
first render of this route (the portrait crop beside bust-2) comes back eyeless somewhere
between three and six times in eight. The root cause is upstream of the checks. Candidates for
the next measured A/B, each on these eight (about $0.50 a run): bust-3 as the default for the
universal route (the open stage-5 item, now directly motivated: every steered success landed on
bust-3 or bust-4); a universal sentence in the keep line describing open eyes ("both eyes open and
showing beneath the brow", a description of the figure like the hair sentence, not an angle or a
gaze word, which failed before); a tight face crop in place of the head-to-waist crop; and no
portrait at all beside the bust for the eyes' sake (the words-only NPC route gave eyes on 7 of 19
by the gate, so that is no cure either). None chosen; the owner picks.

**Stage 2b ruled (2026-10-17, from the pairs sheet; `stage2b-rulings.json` beside the run).** The
gate's word on the eight delivered tokens matched the owner's eye on seven: 1, 2, 3, 5 and 6 "ok"
or "good" with eyes, 4 and 8 "no eyes" as the gate said; the miss is 7, Cecil's stand, where the gate
said eyes on the last two retries and the owner sees none, so the gate can say yes on a bowed head
(the tilt word, `far-down`, held it out of the band). Steering delivered eyes, by the owner, on
exactly the three the gate accepted after a retry (1, 2, 6) and not on the three it gave up on (4,
7, 8). The pose is off on 5 (a first render, "bad stand") and 8 ("combat stance off" after two
retries). Stage 2's renders seen again beside these ruled the same as before.

### A review, and what it changes (2026-10-17, afternoon)

Another session read this plan adversarially for the owner and asked eight questions. The
answers that are concessions, kept here so the programme carries them:

- **No number shows the route delivers more reliably today than on the morning of 2026-10-16.**
  What rose is the measurement's agreement with the owner (stage 2b: the gate matched 7 of 8
  delivered tokens). The first-render eye rate on the universal route is 2 to 5 of 8 and the cost
  per delivered token went from about 4 cents to about 10.6.
- **The eight-render stages are underpowered.** Separating a 50% rate from 80% needs about 25 to
  30 renders an arm. Eight was the unit the owner can rule in a sitting, not a power calculation;
  an eight-render A/B shows only a large effect. With the gate as a proxy (7 of 8 on delivered
  tokens, 12 of 13 on eyeless ones) an arm of 24 to 30 can be scored for eyes at about $1.50, the
  owner ruling a sample.
- **About 85% of the day moved the thermometer, not the render.** The only render lever touched
  was the bust dial through steering, which delivers eyes about one time in two. No render-side
  cause of the shut eyes has been tested.
- **The bust is eyeless, and that is an untested root cause.** Every configuration measured under
  the gate had a grey bust with empty sockets attached (run 1, stage 3, the PC runs); there is no
  bust-free arm under the gate (`headAnchor: "none"` exists and was last rendered before the gate).
  If a render leans toward the head tilt of a reference with a head, it may lean toward its eyes.
  A bust with the eyes modelled open is one HeroForge export.
- **A no-eyes remedy should be an edit, not a re-roll**, by this plan's own rule (a flaw pass keeps
  the pose; a new render does not, and stage 2b lost the pose on 2 of 8). "Open both eyes beneath
  the brow, keep everything else identical" on the delivered plate is a face change of the kind
  that worked for Cecil's hair, about 3.5 cents, and untried. Nine eyeless delivered plates are on
  disk to try it on.
- **The body question is parked** until the eyes are settled; it is a library simplification, the
  captures cost nothing to keep, and the owner's leads (fewer bodies, not one) are filed.
- **A stopping rule, proposed:** on a mixed set of 30 renders the owner has not seen, first
  renders the owner accepts on head, eyes, pose and build at 80% or better, delivered after retries
  at 95% or better, at 6 cents or less per delivered token, the gate agreeing with the owner on 90%
  of cells. A run that meets it ends the programme.
- **The standard moved under the owner's eye** (stage 1's blanket pass against stage 3's pair
  scrutiny) and six sheets in a day is too much ruling. The remedy: a written criterion the owner
  signs once, a fixed reference set ruled once, no re-ruling of old sheets.
- **The owner was never shown a token at table zoom.** At a 100 px grid cell a pair of eyes is 1 to
  2 px; whether the eyes criterion is worth its cost at the table is unasked and costs nothing to ask.

**Revised next steps, in this order, each on the owner's word:** (1) a table-zoom sheet, the same
tokens at 100 px beside 512, for the owner to say whether eyes matter at the table (free); (2) the
eyes-open edit pass on the nine eyeless delivered plates on disk, gate-scored, the owner rules the
nine (about 35 cents, no renders); (3) one A/B with power on the cause: bust-2 against no bust on
the eight PCs and six NPC captures, 24 renders an arm, gate-scored first-render eye rate, the owner
ruling 10 a side (about $3); if the no-bust arm is no worse, the bust is the cause and an open-eyed
bust is the lever. Stopped: majority-of-three, further ruler work, the body and library work, the
open-eyes sentence and the face-crop A/Bs until (3) is read. The bust-3 A/B already in flight (8
renders, on the owner's word before the review) is read as underpowered: only 7 or 8 of 8 against 2
of 8 would mean anything.

**The bust-3 A/B (2026-10-17, 15:31; 8 renders, $0.72; `headtest/2026-10-17-15-31-bust-3-universal/`,
filed blind as `10-stage-2c-bust-3-default-universal-pcs` with a pairs sheet against stage 2b; the
owner has not ruled).** The same eight, bust-3 as the universal default, the gate steering to bust-4:
first renders 4 of 8 in band with eyes (Tychon combat, Kartor stand, both Lysandras), 7 of 8 after
steering (Cecil's combat still `far-down` on bust-4). Against bust-2 the same afternoon (2 of 8, then
5 of 8). Read as underpowered, as promised: 4 of 8 against 2 of 8 at n=8 is within the noise, and
nothing is concluded from it on the default bust; it joins the evidence for the bust-2-against-no-bust
A/B at 24 an arm. No more credit is spent until the owner has read the review and picked a direction.
The review session also built a table-zoom sheet (stage 2 and 2b, cells 1, 4, 7 and 8 at 100, 150
and 250 px), copied to `11-table-zoom-sheet-from-the-review`: at 100 and 150 px the owner's "no eyes"
and "ok" cells are not distinguishable; at 250 px they begin to be. Whether the eyes criterion stands
at table scale is the owner's first question now.

**The table-zoom ruling (the owner, 2026-10-17, relayed by the review session in its own words):**
"this doesnt out, half them have no eyes", read as: the table-scale argument does not hold, half the
tokens have no eyes at that size too. **The eyes criterion stands for tokens**, the gate keeps
re-rendering, and the review's point 8 is overruled. Step 1 of the revised order is answered; step 2,
the eyes-open edit pass on the eyeless delivered plates, is next and waits on the owner's word in
this session (it costs credit).

**The lever after the edit pass, contingent (the owner, 2026-10-17, relayed by the review session,
verbatim): "if that doesnt work, id like to test your point about why dont we try with painted eyes
in the bust, as opposed to just grey, maybe gemini will pick them up more easily".** The hypothesis:
the grey bust's empty sockets teach the render shut eyes, and a bust with two open eyes, white sclera
and a dark iris visible under the brow, teaches open ones. The design, from the review session and
judged here:

- **The painted busts are new files beside the grey ones** (`bust-2-eyes.png`, `bust-3-eyes.png`),
  so `headAnchor` can pick either and every earlier run stays comparable; the grey busts stay as
  they are. Everything but the eyes stays grey clay, so the bust still bleeds no identity, and the
  iris is a neutral dark grey, so no eye colour carries into a token.
- **Made without a HeroForge session**, two ways, both cheap, the owner picking by eye before any
  render: one `edit-image` on each grey bust ("paint two open eyes into the sockets, white sclera and
  a neutral dark grey iris, looking the way the head faces, keep everything else identical grey
  clay"), about 3 cents each and natural-looking but a model's eyes; or drawn with sharp at no cost,
  exact but crude. Make both, show the owner, keep one.
- **The binding sentence changes for that arm.** Today it says the bust shows "only how far a head
  is tipped" and "take nothing else from it", which tells the model to ignore the eyes; the painted
  arm binds the tilt and "the eyes open exactly as they are here". Without naming the eyes it is
  not a test of the eyes.
- **Folded into the A/B already planned, with power**, three arms rather than two: grey bust,
  painted-eyes bust, no bust, 24 renders each (the eight PCs and six NPC captures, mixed),
  gate-scored first-render eye rate, the owner ruling a sample of about 10 a side; one run of about
  $4.50 instead of two. The owner may cut it to two arms or to 12 a side; 8 a side cannot read it.

Spend waits on the owner's word in this session; this is a plan entry. It runs only if the edit
pass does not deliver eyes on most of the fourteen.

**The eyes-open edit pass ran (2026-10-17, on the owner's word here; 14 edits, $0.60;
`headtest/*-eyes-edit/` in the output folder, filed blind as `12-eyes-open-edit-pass` with a
before/after pairs sheet; awaiting the owner's ruling).** One `edit-image`, kind token, on each of
the fourteen eyeless delivered tokens (stage 2b's three, stage 3's eleven), the line a face change
only ("open both of the figure's eyes fully beneath the brow so that the whites and the irises of
both eyes show clearly ... keep everything else identical: the same head and its tilt, the same
hair, face, expression, pose, gear, colours, lighting and camera"), then the two check words on the
result. By the checks: eyes on 14 of 14, in band on 13 of 14 at about 4.3 cents each, no retries.
The one out is Cecil's stand, lifted to `far-up`; three others came back `up` where the originals
read `down` or `right` (Kartor combat, knight-1, dwarf-woman-3), so the edit may raise the head as
it opens the eyes, which is the owner's call from the pairs. If the owner passes most of the
fourteen, the no-eyes remedy in the server becomes one edit on the delivered plate (pose kept, one
call) instead of a re-render on the next bust, and the painted-eyes bust stays a lever for the
first render rather than a remedy.

**Ruled (the owner, 2026-10-17): "yes their eyes are open. two of them had bug eyes though, which
wouldn't pass a review. 1 and 3".** Eyes open on 14 of 14, 12 pass, Kartor's combat and Cecil's
combat fail on eyes opened too wide; nothing else flagged as changed, the lifted heads included. So
**the no-eyes remedy is an edit, not a re-render**: one `edit-image` on the delivered plate at about
4 cents, pose kept, against a re-render that lost the pose on 2 of 8 and delivered eyes one time in
two. Two consequences, both for the owner's word: (1) the line softens, since "fully ... the lids up,
the eyes alive" over-asked on 2 of 14 ("open both eyes naturally beneath the brow so that the whites
and irises show, neither narrowed nor wide"), checked by re-editing the two bug-eyed tokens from
their originals (about 9 cents); (2) the server's gate remedy changes: a NO from the eyes gate with
the tilt in band runs the edit on the plate and re-checks, once, before any re-render; a tilt outside
the band still re-renders on the next bust as now. The gate cannot see over-opened eyes (it said
eyes on both bug-eyed tokens, the anatomy check ok), so "bug eyes" joins the flaw pass's list, not
the gate's. The painted-eyes bust stays a first-render lever, to run only if fewer edits are wanted.

**Done on the owner's word (2026-10-17, afternoon).** (1) The server's remedy: a NO from the eyes
gate with the tilt in band now runs one edit on the delivered plate (`EYES_OPEN_PROMPT` in
`src/head.ts`, the plate alone with the eyes line and the plate sentence, no mannequin, references
or bust) and re-checks; only a second NO re-renders on the next bust up; a tilt outside the band
re-renders as before. `head` reports `eyesEdited`, the kept plate is `-no-eyes`, the headtest sheet
says "(eyes edited)"; tests cover the edit, the second-NO re-render and the line (189 pass). (2) The
softer line ("open both of the figure's eyes naturally beneath the brow so that the whites and the
irises of both eyes show, the lids relaxed, neither narrowed nor wide; keep everything else
identical ..."), with no gaze word, re-edited Kartor's combat and Cecil's combat from their eyeless
originals (2 edits, $0.09): both `right` with eyes by the checks; filed as a three-column sheet
(original, bug eyes, softer line) in `12-eyes-open-edit-pass/softer-line/`, awaiting the owner's two
words per token (natural, same).

### The review thread closed (2026-10-17): what it hands over

The review session's consolidation, recorded so nothing from that thread is lost. The owner's
rulings relayed through it, verbatim: on the table-zoom sheet, "this doenst out, half them have no
eyes" (the eyes criterion stands at every display size; a scale argument is not evidence against
it); on the next lever, "if that desnt work, id like to test your point about why dont we try with
painted eyes in the bust, as opposed to just grey, maybe gemini will pick them up more easily"; and
the edit-pass ruling given here (14 of 14 open, 1 and 3 bug-eyed).

**The painted-eyes bust as a path in the process, not a one-off test** (the owner's wish, the
review's design, judged here):

1. *Prevention:* `bust-2-eyes` and `bust-3-eyes` as `headAnchor` values beside the grey ones, so
   first renders arrive with eyes more often and the edit is needed less. The eyes drawn into the
   sockets so that they read as open FROM STRAIGHT ABOVE (sclera under the brow); an eye that only
   reads from the front teaches nothing. Neutral dark grey iris, everything else grey clay. Both
   busts made cheaply (an edit-image each, about 3 cents, or sharp) and shown to the owner before
   any render; the owner picks.
2. *The binding for that arm names the eyes with the tilt:* "tip the figure's head exactly like it
   and have its eyes open exactly as they are here"; today's "take nothing else from it" would void
   the test.
3. *Remedy, as the tree `render()` now runs:* tilt out of band (far-down, far-up, camera-dropped),
   re-render with the bust steer (the eyed bust once it proves out); tilt in band and NO-EYES, one
   edit on the plate; a second NO, one re-render on the next bust; then delivered flagged. Not
   built: a WIDE answer in the eyes check for a stare, with one re-edit ("relax the lids") on it;
   two bug-eyed samples cannot calibrate a word, so it is logged, not written.
4. *A hypothesis to test, not a rule:* both bug-eyed plates were heads that had been bowed or
   eyeless through every retry (Kartor's combat on busts 2, 3 and 4; Cecil's combat far-down three
   times); an edit that opens eyes on a bowed head may push them up into a stare. If it holds,
   bowed heads belong to the re-render path and in-band heads to the edit path, which the tree does.
5. *When it pays:* with the edit in the loop a delivered token costs about render plus two checks
   plus p(no-eyes) times (edit plus two checks); at p of one half, about 5.5 cents, inside the
   proposed 6-cent stopping rule without the painted bust. The bust earns its $4.50 three-arm run
   only if it cuts p(no-eyes) by about half. So the end-to-end headtest with the edit in the loop
   runs FIRST, for a baseline first-render eye rate and edit rate to beat.

If the painted bust does not move the rate, the next arm is the keep-line figure sentence ("both
eyes open and showing beneath the brow"); arms stay at three a run. The review's line for the
stare ("a calm gaze the way the head faces") names a gaze, which the record says pulls the head, so
the server's line stays gaze-free; the difference is noted, not adopted.

**Standing rules from the review, binding:** every A/B at 24 a side, the gate as proxy, the owner
rules a sample of about 10 a side; no sheet over about 14 cells and no re-ruling of old sheets; no
further ruler or majority-of-three work; one body parked until the eyes are settled; the stopping
rule written and measured on 30 unseen renders; nothing renders without the owner's word in this
session. The anatomy check stays report-only; its six-finger catch on Lysandra's stand (stage 2b) is
unfixed and belongs on the owner's list for the real tokens, not the headtest.

**Order from here, each on the owner's word:** (1) done, the edit as the remedy; (2) done, plates 1
and 3 re-edited, awaiting the ruling; (3) one end-to-end headtest with the edit in the loop (the
full 26, about $1.50 plus edits), scored against the stopping rule as delivered rate and cost per
token; (4) the painted busts made and shown; (5) the three-arm A/B only if (3) says the edit rate
is worth cutting, or the owner says run it regardless. The open question for the owner: park the
painted bust, or run it.

**The end-to-end run (2026-10-17, 16:10; 26 renders plus 10 edits and 7 re-renders, $1.94;
`headtest/2026-10-17-16-10-universal/`, filed blind as `Desktop\TokenImprovements2\01-end-to-end-with-the-edit-in-the-loop`
with a pairs sheet against run 1 and stage 2 and `SCORE.md`; awaiting the owner's ruling).** The
full 26 through the pipeline as it stands: the tilt ruler, the eyes gate, the facing fix, the edit
as the no-eyes remedy, bust-2 by default. By the checks: first renders in band (tilt and eyes) 12
of 26 (PCs 4 of 8, NPCs 8 of 18); delivered in band 24 of 26 (NPCs 18 of 18; the PCs 6 of 8, both
of Cecil's out, his stand `far-down` three times on busts 2 to 4, his combat swinging `far-down`,
`far-up`, `far-down`); 10 edits for eyes, every one of which delivered eyes on the first try; 7
re-renders for tilt; every anatomy count ok and every facing top; 8.1 cents per delivered in-band
token, 7.5 per token rendered. Against the proposed stopping rule by the checks' words: first
renders 46% against 80%, delivered 92% against 95%, cost 8.1 against 6 cents; none met, the
delivered rate closest. The owner's rulings give the owner-measured numbers. This is the baseline
the painted-eyes bust has to beat: p(no-eyes) on a first render is about 14 of 26 here, and the
edit fixed all ten it was tried on, so the bust is worth its run only if it halves that.

**The owner's new route: chroma-green eyes on the capture (2026-10-17, evening; 4 renders,
$0.19; `token-eyecolor-*` in the output folder, filed as
`Desktop\TokenImprovements2\02-chroma-green-eyes-on-the-new-pose`; the owner's eye, no ruling
asked).** Picking up the handoff the owner set the bust lever aside ("the eye gates are OK but
still fail; Cecil again failed. I want to try a different route") and exported a new HeroForge
capture, `Desktop\EyeColorTests\Mann 15 Stand 3-Portrait.png`: a standing human male, the camera
steep, the head tipped up a little, and **the two eyes painted chroma green** (two slivers about
80 by 6 px in the 1024 frame, 49 green pixels in all). The route is the standard one, the
illustration put into words, the mannequin handed over, no bust and no portrait attached
(`headAnchor: "none"`, so the server's own head words ride along), and the instruction telling
the model to paint the green eyes; the owner asked for the checks left out of the loop
(`headRetries: 0`: the two check words and the anatomy count still ran, report-only, nothing
steered or edited). Tychon and Cecil, two lines each: the first ("the mannequin's two bright
green eyes mark exactly where his eyes are: paint both of his eyes there, open, level with each
other ... looking straight ahead the way his head faces"), then, on the owner's rewording
("don't veer from the mannequin pose, head, eyes"), a bound line ("the mannequin's two bright
green eyes are his eyes: paint them exactly where the green is, at the same size, the same slant
and the same spacing ... his head is tipped exactly as far as the mannequin's and no further, so
that the same amount of brow, eyes, nose and mouth shows as on the mannequin, no more of the
face"). *Result, by my eye and the checks' report:* **both eyes open and reading on 4 of 4**,
Cecil's included, with no green left anywhere; the hair, outfit, build and pose held on all
four and every anatomy count came back clean. **The head is lifted toward the camera past the
capture's tilt on all four**: the capture shows mostly brow with the eyes just under it, the
renders show the whole face, Cecil's nearly frontal both times (the tilt check: `far-up` on
three, `up` on Tychon's bound line, which is the one render that sits nearest the capture).
The bound wording moved Tychon a step down and Cecil not at all. Green found the eyes every time,
so no other marker colour was tried; the plate keyed magenta on all four without a clash. What
this says: a marked eye on the capture delivers open eyes on the first render where the grey
bust delivered them about half the time, and the tilt now overshoots the other way (the face
lifted, which the owner dislikes most) with no bust in the frame. Levers for that, untested: a
capture with the head tipped less (the green eyes would then sit deeper under the brow, and the
question is whether the model still paints them open), the bust dial brought back beside the
green-eyed capture, or the eyes-level line dropped in favour of the bound one alone. The owner
rules from the sheet. On the side, before the redirect, `bust-2` and `bust-3` got open eyes
drawn in with sharp (a lens, a grey iris, a lid line), filed as
`03-side-result-busts-with-drawn-eyes` with no render behind them; the `edit-image` way was
not run.

**The bust back beside the green eyes (2026-10-17, evening, on the owner's word; 2 renders,
$0.08; tokens 5 and 6 in the same review folder).** The owner, told the head lifts without an
anchor, asked what had locked heads before (the bust) and said run the two together: the
green-eyed capture as the source, `bust-2` attached as the tilt anchor with the server's own
binding ("tip the figure's head exactly like it ... take nothing else from it"), the bound eyes
line, `headRetries: 0`. *Result, by my eye:* **both heads at the capture's tilt and both eyes
reading**, Tychon's under heavy brows, Cecil's green under the swept hair; the figure framed
larger (26 and 37% of the plate against about 10% without the bust) and the body more top-down,
the crown and shoulders seen from above; outfit, build and pose held, the anatomy count clean
(the tilt check said `right` with eyes on both, reported only). So on this pair the two halves
add: the bust holds the tilt as it always did, and the green eyes on the capture supply what the
bust's empty sockets never did, eyes open on the first render with no edit. Two renders say
nothing about a rate; the owner's eye on the six, then the question is whether the green-eyed
capture replaces the grey ones (one HeroForge export per capture, the eyes painted, the library
re-shot) or the eyes are painted onto the existing captures by script, which the drawn busts
in folder 03 suggest is a few lines of sharp.

**The capture's camera is 90 degrees, and every capture will be (the owner, 2026-10-17, evening,
after the bust pair).** On the big head: the owner read it as a scale mismatch between the
mannequin and the bust; measured, the delivered figure box is the same with and without the bust
(470 by 390 for Tychon), so the head's share of the figure changed, not the figure's size, and I
ranked the causes as the bust pulling the camera, the capture's own close head, the bust's pixel
scale (low: the library captures frame the figure the same and bust-2 sat beside them through
about a hundred renders unflagged) and variance at n=1. I had also called the new capture an
80-degree shot, which was wrong: **the owner's word is that it is at 90 degrees, the standard
from here, and the whole library will be recaptured at it.** The rule: no reference to the
fifteen-degree pitch anywhere, and the words bind the body strictly to a 90-degree top-down
camera. Done: `MANNEQUIN_EDIT_SOURCE` now names the capture as shot from directly above in a
90-degree orthographic top-down view and asks for the figure under exactly that camera, the body
never leaning or turned toward the viewer; `MANNEQUIN_EDIT_KEEP` adds "under the mannequin's own
90-degree top-down camera"; the capture rule here, the mannequins README and shot list, the heads
README, the skill's camera bullet and CLAUDE.md's State block say the same; the prompt no longer
re-renders the capture "seen from directly above" as if it were not. Not changed: the bust
binding ("take nothing else from it") and the head path. Note for the next render: the MCP
server process loaded the old `dist/` at session start, so an `edit-image` call through it sends
the old wording until Claude Code restarts; `npm run headtest` runs from the rebuilt `dist/` at
once.

**The campaign's recipe on the rebuilt server (2026-10-17, evening, after the owner's restart; 2
renders, $0.09; tokens 7 and 8 in the same review folder).** The owner asked for Tychon and Cecil
again "as if the campaign were calling the tool": the call built the way the illustration-builder
skill builds a PC token, the shelf's identity anchor as the figure, the portrait's head-to-waist
crop as `character` with `headAnchor: "bust-2"` (the crop bound to identity, the bust to the
head), the shelf's tokens-and-portraits finish line with the key light from out of frame on the
left, the bound green-eyes line added, `headRetries: 0` as the owner's standing word, on the
green-eyed capture under the new lead line. *Result, by my eye:* **both bodies fully top-down at
the capture's camera**, the feet beneath the body, the crown and shoulders the largest shapes, and
Tychon's head in proportion this time (the big head of token 5 did not repeat). Tychon's head at
the capture's tilt, both eyes reading under heavy brows (the check: `right`, eyes); Cecil's head a
step lower than the capture's, both eyes present but narrow under the brow (the check:
`far-down`, eyes). The portrait crop pulled the kit toward the portraits as the recipe says it
does (Tychon's robe came back as the patched teal tunic of his portrait, Cecil's lute on his
back). Nothing concluded from two renders; the owner's eye on the eight.

**The Elders the same way (2026-10-17, evening, on the owner's word after tokens 7 and 8: "these
are good, and have eyes. do the elders this way, too"; 4 renders, $0.17; filed as
`Desktop\TokenImprovements2\04-the-elders-campaign-recipe`).** Ansel Lowmarrow, Tobin Hale, Brom
Korrin and Cassia Vell, each one `edit-image` built the skill's way: the look from the world entry
and the shelf, a head-to-waist crop of the Elder's portrait as `character` beside `bust-2`, the
shelf's finish line with the Hearth's lights, the bound green-eyes line, all four on the one
90-degree green-eyed human-male capture (so build is words and crop, not a body), `headRetries: 0`.
*Result, by my eye:* **three of four with both eyes reading on the first render** (Ansel behind his
spectacles, Tobin under a heavy brow, Cassia), every body top-down at the capture's camera, the
held objects placed (ledger, chalk glowing blue, knife), the kit from the portraits. **Brom's head
is bowed into the beard with the eyes not showing** (the check: `far-down`, no eyes), the one miss;
the beard and the bald crown may be what the bust's tilt met there. Across the day's green-eyed
renders with a bust beside the crop: eyes on 5 of 6 first renders (Tychon 7, Cecil 8 narrow, Ansel,
Tobin, Cassia; Brom not), against about half on the grey captures. The owner's eye on the four.

**Where the green-eyed route's outputs live (the owner, 2026-10-17, evening):** in subfolders of
`Desktop\EyeColorTests`, beside the capture: `01-tychon-and-cecil` (the eight tokens filed above as
`TokenImprovements2\02-...`) and `02-the-elders` (filed above as `04-...`); both moved there on the
owner's word, and every later set on this route goes there too. `TokenImprovements2` keeps the
end-to-end run and the drawn-eyes busts.

**Kartor, Lysandra and the ten PHB species (2026-10-17, evening, on the owner's word: "do the other
2 pcs using this method, then do one of each of the PHB races, each sex, with a variety of items
they might be holding"; 23 renders, about $1.00; filed as `EyeColorTests\03-kartor-and-lysandra`
and `04-phb-species`, the tokens copied to the Desktop as each landed, the owner's rule from here).**
The two PCs the campaign's way (crop as `character` beside bust-2): both with eyes reading, Kartor
at the capture's tilt with the battleaxe and plank shield, Lysandra's head a step down with the
gold eyes showing, the runed sword and the violet flame placed. The twenty species words-only (no
crop, so the server attached bust-2 itself), each an invented figure in the house finish with a
different held item, on the one human-male capture: by my eye **nineteen of twenty with the face
and both eyes reading on the first render**; the one miss the aasimar woman, head bowed (the check:
`far-down`, no eyes); the dragonborn read as snouts from above with the eyes at the edge. Build
came from words alone: the dwarves and halflings short and broad, the goliaths hulking, the gnomes
small, which the one-body question asked and this answers on twenty. One refusal: the dwarf
woman's level crossbow clipped the edge twice and was redone held upright. Across the evening on
the green-eyed capture with bust-2 (the Elders, the four PCs, the twenty): **eyes reading on 27 of
30 first renders** by my eye, against about half on the grey captures; the owner's eye rules.

**`headAnchor: "capture"` (2026-10-17, evening, for the owner's next test).** The owner's second
capture is the same stance shot straight down with the head crown-only, no eyes and no green
marks: "I want to test a method where we just do top down and not worry about the eyes so much."
The server had no way to render it as shot: with no character reference it attaches a bust or
writes the head-tilted-up words; with one it binds the crop to carry the tilt, or a bust beside
it. So a third choice, `"capture"`: nothing attached and nothing said about the head, the
capture's own head painted as it is, a character reference bound to identity only (`src/heads.ts`,
`src/tools/edit.ts`, one test, 190 pass). `scripts/research/topdown.mjs` runs the eight (the four
PCs on their headtest crops, the four Elders on the crops from the previous set) from the rebuilt
`dist/` with `headRetries: 0`, copying each token to `EyeColorTests\05-fully-top-down-no-eyes`
as it lands. The result follows.

**The fully-top-down test ran (2026-10-17, 17:38; 8 renders, $0.38; `headtest/2026-10-17-17-38-topdown/`,
the tokens in `EyeColorTests\05-fully-top-down-no-eyes` with a sheet beside the capture).** The
four PCs and the four Elders on the crown-only capture with `headAnchor: "capture"`. *Result, by
my eye:* **all eight painted as the capture is shot**: the crown of the head and the hair or cap
the largest shape, the face hidden or a sliver of brow and nose showing (Tychon, Kartor, Brom), the
body fully top-down with the shoulders and feet beneath, the kit from the portrait crops held
(Kartor's axe and shield, Lysandra's flame and runed sword, Cecil's lute on his back, Ansel's
ledger, Brom's blue chalk, Cassia's knife), every anatomy count clean. The tilt check called all
eight `far-down` with no eyes, which is the capture's head described exactly, so on this route the
check is not a gate but a description. No eyes were asked for and none are shown. Whether a
crown-only head is what the owner wants at the table is the owner's call from the sheet; if it is,
the route is one call per token with no bust, no green marks and no head check in the loop, and
the eyes question dissolves.

**The no-green control (2026-10-17, 18:15, on the owner's word: "paint out the green eye, make a
new graphics document and run the test", then "do the elders and pcs in that test too"; 18
renders, $0.85; `headtest/2026-10-17-18-15-nogreen/`, filed as `EyeColorTests\06-no-green-control`
with each control beside its green twin on one sheet).** The owner read the day's 27 of 30 as "the
green eye is the fix"; the confound was that the green marks and the 90-degree capture arrived
together. So the same capture with the green painted out by script (`Mann 15 Stand
3-Portrait-nogreen.png`, the 67 green pixels and a one-pixel fringe filled from the grey around
them), the same words with the eyes line kept but naming the mannequin's eyes and no green, the
same bust-2, the four PCs and four Elders on their crops and ten species words-only, checks
report-only (`scripts/research/nogreen.mjs`). *Result, the control against its green twin:*

| | eyes reading, by my eye | by the eyes check |
| --- | --- | --- |
| green marks (the twins) | 17 of 18 | 16 of 18 |
| no green, same capture | 12 of 18 | 11 of 18 |

The six the green had and the control lost: Cecil, Tobin, Cassia, the dwarf man, the gnome man and
the goliath woman, every one a head bowed a step with the eyes under the brow; Brom failed both
ways. The heads sit lower without the marks on most of the eighteen, so the green is doing two
things: placing the eyes and, it seems, holding the tilt. What it says: **both halves are real.**
The capture alone, shot at 90 with the head tipped up and bust-2 beside it, lands eyes on about
two in three, against about half on the grey library; the green marks on top take it to about
nineteen in twenty. So the recapture carries most of the gain, and the green marks are worth
painting on every capture (two slivers, by script or in HeroForge) for the rest. At eighteen a side
this is one run, not a rate to three places; the owner's eye on the sheet.

**Green eyes scripted onto the library, thirty across the board (2026-10-17, 18:32, on the owner's
word: "copy the current mannequins, script them green eyes, and let's run 30 test samples using a
variety of poses and weapons ... and sexes/races/genders"; 30 socket calls at a fifth of a cent and
30 renders, $1.41; `headtest/2026-10-17-18-32-greenlib/`, filed as `EyeColorTests\07-library-green`
with the marked captures, the placement review sheet and the thirty tokens).** Thirty captures of
the library as it stands (the 2026-10-15 shots at the library's own camera), every one of the
twelve bodies two or three times, twenty-four standing and combat setups, no body-and-setup pair
twice. The marks: the check model asked for the two eye sockets as boxes on the figure crop
(`scripts/research/greenlib.mjs mark`), two green lenses drawn at the box centres sized to the
figure (3.8% of its height wide), the owner's green; I reviewed all thirty heads at 3x and
overrode none, every pair sitting on the socket line either side of the nose. Then thirty
words-only renders, an invented figure per body with the setup's weapon named, the bound
green-eyes line, bust-2 attached by the server, checks report-only. *Result:* by the eyes check
**27 of 30**, by my eye about 26 of 30, with the face and both eyes reading; the misses are the
dwarf on `twohand-staff-level`, the goliath on `twohand-right`, the orc on `twohand-staff-diagonal`
and, by my eye, the orc on `twohand-staff-level`: **every miss a two-handed staff or axe capture
whose head is bowed toward the weapon**, where the green sits under a brow the model keeps.
Build held per body (the dwarves broad, the halfling and gnome small, the goliaths huge, the orcs
tusked), the weapons came out as named and inside the frame on all thirty, and the library's
camera shows: several bodies lean front-of-above (the human man, the elf man), which the 90-degree
recapture is for. So the green marks move the library's rate from about half to about nine in
ten on their own, before any recapture; with the 90-degree camera the owner's capture gave 27 of
30 in the same ballpark, and the bowed-head staff poses are the remaining class of miss. One run
each; the owner's eye on the sheet.

**The same thirty on the human-male captures only (2026-10-17, 19:09, on the owner's word: "do
those same inputs, this time just use the male human pose for them all ... I want to see if we
can cut the number of total poses since other tests showed male pretty much works"; 30 socket
calls and 30 renders, $1.43; `headtest/2026-10-17-19-09-greenlib-human-male/`, filed as
`EyeColorTests\08-library-green-one-body-human-male` with each token beside its own-body twin from
folder 07 on one sheet).** The thirty figures and setups of the previous run, the words unchanged,
every one on the human-male capture of its setup with green eyes scripted the same way (every
placement reviewed, none overridden); twenty-four distinct captures, six used twice. *Result:* by
the eyes check **28 of 30** (against 27 of 30 on the matched bodies), the two misses the human
man on `twohand-staff-brace` (`far-down`, a capture that passed in the matched run, so variance)
and the dwarf on `stand-shortbow-draw` (`down`, no eyes); **the three staff-and-axe misses of the
matched run all passed on the human-male captures**, whose heads are bowed less than the dwarf's,
the goliath's and the orc's on those setups. By my eye on the pairs sheet the builds held from
words alone: the dwarves broad and short, the halfling and gnome small, the goliaths huge, the
orcs tusked and heavy, the elves slim, each pair near-twins in pose, weapon and kit, the
human-male one a touch taller through the body on the dwarves and small folk. So on this run the
one-body route costs nothing in eyes and little in build, which is the one-body question of
2026-10-16 asked again with the green marks and the current checks in place and answered the same
way; the library of 312 could be the 26 human-male captures (recaptured at 90 with green eyes)
plus whatever the owner's eye says the small and large bodies still need. The owner rules from
the pairs sheet; nothing is cut on this.

*The owner's reading of the pairs sheet (2026-10-17, evening, verbatim):* "the pairs mostly match,
really just down to variance of the model." A reading, not a word to cut the library; what follows
from it waits on the owner.

### The path from here (the owner, 2026-10-17, evening)

The owner's word, verbatim, after the one-body pairs: "so the go forward path is to just use the
human male, with variety of poses. racial/sex diversity doesnt really matter and is addressed in
the text." Earlier the same evening: "this new mannequin is at 90 degree angle, which i think we
need to use going forward. yes, that means i will have to recapture them all", and on the green
marks, the no-green control's 12 of 18 against 17 of 18.

**So the library going forward is one body, the human male, one capture per pose and setup, shot
straight down at 90 degrees with the two eyes painted chroma green, bust-2 beside it on the
render; race, sex, age and build come from the words and a portrait crop.** The evidence behind
it, each a run of this evening: the green-eyed 90-degree capture at 27 of 30 first renders with
eyes across the PCs, the Elders and twenty species of both sexes; the library's own captures with
green marks scripted on at 27 of 30, and the same thirty on the human-male captures at 28 of 30
with every pair near-twins in build ("the pairs mostly match, really just down to variance of the
model"); the no-green control showing the marks worth about a third of the eyes on their own.

What follows, in order, and what waits:

1. **The recapture is the owner's**: the human-male captures of every standing and combat setup
   (24 today, plus prone and dead, plus any new pose) re-shot in HeroForge at 90 degrees with the
   eyes painted green, exported with alpha at 1024, one file per setup, under the capture rules
   below. Until they exist the library of 312 stays as it is and the skill's route stays as it is;
   nothing is cut ahead of the captures.
2. **When a 90-degree green-eyed capture lands**, `scripts/mannequin.mjs take` files it (the
   naming drops body and sex once the human male is the only body: `mannequin-<pose>-<setup>.png`,
   with the old names kept until the last body goes), the shot list and the skill's capture pick
   change with it, and a green capture is checked for its two marks the way the clip check reads
   the plate edge.
3. **The server as it stands carries the route**: `source: "mannequin"`, the green-eyes line in
   the instruction (to move into the keep line once the captures all carry marks, so the skill
   says nothing about the eyes), `headAnchor: "bust-2"` beside a portrait crop or the bust the
   server attaches, the checks report-only until the owner says what the loop should do with a
   miss on this route (one in ten, all bowed heads).
4. **The eye marks on the captures that exist** can be scripted the `greenlib.mjs mark` way as a
   stopgap for any human-male setup the owner has not re-shot yet; the review sheet stays the
   gate on each placement.

The capture rules change: every capture is the human male; the camera straight down at 90; the
two eyes painted the owner's green (about `rgb(190,240,48)`), each a lens the width of about 4% of
the figure's height; alpha, 1024 square; the weapon in a closed fist and wholly inside the frame.

### The pipeline, locked (the owner, 2026-10-17, late evening)

The owner asked for the order in simple terms, read it back, and locked it ("lock the above as
our planned go forward and write it in"). This is the route for every humanoid token from here,
one paint per token:

1. The skill reads the character (the bio, the shelf's anchor, the portrait if there is one) and
   writes the description: race, sex, age, build, face, kit, the weapon, the green-eyes line, the
   house finish line. Race and sex live here, in the words, not in the capture.
2. The skill picks the capture by file name, by pose and setup, to match what the character holds.
   One body, the human male; the server never chooses a pose.
3. The capture carries two green marks where the eyes are (painted in HeroForge, or scripted on
   the `greenlib.mjs mark` way and reviewed), and the skill passes bust-2 beside a portrait crop
   (`headAnchor: "bust-2"`) or lets the server attach it.
4. One call: the capture, the crop if any, bust-2, and the description wrapped in the server's
   own words (the lead sentence binding pose, camera, proportions and grip; the keep line; the
   bust binding; the plate sentence). The model paints once.
5. The server keys the plate off, refuses a figure that clips the edge twice, fits the figure to
   its square, counts the anatomy and **reports** the head and eyes words. It steers nothing and
   edits nothing: `headRetries` defaults to 0 from this commit.
6. The skill looks at the token and the report, re-rolls a bowed head (about one in ten on the
   green-eyed captures, four cents), fixes a flaw with one edit, and uploads on the owner's word.

**Retired from the default, kept in the code for now:** the bust dial and the steered re-renders,
the eyes edit on the plate, the five-crop tilt ruler as a gate. They stay reachable with
`headRetries: 1` or `2` and are slated for deletion once a thirty-token run on the recaptured
library holds the rate; the ruled crops in `mannequins/heads/band/` stay as the record of the
owner's criteria whatever happens to the code. **Kept:** bust-2 beside the capture, the green
marks, the clip check, the cutout and the fit, the anatomy count as a report. No further checks
are added unless the rate drops on the new captures, and then the one the miss asks for.

**The owner's "for fun" test, same evening:** a bust with two open eyes drawn in by script
(`bust-2-eyes.png`, the morning's sharp drawing, now a named `headAnchor` choice bound with its
eyes named: "have both of its eyes open exactly as they are here"), against the grey bust-2 on the
no-green capture, where the eyes had room to move (12 of 18 with the grey bust). My expectation
going in, written here so it can be wrong: little or no change, since the misses on that capture
were bowed heads and a bust does not lift one. The result follows.

**The eyed bust ran (2026-10-17, 19:41; 10 renders, $0.47; `headtest/2026-10-17-19-41-nogreen-bust-2-eyes/`,
filed as `EyeColorTests\09-eyed-bust-bust-2-eyes` with each token beside its grey-bust twin from
the no-green control).** The ten species of the control, the same words, the no-green capture,
`bust-2-eyes` in place of the grey bust-2. *Result:*

| on the no-green capture | eyes reading, by the check | by my eye |
| --- | --- | --- |
| grey bust-2 (the control's ten) | 7 of 10 | 7 of 10 |
| bust-2-eyes | 10 of 10 | 9 or 10 of 10 |

The three the grey bust lost, the dwarf, the gnome and the goliath woman, all read with the eyed
bust, and the heads sit a step higher across the ten. One likeness slip on the eyed side: the
tiefling came back pale-skinned with no horns (eyes present), which is a thing the model does
on its own one time in twenty and not a thing a bust binding would cause, but it is on the sheet.
**My expectation going in was wrong**: I wrote that a bust does not lift a bowed head and the
eyes would not move; on this run the eyed bust lifted the heads and delivered the eyes. Ten a
side is one run, and this capture had no green marks, so the eyed bust was doing the work the
marks do on the real route. Whether it adds anything on top of the green-eyed captures, where the
rate is already about nine in ten, is a separate question and the one that matters for the path:
ten species on the green-eyed capture with each bust would answer it for about 90 cents. The owner
says whether to run it.

### Scoring the checks

Each stage's sheet is also a scored set: the owner's rulings per cell, recorded in the run's
folder beside the manifest, against the head check's verdicts. The numbers to watch are the head
check's agreement with the owner, per race and per pose, and the anatomy check's hits and
misses on real flaws. The tooling for it (a numbered sheet, a rulings file, a score line) is
the next code step, built when stage 1 produces the first rulings and not before.

### After the stages

Only then a ruling, and it may be any of: one body; one body plus the one or two the hard
builds need; the library as it is. What a one-body ruling would bring is written here so it is
not re-thought later, and none of it starts before the ruling: the library cut to the
human-male captures (renamed `mannequin-<pose>-<setup>.png`, body and sex out of
`scripts/mannequin.mjs`, the README's shot list, the skill's capture pick and the headtest
set, build always written); new poses at one export each, every one vetted the stage-6 way
before it joins the list (candidates: cast, guard, sneak, carry, sit, kneel, shield-wall,
dual-raised, polearm-lunge, fallen-side); and a batch script grown from headtest (items in, a
graded sheet out) once the head path is stable, so a flaw pass starts from flagged cells.

Folded in from before: whether the universal route should default to bust-3 is stage 5; the
stale worktree `.claude/worktrees/elegant-franklin-bdff24` (detached, clean) is housekeeping.
