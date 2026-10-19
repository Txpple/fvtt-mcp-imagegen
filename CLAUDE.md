# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# fvtt-mcp-imagegen

An MCP server that makes D&D table art with the **Gemini image API** (the Nano Banana
models). Claude Code drives it (the server is registered as `imagegen`); it exposes
a small set of **Foundry-specific** tools so Claude can author prompts, generate art, edit existing art, cut tokens to alpha, curate the results by actually looking at
them, and hand the winners to the Foundry pipeline (`upload-asset` → `set-actor-art` /
`add-journal-image` in `fvtt-mcp-dnd5e`).

**State (2026-10-19).** At **1.3.1**, released: the server key is `imagegen`, and `imagegen-status`
and `npm run doctor` check the setup; seven kinds (icon, token, prop, portrait, illustration,
battlemap, overland), every one on flash by default. `main` carries, past 1.3.1: the
`illustration-builder` skill's newer owner rules for maps, tiles and tokens, the `art-audit`
skill (the batch-level second count of limbs, eyes, tendrils and token facing over an installed
set, fixed in place), references of role `object`, `thinking` on both render tools (reported as
`thinkingTokens`), the token framing's 90-degree orthographic camera, and the anatomy check
(`src/anatomy.ts`): every token and portrait render counted by a judge model against an optional
`anatomy` line, a token's facing included, reported as `anatomy`; and, of 2026-10-19, the
`character` reference bound to identity alone (never its lighting, palette, glow or background)
and `dressing` on battlemap edits (the drift check advisory); the `illustration-builder` skill
rewritten as one recipe per kind (286 lines, its dated lessons in `lessons.md` beside it) and
`scripts/token_fit.py`, the pixel passes a cut token gets. The mannequin pipeline of
2026-10-15 to 17 (a grey HeroForge pose library, `source: "mannequin"`, a server-attached bust,
a head check with steered retries and an eyes gate, `headtest`) was tried at length, did not work,
and was removed on 2026-10-18, the owner's word: nothing of it remains in the server, the scripts,
the skills or the notes, and the token pipeline is the restyle, `edit-image` on an existing token
or capture. Release detail is the GitHub release notes; the dated journal is
`docs/log/YYYY-MM.md`.

The server runs on the Gemini API. The first version of this server wrapped
a local ComfyUI install with FLUX models and a trained house-style LoRA. That direction is dead:
the local pipeline took many iterations per usable image, the LoRA never delivered a consistent
look, and the owner was already feeding its output to Nano Banana to fix. ComfyUI, the models, the
training toolkit, and the corpus are deleted from the machine. Nothing local remains. See
[ROADMAP.md](ROADMAP.md) for the rebuild milestones; the ComfyUI-era notes are in
[notes/archive/](notes/archive/) for history only and describe nothing that still exists.

## Scope (binding)

- **Foundry-specific by decree, NOT a generic Gemini image bridge.** Tools speak Foundry
  vocabulary and get tweaked freely for Foundry work. Do not generalize.
- **API only.** No local models, no local inference, no GPU dependency. Do not reintroduce a
  local backend or a backend abstraction. One client, one provider.
- **Separate from `fvtt-mcp-dnd5e`.** That server is scoped to Foundry content authoring and
  must not couple to image generation. This server never talks to the Foundry bridge; the
  handoff between them is files on disk + the dnd5e MCP's upload tools.
- Same house philosophy as the rest of the family: **tools do, skills decide.** Correctness
  (model selection per kind, ratio and size, post-processing, cutout, file conventions, the Pro
  cost gate) lives in tested tools here; judgment (prompt craft, curation taste, which reference
  images to attach, which actor/journal gets the art) lives in the `illustration-builder` skill.
- **Everything is in git.** The tool is this repo; the approved art is in the campaign repos.
  The only machine-side state is the API key in `.env`.

## Architecture

