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
| A style token or portrait attached beside the mannequin | The attached subject got copied in | **Never attach a second image.** Words plus one mannequin. |
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

1. **Answer the open question** (two caster renders from the empty-handed combat pose).
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

## Status (2026-10-15, night)

- **The combat pose is complete:** 12 setups for all six bodies, male and female, 144 captures in
  `fvtt-assets-actors/mannequins/` (shot list and checks in its README). The setups are spear and
  shield, dagger and shield, sword and shield, longsword and kite, sword and open hand, longsword
  and open hand, both hands empty, crossbow at the hip, crossbow pointing down, longbow low, two
  daggers, and sword and dagger. Crossbow and shield was dropped: add the shield in words.
- **Verified:** every capture's body and sex, against a set exported in the owner's fixed order
  (human, large, small, dwarf, orc, elf; male then female). From that set on, `npm run mannequin --
  takeset` files a whole set in that order.
- **Scale is the token's, not the capture's:** the cut fits every figure to its square, so capture
  scale (the 0.89 crossbow-down orcs included) does not matter for tokens.
- **Tested:** 18 body renders, 12 gear renders, 3 coverage renders, and a dwarf with sword and
  dagger and with axe and dagger. Everything is on the owner's Desktop, `Manny Tests`.
- **Caster question answered:** the empty-handed combat pose makes casters; `cast` is dropped.
- **Standing pose tested:** two captures per body cover it (empty fists, short blade and shield);
  16 renders, all clean, including worn gear on the back and hip.
- **Adventurer test:** three characters across combat, standing, dead and a kneeling "prone"
  capture, 12 renders, all clean (Desktop, `Manny Tests/Adventurers`). The kneeling capture works.
- **Prone and bow-draw filed:** prone (kneeling on the fists) and a standing bow at full draw for
  all six bodies; the library is 228 captures. Full draw renders well but its string stays undrawn.
- **Two-handed tested:** the owner's capture covers greatsword, greataxe, halberd, maul,
  quarterstaff and glaive (12 renders, Desktop `Manny Tests/Two Hand`).
- **Two-handed filed:** right and left stances for all six bodies (24 captures; the library is 252).
  Eight more tests across both, all clean (Desktop, `Manny Tests/Two Hand`).
- **Bows at full draw:** the leafy longbow captures were replaced by a plain longbow, and a plain
  recurve shortbow was added (264 captures).
- **The shot list is complete.** Next: step 5, the skill's mannequin route.
