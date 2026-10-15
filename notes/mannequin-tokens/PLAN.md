# Plan: tokens from a mannequin pose library ("mannequin tokens")

Written 2026-10-15 after two days of tests (2026-10-14/15) on the Echoes of Halruaa campaign:
about twenty character tokens, then ten class samples. Everything needed to pick this up cold is
in this file.

## Goal

A small, reusable library of grey 3D mannequins (top-down captures from HeroForge) that turns
into any humanoid token with one `edit-image` call: the mannequin fixes pose, camera, proportions
and grip; the words supply race, kit, colours and finish. About 3–4¢ a token on flash, no
re-rolls, and every token in a world shares one camera and one scale.

## Why mannequins (the problem they solve)

- **Words-only tokens drift.** `generate-image` makes detailed tokens from words, but the pose and
  camera wander from render to render, and the API has no seed. No training is possible: neither
  Nano Banana 2.1 nor Gemini 3 Pro Image can be fine-tuned.
- **Library restyles inherit the library.** A stock token keeps its pose (good) but also its
  flat drawing and odd angle; edits cannot lift it to the house finish, and cannot fix the angle.
- **A mannequin is a pose with nothing else in it.** No style to copy, no face to keep, no kit
  to fight. The edit only adds.

Where this sits next to the skill's existing routes (`illustration-builder` SKILL.md, token
section): words-only `generate` stays the route for creatures with no humanoid body (a flying
sword, a beast); a library restyle stays the route when the owner wants one exact library token
kept. **Any humanoid with a body type in the library starts from a mannequin.**

## What the tests showed

| Test | Result | Lesson |
| --- | --- | --- |
| Human mannequin made into a dwarf, and into a woman | The dwarf came out a stretched human; the woman got a man's hands | **Body type is the one thing words cannot change.** A dwarf body and a female body fixed both at the source. |
| Human body made into an elf, a tiefling, a half-orc | All clean, first pass | One human body covers every human-sized race. |
| Dwarf body made into a beardless dwarf woman | Clean | One dwarf body covers both sexes. |
| A weapon written into an open reaching hand | 3 bad grips in 4 renders (sword held by the pommel, staff through the wrist) | **Weapons go in the mannequin's closed fist**, captured in HeroForge. |
| A HeroForge weapon in the fist, repainted (ornate sword → plain steel → runed blade → battleaxe → warhammer) | Perfect grip every time | **The weapon repaints across types freely, but its length and angle carry over.** Capture a medium-length weapon. |
| Ten classes from existing mannequins (wizard, sorcerer, cleric, paladin, rogue, ranger, warlock, druid, barbarian, monk) | 8 good first pass; wizard, sorcerer, warlock and druid were the strongest | **Open hands and fists make every caster**: the spell is written in. Casters need no pose of their own. |
| Mannequin whose axe handle ran off the frame | Refused twice by the edge-clip check | **The weapon must sit wholly inside the capture.** |
| Ranger from a bow drawn across the body | Oversized bow, string and limbs that don't add up | Bows need to be edge-on and clear of the body. |
| Paladin with a sunburst painted on the shield | Shield came back plain | Small emblems are the first detail lost; expect a flaw pass for them. |
| A style token or portrait attached beside the mannequin | The attached subject got copied in | **Never attach a second image.** Words plus one mannequin, nothing else. |
| Variants by editing a finished render (darker, cloak, runes) | Pose held | One mannequin gives a whole wardrobe; fix faults with a flaw pass, never a re-roll. |
| Kicking, jumping, running, kneeling presets (looked at from above) | Legs barely read top-down | **Only the silhouette reads from above:** arms and weapons, not legs. |

## The library: 19 poses, 28 files

Five bodies × four poses, less the big frame's one-hand pose: 19 poses. With the free gear swaps
(bow, shield off) it is 28 exported files.

### Bodies

| Body | Covers |
| --- | --- |
| Human male | human, elf, half-elf, tiefling, half-orc, aasimar, dragonborn, genasi |
| Human female | the same, female |
| Dwarf | dwarves of both sexes |
| Halfling | halfling, gnome, goblin, kobold: anything Small |
| Big frame | goliath, orc, ogre, bugbear, hill giant |

### Poses

