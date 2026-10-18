---
name: art-audit
description: >-
  Audit a batch of APPROVED and INSTALLED tokens and portraits with fresh eyes: count limbs, eyes,
  heads, tendrils, hands and props against the 2024 Monster Manual and the campaign's own rules,
  check that nothing crosses a face, that each token matches its portrait, and that every token
  faces the top of its image (Foundry's front); fix each flaw in place with one edit-image, rotate a
  mis-facing token, show the owner, install on approval, and record the fix in the campaign repo
  and the actor-art repo. Use when the user says "audit the batch", "audit the new monsters",
  "check the new tokens and portraits", "count the limbs", "did anything come back with extra
  arms", "check the facing", "the batch is placed, audit it", or after illustration-builder has
  installed a set of actors. Never for making art (illustration-builder) or restyling it.
---

# Art audit

The batch-level second look. `illustration-builder` runs a flaw pass on every render it makes,
but that pass is done by the session that made the art, in the same breath as approving it, and it
misses things: in one batch of eleven actors (twenty-two images) that had been approved on sight,
an aberration's portrait had three arms and its token five limbs, a fungus had five tendrils where
the rule says four, and a stalactite ambusher had two eyes where the book gives it one (owner,
2026-10-16). Nobody had counted. This skill counts, against the book, over the whole installed set,
and fixes what it finds **in place**: one edit per flaw, the approved look kept, never a new render.

Tools used: `imagegen-status`, `edit-image` (imagegen); the Read tool on every image; Pillow
through the shell for crops, rotations and the pixel diff; `asset-info`, `upload-asset`,
`find-asset-references` (the dnd5e MCP); `SendUserFile` for the owner's approval.

The server does the first count itself: every token and portrait render reports `anatomy` (the
judge's count against the call's `anatomy` line, each flaw placed, and for a token which edge the
head points to with the rotation that fixes it). A batch made since that check landed starts from
those reports, kept in the render results or the batch's notes; this audit still reads every image,
because the judge can be wrong and the reports do not survive an install.

## Step 0 — Scope and ground

- **The batch** is what the user names: a section of the campaign's `art/SHELF.md` (one table of
  actors with a token and a portrait each), "everything approved since <date>", or a list of
  actors. Pull the campaign repo, then read the shelf **in full**: the house style and its rules,
  the batch's own section and its lessons, the standing finish, the superseded list. Work from the
  shelf as it stands; a piece the shelf already records as fixed is skipped.
- **The reference** for every count is the creature's 2024 Monster Manual text: the campaign
  repo's `compendia/monster-manual/content.md` (the flavour) and `actors.md` (the stat block) when
  the campaign exports them, else `get-compendium-entry`. A campaign rule on the shelf outranks the
  book's silence ("exactly four tendrils, one toward each corner"); the book outranks the art.
- Cold start: `imagegen-status` before the first edit.
- **The actor-art repo.** If the campaign's `CLAUDE.md` names a reusable actor-art repo (one folder
  per actor with `token.png`, `portrait.webp`, `actor.json`), every fix goes there the same day,
  the way the campaign's own rules say approved art does.

## Step 1 — Read every image, then zoom

1. Read every token and every portrait with the Read tool, the whole image first. Twenty images is
   twenty Reads; never sample.
2. **The Read view is downscaled** (a 2400 px portrait shows at 2000, with the real coordinates
   reported), and a count on anything thin or tangled is wrong at that size. Crop the region with
   Pillow into the scratchpad at one to four times its size and Read the crop: a tendril that
   loops behind another, a far leg behind a near one, the fingers of a fist, a small token face.
   Two tendrils that share a root and one that passes behind another are told apart only this way.
