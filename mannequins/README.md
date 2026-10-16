# Mannequins

Grey HeroForge captures that `fvtt-mcp-imagegen`'s `edit-image` (kind `token`, flash, no
references) turns into any humanoid token: the mannequin fixes pose, proportions and grip (the
camera comes from the tool's words: a 90-degree orthographic body, head tilted up, the owner's
standard since 2026-10-16; the captures' own fifteen-degree pitch is overridden) and
grip; the words supply the rest. The plan, the lessons and the render recipe are in that repo's
`notes/mannequin-tokens/PLAN.md`; this folder is only the library and its shot list.

**Public since 2026-10-16 (the owner's ruling):** the captures are unpainted grey poses with no
copyright of their own, so they live here with the server that uses them. Until then they sat in
the private `fvtt-assets-actors`, which holds finished art only. For anything commercial, read
HeroForge's terms or swap the capture step to an open source.

## Files

`mannequin-<body>-<sex>-<pose>-<setup>.png`, 1024 square, alpha, grey, no base, no rim, no
outline. Bodies: `large`, `human` (medium), `dwarf`, `small` (halfling, gnome, goblin, kobold),
`orc`, `elf`; each in `male` and `female`. Poses: `combat` (was `crouch` until 2026-10-15), `stand`, `dead`, `prone`, `twohand`, `cast` (only if
the open question in the plan says so). Setups are what the hands hold in the same pose:
`empty`, `sword`, `sword-open`, `longsword-open`, `sword-shield`, `longsword-kite`, `dagger-shield`, `twodaggers`, `sword-dagger`, `shortblade`, `twoblades`, `spear-shield`,
`crossbow-shield`, `crossbow-hip`, `crossbow-down`, `bow`.

## Taking a capture

HeroForge exports to `~/Downloads/Hero-Portrait*.png`. From this folder:

```bash
npm run mannequin -- check
```

reports every export there: size, alpha, how many clear pixels on each side, how much of the
frame the figure fills. `FAIL` means the figure or its weapon crosses the edge (the imagegen edge
check would refuse the render, twice, and bill both); `tight` means under 24 px clear, which has
rendered but leaves the model no room. Then file the good one under its name:

```bash
npm run mannequin -- take "~/Downloads/Hero-Portrait (3).png" human male combat sword-shield
```

For a whole set in the fixed order, `npm run mannequin -- takeset "Mann 11 Dual Wield" combat twodaggers`
files all twelve at once, sorted by export number (HeroForge's numbering can skip), and refuses
unless exactly twelve are there and all pass.

`take` checks again, refuses a failing capture (`--force` to keep it anyway), and moves the file
here. `npm run mannequin -- list` re-checks the whole library. Commit after each session.

## Shot list

One saved top-down camera (Share › Booth, about fifteen degrees off vertical; straight down for
`down`) for every capture. Weapon in a closed fist, plain rather than ornate, wholly inside the
frame; arms held off the torso. After every body or weapon swap, check the weapon is still inside
the frame and the grip and shield strap still line up.

The owner captures one setup at a time across every body, male then female for each. From
`longsword-open` on, the order is fixed: human, large, small, dwarf, orc, elf, male then female.
Earlier sets varied and were read by eye. HeroForge names an export after
the saved model (`Mann 01 Spear and Shield-Portrait (n).png`), which may lag the setup in it.

**✓** both sexes filed and identified with confidence. **❌** a miss or a doubt the owner must look
at: a missing body or sex, a capture that failed the check, or one whose body or sex was a
judgement call. Every ❌ has a line under **Flags** saying why; clear it there when settled.
`npm run mannequin -- grid` rebuilds the grid from the files and puts ❌ on any missing cell.

**The combat is complete (2026-10-15):** 12 setups, six bodies, both sexes, 144 captures in all.
What remains is the other poses below it.

| Setup | large | human | dwarf | small | orc | elf | Filed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `combat-spear-shield` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-dagger-shield` (a curved short blade) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-empty` (both hands open; answers the caster question) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-sword-open` (sword variant 1, the off hand raised open; the sword-only setup, captured after all) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-longsword-open` (sword variant 2, the off hand raised open; the owner's reference order) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-sword-shield` | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-longsword-kite` (the noble variant: a long straight sword, a kite shield) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| ~~`combat-shortblade`~~ covered: `dagger-shield` with the shield removed | — | — | — | — | — | — | not needed |
| `combat-twodaggers` (a curved dagger in each fist, the off hand raised; the two-blades setup, captured after all) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-sword-dagger` (a sword low, a curved dagger raised) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| ~~`combat-crossbow-shield`~~ dropped: a crossbow capture plus a shield in words | — | — | — | — | — | — | not needed |
| `combat-crossbow-hip` (held across the hip, the off hand raised open) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-crossbow-down` (pointing straight down, the off hand raised open) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `combat-bow` (a longbow held low across the body, the off hand raised open) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `twohand-right` (a low braced stance, a greatsword upright at the right shoulder in both fists) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `twohand-left` (the greatsword upright at the left side, the body twisting away, one leg out) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `twohand-staff-level` (a plain staff held level across the waist in both fists: quarterstaff, spear or polearm at guard) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `twohand-staff-diagonal` (the staff held diagonally across the body, one end low) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `twohand-staff-brace` (the staff running lower left to upper right across a turned body, both hands near its middle: a braced spear or a staff on guard) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `dead` (on its back, arms out; camera straight down; no setup) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `prone` (knocked down onto the knees, braced on the fists, head bowed; no setup. The chest is hidden, so sex rests on the fixed order) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| ~~`cast`~~ dropped: `combat-empty` makes good casters (a wizard and a sorcerer, 2026-10-15) | — | — | — | — | — | — | not needed |

### The standing pose

Standing, arms a little out from the body, the camera in front and above (the chest and face
show). Two variants per body (tested 2026-10-15, 16 renders): empty closed fists, and a short
blade with a shield. A closed empty fist takes a written weapon; the shield can be reshaped,
resized, removed or added.

| Setup | large | human | dwarf | small | orc | elf | Filed |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `stand-dagger-shield` (a short blade low, a round shield facing the camera) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-dagger-open` (a short blade low, the other hand empty) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-empty` (both fists closed and empty) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-open` (both hands open and spread, arms out from the body: casters, gestures, anything carried in an open hand) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-bow` (a longbow held low in one fist, the other hand raised to the shoulder to draw an arrow) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-bow-draw` (a plain longbow upright at full draw, the arrow pointing left; replaced the leafy carved bow 2026-10-15; the bowstring renders tip to tip, never drawn back; the orc male sits 11 px from the left edge) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |
| `stand-shortbow-draw` (a plain recurve shortbow at full draw, the same stance) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 2026-10-15 |

### Flags

None open.

Verified 2026-10-15 against `longsword-open`, exported in the owner's stated order: every
capture's body and sex agree. Captures saved from the same HeroForge model match pixel for
pixel (40–94% identical against at most 21% for any other body). Across models, the open-hand
figure's top row lands within 0–2 px of the reference, while male and female of one body sit
14–34 px apart. `combat-empty` lands on the reference rows exactly.

(Earlier, also settled 2026-10-15: the spear set's dwarf and small match the other sets pixel for
pixel, and the owner confirmed the dwarf is the muscled body, the small one slight.)

Notes on filed captures:

- `combat-crossbow-down`, orc male and female: re-exported with the camera pulled back, at **0.89
  scale** of every other capture. At full scale the male stood 1012 px tall (raised hand to crossbow
  tip) in a 1024 frame. This does not reach the token: the cut fits every figure to its square.

- **A shield capture covers the shieldless setups** (tested 2026-10-15, one render each, all clean
  first pass): remove the shield by naming its parts ("no disc, rim, studs or arm straps remain
  anywhere") and say what the freed hand does (open for balance, a second blade, a lantern).

- `combat-spear-shield`: the large male and orc male spear butts sit 17 and 12 px from the left
  edge. They pass, but they're the first to suspect if a render is refused for clipping.
- All six bodies were proven on the spear and shield set (18 test renders, 2026-10-15; results in
  the imagegen plan's lessons).

## Library

`npm run mannequin -- list` is the inventory.
