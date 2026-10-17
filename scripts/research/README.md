# Research scripts

The scripts the token reliability programme grew on 2026-10-17 (the record is
`notes/mannequin-tokens/PLAN.md`, the agenda `notes/mannequin-tokens/HANDOFF.md`). They are
research tooling beside `scripts/headtest.mjs`, not server code: no tests, the owner's Desktop
and output paths written in (`DESK` overrides the review folder), each run from the repo root
with `node scripts/research/<name>.mjs ...` after `npm run build`.

| Script | Does |
| --- | --- |
| `file-stage.mjs <run dir> <stage> <label> <title> [folder no]` | files a headtest run blind into the review folder: a numbered sheet with no verdicts, the tokens one by one, a rulings template, the checks' words apart in a `99-...` folder |
| `compare-sheet.mjs <run dir> <out png> [header] [left run dir]` | a pairs sheet: each token beside its counterpart from the baseline run (runs 1 and 2 by default, or the run given) |
| `show-run.mjs <run dir>` | prints a run's head and anatomy words per item |
| `e2e-score.mjs <run dir> <stage folder>` | scores a run against the proposed stopping rule by the checks' words, writes `SCORE.md` |
| `eyes-edit.mjs [--yes] [--only id,id]` | the eyes-open edit pass over a set of eyeless tokens (`eyes-edit-set.json` beside it), then the two check words, filed blind |
| `eyes-cal.mjs` | the eyes-gate calibration: two forms over the ruled plates, scored against the owner's "no eyes" cells |
| `recal.mjs`, `recal2.mjs` | the head-check ruler recalibration: exemplar variants and facing wordings over the ruled plates, then the stability repeat |
| `stage3-template.mjs <stage folder> <key json>` | a three-word rulings template (head, build, likeness) for a one-body run |
| `topdown.mjs [--yes] [--only id,id]` | the owner's fully-top-down test: the four PCs and the four Elders on a crown-only capture with `headAnchor: "capture"`, checks report-only, each token copied to the Desktop folder as it lands (`CAPTURE`, `DESK`, `ELDER_CROPS` override the paths) |

The rulings themselves live beside each run's manifest as `stage*-rulings.json` in the output
folder, with copies in the review folders' `99-...` subfolders.