3. Count out loud, per image, against the book:
   - **Limbs**: legs and arms per figure. Two and two for a humanoid; four for a quadruped; the
     book's own count for the odd ones (a brain that walks on four clawed legs; a beetle-like
     scavenger on four legs with two feathery antennae and a paddle tail).
   - **Eyes and heads**: the book's count. A single eye on a one-eyed aberration or a stalactite
     ambusher; no eyes at all on a creature the book gives "shallow depressions". A one-eyed
     creature painted with two reads natural and sails through a careless pass; count anyway.
   - **Tendrils and tentacles**: exact where the book or the shelf gives a number (four on a
     violet fungus). For a radial creature the book leaves uncounted (a darkmantle's webbed
     tentacles), look only for one that is duplicated, broken or forked.
   - **Hands and fingers**: a thumb and the same number of fingers on every visible hand; a
     fist's fingers; no sixth digit; a hand that holds nothing yet is closed around something.
   - **Duplicated props and effects**: one weapon, one effect; a second club behind the first.
   - **Faces are clear** (the shelf's rule): nothing crosses, touches or sits against the outline
     of a head.
   - **The token matches its portrait**: the same creature, the same gear and colouring. A digit
     count that differs between them (a thumb and three fingers in one, four in the other) is
     noted in the report, not fixed; neither is wrong by the book.
4. **Facing, tokens only.** Foundry treats the top of the image as the token's front, and the
   house tokens have auto-rotate on, so a creature painted head-down walks tail-first and one
   painted side-on walks sideways. Decide where the head or front is on every token: at the top
   is right; side-on wants a 90-degree turn; head-down wants 180. A restyled token keeps its
   base's facing, so check the base too. For a
   quadruped seen from above, the forelimbs say where the front is (bent, splayed, claws
   forward) and the hind limbs trail. Fungi, a stalactite that hangs point-down, and a radial
   creature have no facing and are never rotated.

## Step 2 — Fix in place

- **An anatomy flaw is one `edit-image` on the approved file**, `kind` `portrait` or `token`,
  flash. Name the flaw by where it sits in the picture, give the right count, and end with
  "keep everything else identical": "has three arms; give it exactly two, removing the arm that
  rises behind its left shoulder … keep everything else identical" removed a spare arm cleanly on
  the first try with the rest of the picture unchanged. **Never regenerate**: a new render loses
  the look the owner approved, and the whole point is that nothing but the flaw moves. A token's
  source is its cut PNG as it is; the tool re-plates and re-cuts it in the same call. Pass the
  book's line as `anatomy` on the fix, so the result's `anatomy` report counts the fix for you
  before you crop and count it yourself.
- **Prove the edit was an edit.** Diff the result against the source with Pillow (the share of
  pixels that moved by more than a little). An honest one-spot fix moves under about four percent
  of the picture (1.2, 2.4 and 3.5 on the three fixes of 2026-10-16). A result that moved most
  of the picture is a re-roll wearing the edit's name: throw it away and ask again more
  precisely. Then Read the result and count again on a crop.
- **Accept by count, not by which.** Told to remove "the short tendril that curls beside the
  stem", the model removed the tall one beside it instead. Four was four; it passed. Judge the
  result against the book, not against the instruction.
- **A facing flaw is a rotation, never a render.** Rotate the PNG with Pillow (180, or 90 either
  way) in the scratchpad, keeping the alpha. The art is unchanged, only turned.
- Two edit passes at most per piece. A third miss is reported as still wrong, not forced.

## Step 3 — Show, then wait

- **Every edited piece goes to the owner before anything is installed.** This is a standing
  rule, not a courtesy. Send, with `SendUserFile`, a before-and-after sheet per piece (source on
  the left, result on the right, on a pale ground so a token's alpha shows) and the result at
  full size, and say in a line what was wrong and what moved. Then stop. Approval is per piece,
  and a judgment call is said to be one: two eyes where the book gives one had been approved on
  sight, so the owner was told they could keep the pair.
- A **pure rotation** of approved art needs no approval: install it and show the result.
- The drafts wait in the campaign's `art/staging/` (local, gitignored) meanwhile.

## Step 4 — Install on approval

1. **Upload over the same live paths.** `asset-info` on each path first (it exists, its size),
   `find-asset-references` when in doubt about which actors carry it, then `upload-asset` with
   `overwrite: true` to the very same path: `tokens/<kind>/<slug>.png` as PNG, the portrait as
   WebP at quality 90 (convert with Pillow). Confirm with `asset-info` again (new size, new
   modified time). Overwriting in place is why no actor and no placed token needs relinking.
2. **The campaign repo.** For an edited piece: `git rm` the old art file, copy the result into
   `art/` under its new id, point the shelf's row at it, add the old id to the shelf's
   "Superseded (never attach)" list with what was wrong, and add a lessons line to the batch's
   section (what the audit found, how many edits, that the rest was clean). For a rotation:
   overwrite the existing art file in place, same name, and say so in the section's lessons.
   Clear the audit's drafts and sheets from `art/staging/`.
3. **The actor-art repo**, when there is one: `token.png` and `portrait.webp` (quality 92) into
   the actor's folder, the fix noted in its `actor.json` the way earlier fixes are (appended to
   the `method` of the piece, and a `note` saying what was wrong and to count it next time), the
   catalog rebuilt (`npm run catalog`), commit, push.
4. The campaign's own filing check (`npm run check`), then commit the campaign repo with a message
   that names each piece and what was wrong, and push if the campaign syncs that way.

## Step 5 — Report

One line per image: **clean**, **fixed** (what was wrong; approved; live), or **rotated**. Then
anything noted and left alone, both commits by hash, and the spend (about five cents per flash
edit). If every image is clean, say so and change nothing: the pass is mandatory, the edit is not.

## Lessons

- **The pass that approves is not the pass that counts.** Three of twenty-two images in one batch
  carried a flaw a second session found in one sitting. Run this after every installed batch,
  not only when something looks off.
- **The counts a careless pass skips**: eyes (a two-eyed one-eyed creature looks right), tendrils
  (six and five for four, on every render of that fungus), a far leg behind a near one (crop
  before calling it missing or extra), and facing (a head-down token looks fine in the sheet and
  wrong the moment it moves).
- **A downscaled Read cannot count a tangle.** Crop first; the full image is for the look, the
  crop is for the count.
- **Fix in place, prove it stayed local, accept by the book.** The pixel diff is the proof; the
  count on the result is the acceptance.
- **Overwrite the live path, never a new one.** A new path means relinking every placed token;
  the same path means nothing on the table changes but the pixels.

## What this skill does NOT do

Make art for an actor that has none, restyle a piece, change a look the owner approved, or
re-render for a flaw that one edit can fix: that is `illustration-builder`. It does not touch
the bestiary, the actor's stats or its token settings (auto-rotate, ring, scale): that is the
dnd5e MCP's `token-cutout` and the authoring skills.
