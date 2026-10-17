# Handoff: the token pipeline is locked; the busts and mannequins are redone next (2026-10-17, night)

Read this first, then the "The path from here" and "The pipeline, locked" sections of
[PLAN.md](PLAN.md), which hold the owner's words and every run behind them. This file is the next
session's start and the working rules; it does not repeat the record. The previous handoff's agenda
(the bust lever, the three-arm A/B, the stopping rule) is superseded and lives only in git history.

## Where it stands

- **The pipeline is locked** (the owner, 2026-10-17): one paint per token. The skill writes the
  description (race, sex, age, build, face, kit, weapon, the green-eyes line, the house finish
  line), picks the capture by pose and setup, and makes one `edit-image` call with
  `source: "mannequin"`, the portrait's head-to-waist crop as `character` for a known character,
  and `headAnchor: "bust-2-green"` (the default). The server wraps the words, attaches the
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
- **The bust is bust-2-green**: bust-2 with the capture's two green lenses drawn into its sockets
  by script, bound with the marks named. Beside the green-eyed capture it was a wash at ten a
  side (the gnome's rolled-up eyes fixed, the aasimar's face lifted); on a capture with no marks it
  was worth three in ten. The owner's word: "it doesn't hurt it seems, and can only help."
- **Kept in the code, off by default, slated to go**: the bust dial and steered re-renders, the
  eyes edit on the plate, the five-crop tilt ruler as a gate. They come back with
  `headRetries: 1` or `2`. Delete them once a thirty-token run on the recaptured library holds the
  rate; the ruled crops in `mannequins/heads/band/` stay as the record of the owner's criteria.
- **`headAnchor: "capture"`** paints a capture's own head with nothing attached and nothing said
  about it (the crown-only test, folder 05): a choice, not the route.
- **Not done**: the recapture (below); the green-eyes line still sits in the instruction, to move
  into the server's keep line once every capture carries marks; the skill's capture pick still
  names a body and sex; the library's 312 files and the mannequins README's shot list still
  describe the old library.

## The next step: redo the busts and the mannequins (the owner's work, then the filing)

1. **The owner re-shoots bust-2** in HeroForge: the bald human mannequin, head and shoulders,
   camera straight down, the head tipped as bust-2 is, the two eyes painted the chroma green, alpha,
   1024 square. It lands as `mannequins/heads/bust-2-green.png`, replacing the scripted file at the
   same name, and nothing in the code changes. A copy of today's `bust-2.png` and `bust-2-green.png`
   is on the owner's Desktop for reference.
2. **The owner re-shoots the mannequins**: the human male, every standing and combat setup (the
   24 in the shot list, plus `prone` and `dead`, plus any new pose), camera straight down at 90
   degrees, the eyes painted green, alpha, 1024 square, the weapon in a closed fist and wholly
   inside the frame, arms off the torso. The pattern is `Desktop\EyeColorTests\Mann 15 Stand
   3-Portrait.png` (the one that ran all evening).
3. **As each capture lands**, file it: `scripts/mannequin.mjs take` (check its header for the
   body and sex it expects; with one body the name drops them, `mannequin-<pose>-<setup>.png`, and
   the old twelve-body files stay until the last one is replaced), check the two green marks are
   there (a count of green pixels the way `greenlib.mjs mark` finds them), update the mannequins
   README's shot list and capture rules, and commit.
4. **When the set is complete**: a thirty-token run across the new captures through the skill's
   route (`scripts/research/greenlib.mjs` with the new names, or `headtest`), the owner's eye on the
   sheet; if the rate holds, delete the steering, the edit remedy and the ruler from the server,
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
- **Outputs go to the Desktop as they land**, into numbered subfolders of
  `Desktop\EyeColorTests` beside the capture (`01-tychon-and-cecil` ... `10-green-bust-on-green-
  capture`), each with a `NOTE-what-this-is.md`, the tokens numbered, and a contact sheet; pairs
  side by side when there is a twin. Never dump files; never batch what can be copied as it lands.
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
  `DESK`): the PCs, the Elders and ten species on any capture with any bust, each beside its twin.
- `scripts/research/topdown.mjs [--yes]`: the eight PCs and Elders with `headAnchor: "capture"`.
- `npm run headtest -- ...`: the older measurement with the checks in the loop; `--judge <plates>`
  grades plates.
- The output folder: `D:\Workbench\LOCAL\artificer-output\headtest\<run>` (manifest, plates,
  kept renders). The campaign's PC crops: `fvtt-campaign-echoesofhalruaa/art/headtest/`.