```
Claude ──MCP──> fvtt-mcp-imagegen ──HTTPS──> Gemini image API
                      │                        (Nano Banana 2.1 / Nano Banana Pro)
                      ├── sharp: crop, resize, format
                      └── cutout: rembg matte / chroma key → alpha
```

- Tools return absolute file paths; Claude reads the PNGs directly to curate.
- `imagegen-status` is the setup doctor (`src/doctor.ts`, issue #2): key present and accepted
  (a free models list, never a render), output dir writable and outside git, `IMAGEGEN_PYTHON`
  imports Pillow + numpy (rembg reported), one actionable line each. It must never spend credit.
  `npm run doctor` (`scripts/doctor.mjs`) is the same checks from a terminal: it imports
  `runDoctor` from `dist/`, so the logic stays in `src/doctor.ts` and a build comes first.
- `package.json` `allowScripts` names the two install scripts `npm ci` runs (esbuild, via vitest;
  classic-level, via the Foundry CLI). A new dependency with an install script shows as an npm
  `allow-scripts` warning; judge it and add it there.
- `scripts/token_fit.py` is the finish a cut token gets in pixels, beside `token_cutout.py`
  and run by hand (`python scripts/token_fit.py <sub> IN OUT`, never in place): `fit` (the PC
  body fit: the body is the largest blob after a 14 px opening with the glow set aside, scaled to
  a 245 px root area, capped inside a 10 px margin, centred between body and figure, the alpha
  faded at the edge; `--shrink PCT` for the dwarf's 79%), `squash` (a steeper camera: the head
  at 97%, the body eased to 90%), `despill` (edge despill, edge rebuild from the interior, the
  40 px speck drop), `hue` (a hue range rebuilt as a colour by brightness: blood painted olive on
  a green plate), `derim` (a cool rim light recoloured from its warm neighbours) and `headmatch`
  (two tokens of one PC matched by the hair blob's width). These were done one-off on the
  Halruaa PC tokens over three days and described in prose on that campaign's shelf; the
  script is the record. Pillow and numpy only; `scripts/test_token_fit.py` runs on synthetic
  figures (`python -m unittest scripts/test_token_fit.py`).
- Small server: `generate-image`, `edit-image`, `cutout-image`, `imagegen-status`. Resist tool
  sprawl. New work arrives as a `kind`, not a tool (props, battlemaps and overland maps all
  came that way).
- **The token pipeline is the restyle (owner rule).** An existing token or capture (the
  actor's world token, a library token, a HeroForge screenshot of the owner's own) goes through
  `edit-image` as kind `token`: the instruction, one keep line, the chroma plate, the cut.
  Nothing is attached beside the source but the caller's references. There is no pose library,
  no head anchor and no head judge: the mannequin pipeline that carried those was tried at
  length, did not work, and was removed whole (the State block has the dates). Do not
  reintroduce a grey-capture source, a server-attached head image or a head-angle check; a head
  that reads wrong is a flaw pass on the finished token, by the skill.
- **The anatomy** (`src/anatomy.ts`, owner rule): every token and portrait render is
  shown to `JUDGE_MODEL` (flash, temperature 0; the image at 1024 on its long side, one flat
  `JUDGE_USD` in the session total) and counted: heads, eyes, arms, legs, hands and fingers,
  tails, tendrils, wings, held objects. With an `anatomy` line from the caller (the Monster
  Manual's: "two arms, two legs, one large eye") the judge flags every difference; without one,
  only what is wrong on any creature (a limb belonging to no body, six fingers, a weapon painted
  twice, a second head). A token's answer also says which edge its head points to, and a front
  not at the top is a flaw with the clockwise rotation that fixes it (Foundry's front is the top).
  The result reports `anatomy` (`verdict`, `found`, `flaws`, `facing`, `rotate`); it never
  refuses and never re-renders, since a flaw is one `edit-image` away and the owner approves the
  fix, and the judge can be wrong. Born of a batch of eleven approved actors that went to the
  table with three arms, five tendrils and a second eye on a one-eyed creature, uncounted.
  `anatomy` on any other kind is refused before any network call.

## Models and tiers

| tier | model | role | rough cost |
|---|---|---|---|
| `flash` (default for every kind) | Nano Banana 2.1 (`gemini-nano-banana-2.1`) | everything unless the owner opts up | ~3¢ at 1K, ~5¢ at 2K, ~11¢ at 4K |
| `pro` (opt-in) | Nano Banana Pro (Gemini 3 Pro Image) | offered for portraits and illustrations "for a bit extra"; crowded scenes, text-heavy handouts | ~13¢ at 1K/2K, ~24¢ at 4K |

Facts that shape the design (verified against Google's docs and the spike at the rebuild):

- Both take up to 14 reference images. Flash holds identity for up to 4 characters; Pro for 5.
- The docs say only Pro takes style references (up to 3); in practice they work on Flash too.
  Either way that is the replacement for the LoRA: the house look comes from attaching approved
  pieces, not from trained weights.
- Resolutions are fixed steps (0.5K on Flash, 1K, 2K, 4K). Aspect ratios are a fixed list with
  **no 16:10**. The 2560×1600 table format is produced by generating 16:9 and cropping.
- Every output carries an invisible SynthID watermark. Irrelevant for a private table.
- The API returns JPEG; the server converts to PNG. Style references work on Flash in practice
  despite the docs listing them as Pro-only (the spike).
- The content policy says nothing specific about fantasy violence. The spike rendered blood,
  corpses, and a severed head on both tiers with zero refusals; treat the filter as a non-issue for
  table art until proven otherwise.

## Tool design: purpose presets, not raw dimensions

`generate-image` takes `kind`, not width/height. Each kind carries its API ratio and size, its
default tier, and its post-processing:

| kind | tier default | API call | post-process | destination |
|---|---|---|---|---|
| `icon` | flash | 1:1 at 1K | resize to 512 square | item / spell / feature icons |
| `token` | flash | 1:1 at 1K, full-body from straight above (a 90-degree orthographic body, the head tilted up so the face shows; the owner's standard), on a chroma plate whose colour is chosen per subject | edge-clip check (subject touching the plate edge ⇒ one re-render, then refuse), cutout to alpha, no shadow, 512 square (1024 with `creatureSize: "large"`, meaning Large or bigger) | actor token |
| `prop` | flash | nearest API aspect to the footprint (generate) or the source (edit), object-only wording, chroma plate | edge-clip check, cutout, fitted to the exact tile size: 300 px per cell for a new prop, the source's own pixel size and subject box for an edit | map dressing tile (furniture, barrels, trees) |
| `portrait` | flash | 3:4 at 2K | none beyond naming | actor sheet portrait |
| `illustration` | flash | 16:9 at 4K, style refs attached | crop to 16:10, downsample to 2560×1600 | journal image / player handout |
| `battlemap` | flash, **edit-image only** | the source padded (mirrored margin) to the nearest API aspect, sent at most 4096 px on the long side, rendered at 4K, layout-locking keep line | mapped back onto the source's pixel grid at a whole-number scale (1 for an HD source, more for a small one), shipped as WebP, drift check (layout moved ⇒ one re-render, then refuse; with `dressing: true` measured and reported only, one render, never refused), checkerboard of source and result written beside it | restyled scene background for a bought map; a dressing pass adds furniture and props to one |
| `overland` | flash, **edit-image only** | the battlemap geometry, with a keep line that locks the geography and paints out every name, marker, road, compass rose and scale bar | as battlemap, but the drift check refuses only gross drift (over 25% of tiles, or under a quarter locking on) | a regional or world map, painted bare; names are lettered on afterwards by script |

**Nothing ever clips off a token or a prop (owner rule).** A sword, wing, or foot
cut by the frame edge makes the token unusable. The framing and the token edit line both demand a margin on
every side, and `render()` counts subject pixels in the plate's outer 3 px (`src/edge.ts`): over
20 means clipped, the render is redone once (both calls billed), and a second clip is refused
with both plates kept for inspection. Never deliver or show a clipped token or prop.

**Nothing moves on a battlemap (owner rule).** Battlemaps are bought as UVTT packs
and imported with their walls; this server never paints a map from scratch (`generate-image`
refuses `kind: "battlemap"`). What it does is restyle a bought map in place, for the owner's two
goals: upscale and improve older art, and give art from different authors (Tom Cartos, Mad
Cartographer) one consistent style. Foundry walls, doors, and lights are traced over the map, so
the layout must not move. The API scales its input to cover the output and trims the excess (a
"3:4" render is 1792×2400), so the source goes out padded to the API aspect and comes back
mapped onto its own grid (`src/battlemap.ts`). Then `src/drift.ts` phase-correlates edge
strength tile by tile: more than 3% of tiles displaced by over 0.4% of the long side, or under
half the textured tiles locking on, is drift. The render is redone once (both billed), and a
second drift is refused with both kept. Calibrated on 24 live renders across 8 maps:
passes sit at a median of 0.1‰ with 0 to 3 outlier tiles, all of them repainted texture (grass
strokes, floor grain), never moved structure. The two kinds of real failure (reshaped cliffs on
one render; a map used as a style reference swapping in its whole layout, twice) scored 8% and
50 to 90%.

**A dressing pass is advisory (owner rule).** A repaint that adds furniture, props,
debris or foliage on purpose reads to the drift check as moved layout, piece by piece, so nearly
every such pass billed two renders and then refused, while the session kept the `-drifted` draft
and checked the walls by eye anyway. `edit-image` takes `dressing: true` on kind `battlemap`
(refused on every other kind, before any network call): one render, delivered under its normal
name, `drift` and the checkerboard reported as ever, `dressing: true` in the result so the caller
knows the check decided nothing. The eye checks the walls on the checkerboard. Plain restyles and
overland maps are unchanged.

The drift check guards geometry, not content. The model reinterprets things in place: dirt
became cobblestones, a dome or glass roof appeared over a conservatory, an unlit hearth was lit,
an idol became an elephant, stone walls became wood. The keep line's "change only how the map
is painted, never what is in it" and "cutaway floor plan" sentences cut that sharply (round 4
was clean on all three of the worst offenders), but the flaw pass still reads every map. A
keep line that also pinned colours and daylight smothered the restyle; the owner preferred the
bolder render, so palette and finish stay with the instruction (the skill).

Props are the exception the owner asked for: single objects placed on a map as
tiles. They are never tokens: the token
wording ("keep the face, hair") grew a man on an armchair, a dryad on an oak, and a dwarf on a
crate, so props have their own object-only wording. A prop edit pads the source with a margin
before sending (a tile-filling crate otherwise came back clipped twice) and puts the new art in
the box the original occupied, so it drops into the same tile slot at the same scale.

**The Pro cost gate (owner rule, revised the day it was made):** every kind defaults to
flash. `tier: "pro"` refuses unless `confirmPro: true` is passed, and the refusal states the
estimated cost. The skill mentions once that Pro is available for a bit extra when the owner
asks for a portrait or illustration, and passes the confirm only after they say yes. The server keeps a running estimated-spend counter per session; `imagegen-status`
reports it. Tools enforce, skills ask.

## Conventions inherited from the family

- Commit direct to `main`.
- Kernel-grade quality bar: tools are tested and own correctness; no judgment in tools. Tests run
  on recorded fixtures, never the live API.
- A new or renamed tool needs a Claude Code restart, which only the owner can do.
- Output filenames: `<kind>-<slug>-<id>.png`, kebab-case, kind-prefixed, matching the campaign
  repos' `art/` shelf, so generate → curate → upload needs no glue. Battlemaps are the one
  exception (the owner's call): `.webp`, since a restyled map is 20 to 70 MB as PNG and about
  4 MB as WebP, and players download it on every scene load. A map past WebP's 16383 px
  limit falls back to PNG.
- The API key lives in `.env` (gitignored), never in a skill, a prompt, or a commit.
- Register the server at **user scope**.