| # | Pose | Hands | Free variants (same pose, swap the gear) | Covers |
| --- | --- | --- | --- | --- |
| 1 | **Cast / shoot** | one arm thrust straight out, the other hand drawn back to the chest | empty hands; a bow held edge-on, clear of the body | every caster; archers |
| 2 | **One-hand weapon** | forward fist closed on a longsword-length weapon, other arm back | with a strapped shield; without, off hand open | fighter, paladin, cleric, rogue, guards, soldiers |
| 3 | **Two-hand weapon** | both fists together at the chest on one long shaft, held diagonally across the body | — | greatsword, greataxe, polearm, spear, staff; barbarian, staff casters |
| 4 | **Down** | on its back, arms out | — | the dead or unconscious token for any creature |

In HeroForge's pose presets these are close to: an arm-thrust-forward casting stance (pose 1), a
forward lunge with one fist leading (2), a guard with both fists together at the chest (3), and
lying flat on the back (4). The owner's labelled preset sheets are local only (below).

**Out of the library:** kneeling, jumping, running, kicking and idle standing. They don't read
from above, and pose 1 empty-handed does everything an idle pose would.

### Order

1. Human male and human female, all four poses (8 captures): most PCs and NPCs.
2. Dwarf and halfling, all four (8).
3. Big frame, poses 1, 3, 4 (3): big creatures rarely carry a shield.

Step 1 alone covers about four-fifths of what a campaign asks for.

## Capture rules (HeroForge)

1. Unpainted grey body, no clothing, no base, no rim (Stage tab: base and rim off).
2. **One saved top-down camera for every capture** (Share › Booth): about fifteen degrees off
   vertical for standing figures, straight down for the down pose.
3. Export with alpha: the PNG comes out already cut, no backdrop needed.
4. Weapon in a **closed fist**, medium length, **wholly inside the frame**.
5. Arms held off the torso so the silhouette reads from above.
6. Name `mannequin-<body>-<pose>[-<variant>].png`, for example `mannequin-female-onehand-shield.png`,
   `mannequin-halfling-cast-bow.png`, `mannequin-big-down.png`.

**Licensing:** HeroForge captures are a private intermediate. They never go in this repo (it is
public) or any other public repo. For anything commercial, read HeroForge's terms or swap the
capture step to an open source (PoseMy.Art, MakeHuman).

## The render recipe

`edit-image`, `kind: "token"`, flash, the mannequin as `sourceImage`, **no references**:

```
Turn this grey mannequin into <race, sex, age, build, face, hair>, in <clothing and armour>.
The <weapon> in the fist becomes <new weapon>; the <shield> becomes <new shield>.
<Any magic: "the hand at the lower right casts a crackling ball of violet force">.
<Anything the mannequin lacks: tail, cloak, wings, a second weapon, a light source>.
Dark epic painterly rendering, the figure mostly in deep shadow with <light source> as the key
light and a faint cold rim light on the far edges, deep blacks and <dark colours>, crisp fine
detail on <materials>; nothing bright except <light source>, nothing left grey clay.
```

- Name hands by **where they are in the image** ("the hand at the lower left"), never left and
  right: the model reads those both ways.
- Name everything the mannequin lacks; it adds nothing unasked.
- The finish line is the house style (campaign `art/SHELF.md`); swap it for another campaign's.
- Fix a fault with one flaw pass on the render, naming the one thing and ending "keep everything
  else identical". Never re-roll: the pose anchor survives a pass, not a new render.
- Variants (darker, cloaked, wounded) are edits of the finished token.

## Build-out steps

1. **Capture** the 19 poses (28 files) in the order above (owner, in HeroForge).
2. **Store** the captures privately: the owner's art repo (`fvtt-assets-actors`, private) or the
   campaign repo, never here. Record the path in step 4.
3. **Prove** each new body with three tokens (a caster, a one-hander, a two-hander) before
   capturing the rest of it; keep anything learned in the table above.
4. **Skill:** add a "mannequin route" to `illustration-builder`'s token section: when to use it
   (any humanoid whose body is in the library), where the library lives, how to pick the pose
   (by how the hands hold, not by class), the recipe above. Make it the default for humanoid PCs
   and NPCs, ahead of words-only and library restyles.
5. **No new tool.** This is skill judgment over the existing `edit-image` token kind (house rule:
   tools do, skills decide). Revisit only if the prompt shape above starts living in every call:
   then a `mannequin` source hint on `kind: "token"` could carry the fixed wording.

## Status (2026-10-15)

- Tested on an ad-hoc set of about 24 captures, mostly human-male poses, which are **legacy**:
  useful for tests, not the library. The library above starts from zero.
- Owner's working folder: `Desktop\mannequin-tokens` (`NOTES.md` there is the local index:
  legacy captures, the class samples, the labelled HeroForge preset sheets `heroforge-presets/`).
- Next: step 1, eight human captures.
