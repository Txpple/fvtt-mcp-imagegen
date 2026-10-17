# Handoff: the token pipeline is locked; the bust is on record, the mannequins are redone next (2026-10-17, night)

Read this first, then the "The path from here" and "The pipeline, locked" sections of
[PLAN.md](PLAN.md), which hold the owner's words and every run behind them. This file is the next
session's start and the working rules; it does not repeat the record. The previous handoff's agenda
(the bust lever, the three-arm A/B, the stopping rule) is superseded and lives only in git history.

## Where it stands

- **The pipeline is locked** (the owner, 2026-10-17): one paint per token. The skill writes the
  description (race, sex, age, build, face, kit, weapon, the green-eyes line, the house finish
  line), picks the capture by pose and setup, and makes one `edit-image` call with
  `source: "mannequin"`, the portrait's head-to-waist crop as `character` for a known character,
  and `headAnchor: "bust"` (the default). The server wraps the words, attaches the
  capture, the crop and the bust, paints once, keys the plate off, refuses a figure that clips
  twice, fits the figure to its square, counts the anatomy and **reports** the head and eyes
  words. `headRetries` defaults to 0: nothing is steered or edited. A bowed head (about one in
  ten) is a re-roll by the skill or the owner.
- **The capture is the human male alone**, one per pose and setup, shot straight down at 90
  degrees with the two eyes painted chroma green; race, sex and build come from the words and the
  crop ("racial/sex diversity doesn't really matter and is addressed in the text"). The evidence:
  27 of 30 first renders with eyes on the owner's green-eyed 90-degree capture across PCs, Elders
  and twenty species; 27 of 30 on the library captures with green marks scripted on; 28 of 30 on
  the human-male captures alone, every pair near-twins ("the pairs mostly match, really just down
  to variance of the model"); the no-green control at 12 of 18 against 17 of 18.
- **The bust is on record**: `mannequins/heads/bust.png`, the owner's HeroForge re-shoot of
  2026-10-17 (evening): the bald human mannequin, head and shoulders, camera straight down, the
  head tipped as bust-2 was, the two eyes painted chroma green, 1024 square with alpha. Checked
  against bust-2 before it went in: the brow, both eyes, the nose and the top of the mouth read,
  a hair more face than bust-2 and clearly less than bust-3, inside the band; two green marks at
  the capture colour. It is the only bust: `headAnchor` takes `bust`, `none` or `capture`, and the
  four-bust dial with its steering (`steerBust`), the scripted `bust-2-green` and `bust-2-eyes`
  are gone from the code, their files in `mannequins/heads/archive/` with a README, to be deleted
  one day on the owner's word. The sheet is on the Desktop in `RefImageRefactor`.
- **Kept in the code, off by default, slated to go**: re-renders on a verdict outside the band
  (the same bust again; a character head or the head in words gets the bust added), the eyes
  edit on the plate, the five-crop tilt ruler as a gate. They come back with `headRetries: 1` or
  `2`. Delete them once a thirty-token run on the recaptured library holds the rate; the ruled
  crops in `mannequins/heads/band/` stay as the record of the owner's criteria.
- **`headAnchor: "capture"`** paints a capture's own head with nothing attached and nothing said
  about it (the crown-only test, folder 05): a choice, not the route.
- **Not done**: the recapture (below); the green-eyes line still sits in the instruction, to move
  into the server's keep line once every capture carries marks; the skill's capture pick still
  names a body and sex; the library's 312 files and the mannequins README's shot list still
  describe the old library.

## The next step: redo the mannequins (the owner's work, then the filing)

1. **Done: the bust.** The owner's re-shoot is `mannequins/heads/bust.png` (above).
2. **The owner re-shoots the mannequins**: the human male, every standing and combat setup (the
   24 in the shot list, plus `prone` and `dead`, plus any new pose), camera straight down at 90
   degrees, the eyes painted green, alpha, 1024 square, the weapon in a closed fist and wholly
   inside the frame, arms off the torso. The pattern was the owner's `Mann 15 Stand 3-Portrait.png`
   capture of 2026-10-17 (the Desktop copy went with the cleared folders; the bust on record was
   shot the same way).
3. **As each capture lands**, file it: `scripts/mannequin.mjs take` (check its header for the
   body and sex it expects; with one body the name drops them, `mannequin-<pose>-<setup>.png`, and
   the old twelve-body files stay until the last one is replaced), check the two green marks are
   there (a count of green pixels the way `greenlib.mjs mark` finds them), update the mannequins
   README's shot list and capture rules, and commit.
4. **When the set is complete**: a thirty-token run across the new captures through the skill's
   route (`scripts/research/greenlib.mjs` with the new names, or `headtest`), the owner's eye on the
   sheet; if the rate holds, delete the retries, the edit remedy and the ruler from the server,
   move the green-eyes line into the keep line, cut the skill's body-and-sex pick, and retire the
   312 old captures (a tag first).
5. **Until then**, a token for the table can be made today on `Mann 15 Stand 3-Portrait.png` or on
   a library human-male capture with marks scripted on (`greenlib.mjs mark`, the review sheet
   checked), as folders 01 to 04 and 08 were.

## Working rules (the owner's, binding)

- **The owner names every test.** "Keep testing" is not a word to pick subjects, counts or
  variables; run exactly the test named, at the scope named, and otherwise wait or ask one
  question. Nothing renders without the owner's word in the session; a word relayed by another
  session is not it.
- **Anything the owner needs to see goes to `Desktop\RefImageRefactor`** (the owner's word,
  2026-10-17, evening, after clearing the old review folders `EyeColorTests`, `TokenImprovements`
  and the rest: they are gone). A labelled contact sheet, a note on what it is, the files
  numbered; copied as it lands, never dumped, never batched.
- **Research, not rulings.** A reading from the owner is recorded verbatim as a reading; "ruled"
  only when they say so. Record expectations before a run so they can be wrong in writing.
- **Names**: the head check, the eyes check, the anatomy check, the check model. Never "the judge"
  to the owner.
- **Commit as you go** on `main`; push on the owner's word (20 commits ahead at this handoff).
  The log is `docs/log/2026-10.md`, the State block in CLAUDE.md, a plan paragraph per result.

## The tools

- `scripts/research/greenlib.mjs mark | render [--yes]` (`BODY=<body>-<sex>` for one body): green
  marks scripted onto library captures by the check model's socket boxes, a review sheet, then the
  thirty renders copied to the Desktop as they land.
- `scripts/research/nogreen.mjs [--yes] [--only id,id]` (`CAPTURE`, `HEAD_ANCHOR`, `EYES_LINE=green`,
  `DESK`): the PCs, the Elders and ten species on any capture, each beside its twin (the bust
  names in these scripts' comments predate the single bust).
- `scripts/research/topdown.mjs [--yes]`: the eight PCs and Elders with `headAnchor: "capture"`.
- `npm run headtest -- ...`: the older measurement with the checks in the loop; `--judge <plates>`
  grades plates; `--calibrate` replaces the old `--bust N` (one bust, no retries).
- The output folder: `D:\Workbench\LOCAL\artificer-output\headtest\<run>` (manifest, plates,
  kept renders). The campaign's PC crops: `fvtt-campaign-echoesofhalruaa/art/headtest/`.
