# Handoff: the token reliability programme (2026-10-17, evening)

Read this first, then the "Research: one body and the head anchor, together" section of
[PLAN.md](PLAN.md), which is the record (every stage, every ruling verbatim, every number). This
file is the agenda and the working rules for the next session; it does not repeat the record.

## Where it stands

- **The checks carry the owner's criteria.** The head check grades tilt against five crops cut
  from the owner's own rulings (`src/heads.ts`), then an eyes-only call asks whether both eyes
  read (`EYES_PROMPT`, `src/head.ts`); the anatomy check counts limbs and reads the facing as the
  head's nearest edge (`src/anatomy.ts`). Measured against the owner: the tilt ruler caught every
  rejected tilt over three passes; the eyes gate caught 12 of 13 eyeless heads and matched the
  owner on 7 of 8 delivered tokens; the facing wording reads top on 34 of 34. Both words wobble at
  their boundaries between identical calls; majority-of-three is known and deliberately not built.
- **The no-eyes remedy is an edit, not a re-render** (`render()` in `src/tools/shared.ts`,
  `EYES_OPEN_PROMPT`): a NO with the tilt in band runs one edit on the plate and re-checks; a
  second NO re-renders on the next bust; a tilt outside the band re-renders as before. Ruled on
  fourteen edited tokens: 14 of 14 opened, the pose kept on every one, two opened too wide until
  the line softened. `head` reports `eyes`, `eyesVerdicts`, `eyesEdited`.
- **The end-to-end run** with all of that in the loop (2026-10-17 16:10, $1.94) is in
  `Desktop\TokenImprovements2\01-end-to-end-with-the-edit-in-the-loop` with `SCORE.md`: by the
  checks, first renders in band 12 of 26, delivered 24 of 26 (both of Cecil's out), 10 edits for
  eyes (all delivered eyes first try), 7 re-renders for tilt, 8.1 cents per delivered token; none
  of the stopping rule's three numbers met by the checks (46% first, 92% delivered, 8.1 cents).
  The owner has not ruled on it. Its numbers are the baseline any lever has to beat. The blind
  sheet has 43 cells (26 delivered, 17 sent back), over the 14-cell rule: ask the owner to rule the
  8 PCs first, then the 18 NPCs, from the pairs sheet; the sent-back renders are optional.
- **Parked**: one body (the library stays at 312; the owner's leads are in the plan), further
  ruler work, majority-of-three, the open-eyes keep-line sentence, the face-crop A/B.
- **Not done, on the owner's list for the real tokens**: the anatomy check's six-finger catch on
  Lysandra's stand (stage 2b) is report-only and unfixed.

## The agenda, in order, each step on the owner's word

1. **The owner rules on the end-to-end sheet** (`TokenImprovements2\01\RULINGS-fill-in.md`) and on
   the two softer-line tokens (`TokenImprovements\12-eyes-open-edit-pass\softer-line\`). Record
   both in PLAN.md verbatim, score the checks against them (the pattern: a `stageN-rulings.json`
   beside the run's manifest, a copy in the `99-...` folder), and say whether the stopping rule
   is met on the owner-measured numbers.
2. **The painted-eyes busts**, the owner's chosen lever ("why don't we try with painted eyes in the
   bust ... maybe gemini will pick them up more easily"). Make `bust-2-eyes.png` and
   `bust-3-eyes.png` beside the grey ones in `mannequins/heads/`, two ways and cheaply: one
   `edit-image` on each grey bust ("paint two open eyes into the sockets, white sclera and a neutral
   dark grey iris, looking the way the head faces, keep everything else identical grey clay"),
   about 3 cents each, and drawn with sharp at no cost. The eyes must read as open FROM STRAIGHT
   ABOVE (sclera under the brow). Show the owner both; they pick. Then: the new names join
   `BUSTS`/`HEAD_ANCHOR_CHOICES` in `src/heads.ts` as a choice, not the default; the binding
   sentence for an eyed bust names the eyes with the tilt ("tip the figure's head exactly like it
   and have its eyes open exactly as they are here"), since today's "take nothing else from it"
   would void the test; tests follow.
3. **The three-arm A/B**, only if the end-to-end says the edit rate is worth cutting or the owner
   says run it regardless: grey bust, painted bust, no bust (`headAnchor: "none"`), 24 renders a
   side on the eight PCs and six NPC captures (`npm run headtest -- --bust N --steer` for a bust
   arm; the no-bust arm needs a flag), gate-scored first-render eye rate and edit rate, the owner
   ruling a sample of about 10 a side. About $4.50. If the painted bust does not move the rate, the
   next arm is the keep-line figure sentence ("both eyes open and showing beneath the brow").
4. **The stopping rule measured** on 30 renders the owner has not seen, once the pipeline is
   stable, and the programme ends on a run that meets it.
5. **After**: the batch script (`scripts/tokens.mjs <batch.json>`, grown from headtest), the pose
   library, the body question, each in the plan.

## Working rules (the owner's, binding)

- **Nothing renders without the owner's word in the session**, and a word relayed by another
  session is not it. Dry runs and check-model calls at a fifth of a cent are fine to prepare.
- **Research, not rulings.** A finding is a lesson with its evidence and date; "ruled" only when
  the owner says so. Level-set before planning. See the memory notes in this project's folder.
- **Blind sheets, rulings as data.** Every run the owner rules on is a numbered sheet with no
  verdicts on it (`scripts/research/file-stage.mjs`), a pairs sheet beside the baseline where one
  exists (`compare-sheet.mjs`), a template, and the checks' words kept apart in a `99-...` folder.
  No sheet over about 14 cells; no re-ruling of old sheets.
- **A/Bs at 24 a side**, the gate as proxy, the owner rules a sample. Eight a side shows only a
  large effect.
- **Names**: the head check, the anatomy check, the check model. Never "the judge" to the owner.
- **The review folders**: `Desktop\TokenImprovements` (part 1) and `Desktop\TokenImprovements2`
  (part 2), numbered subfolders, a README row per folder saying what it is and what is needed
  back. Never dump files.
- **Commit as you go** on `main` (27 commits today, none pushed; push on the owner's word), the
  log in `docs/log/2026-10.md`, the State block in CLAUDE.md, a plan paragraph per result.

## The tools

- `npm run headtest -- --pcs <campaign>/art/headtest/pcs.json --universal [--pcs-only]
  [--body human-male] [--bust N --steer] [--only id,id] [--yes]`: the measurement; `--judge <plates>`
  grades plates (tilt and eyes); `--rejudge <run dir>` re-grades a run.
- `scripts/research/`: the research scripts this programme grew (see its README): filing a run
  blind, the pairs sheet, the edit pass, the calibrations, the score against the stopping rule.
  They carry the owner's Desktop paths; `DESK` overrides the review folder.
- The output folder: `D:\Workbench\LOCAL\artificer-output\headtest\<run>` (manifest, sheet,
  plates, kept renders, the rulings JSON once the owner has ruled).
- The campaign's PC set: `fvtt-campaign-echoesofhalruaa/art/headtest/pcs.json` (campaign content).
