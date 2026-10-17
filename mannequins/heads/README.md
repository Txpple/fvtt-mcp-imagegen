# Head anchors

The owner's rule for every standing or combat token (2026-10-16): the head faces the way the body
faces, tipped just enough toward the overhead camera that the brow, eyes, nose and mouth read,
with hair over the top half of the head; never bowed into the chest with the eyes hidden, and
never the face lifted to the camera (the chin's underside, the throat), which the owner dislikes
most. About 95 renders that day showed that words about the angle (absolute lines, degrees, gaze
targets, edits, "exactly as the mannequin's head") fail, and that a render leans toward the head
tilt of whatever reference image carries a head. So the head is carried by an image, never by
words: a grey bust at the wanted tilt for a figure made from words, the approved token head for a
PC. `edit-image` with `source: "mannequin"` attaches the bust itself (`src/heads.ts`); the
illustration-builder skill's recipe says nothing about the head.

## The busts (`bust-1.png` to `bust-4.png`)

Four captures of the bald human HeroForge mannequin with the camera straight down (90 degrees, the
owner's token standard; the library itself is shot at about 80) and only the head tilted, a tight
head and shoulders, 1024 square with alpha, the head tipped a step further toward the camera each
time. None shows the throat, so none pushes toward a frontal face.

| File | Shows | Measured effect (2026-10-16) |
| --- | --- | --- |
| `bust-1` | the crown only | sent a guard eyes-down (like band 5) |
| `bust-2` | brow and eye sockets | mid-band (like 10); the server's default |
| `bust-3` | eyes, nose and mouth | face-forward (like 11) |
| `bust-4` | eyes, nose, mouth and the chin edge | sent a guard eyes-down once; the top of the dial is not a lock |

Attached as a `pose` reference they act as a dial with about one step of spread (bust-2 on an orc,
a goblin, a knight and a dwarf centred the heads, with the goblin and one knight a step low), not
a lock, and bleed no identity into the figure. The server steers with them: a `far-down` verdict
re-renders with the next bust up (bust-3 at least), a `far-up` one with bust-1.

**Binding sentence for a bust** (the server writes it; `headAnchor` picks the bust):

> Image N is a grey clay head showing only how far a head is tipped toward this overhead camera:
> tip the figure's head exactly like it, so that the same amount of brow, eyes, nose and mouth
> shows, and take nothing else from it.

## The band (`band/`)

Head-and-shoulders crops (190 px of the 512, upscaled to 512) of the live Echoes of Halruaa PC
tokens the owner ruled on `head-angle-sheet.png` (Desktop, `PC Tokens`), numbered as on that sheet.
The six `right-*` crops are the band, from eyes-down (5) to face-forward (11); the two `wrong-*`
crops are outside it. Until 2026-10-17 the head check (`src/head.ts`) was shown `right-05` as DOWN,
`right-10` as RIGHT, `right-11` as UP and `wrong-12` as FAR-UP beside every plate it grades;
since then its ruler is the five crops in the next section, and these stay as the record of the
2026-10-16 ruling.

### The ruler since 2026-10-17 (`band/*-s2-*`, and `wrong-12`)

Head crops (220 px of the 512, upscaled to 512) of four stage-2 renders the owner ruled blind on
2026-10-17 (the universal PC route, the review folder `TokenImprovements/06-stage-2-...`), one
per step, with the legacy FAR-UP kept. Measured against the owner's 27 ruled plates over three
passes: the legacy four passed a head the owner rejects every time and wobbled on six cells;
these five caught every rejected head every time, rejected two accepted NPC heads (a re-render
each, about 3.5 cents) and wobbled on three. The record is `notes/mannequin-tokens/PLAN.md`.

| File | Step | Stage-2 cell | The owner's words |
| --- | --- | --- | --- |
| `far-down-s2-08-cecil-combat.png` | FAR-DOWN (wrong) | 8 | head looks too far down |
| `down-s2-05-lysandra-stand.png` | DOWN (the lowest acceptable) | 5 | head a bit down, good likeness |
| `right-s2-03-kartor-stand.png` | RIGHT (the ideal) | 3 | head is about perfect, good likeness |
| `up-s2-04-kartor-combat.png` | UP (the highest acceptable) | 4 | head maybe too high up |
| `wrong-12-cecil-combat.png` | FAR-UP (wrong) | legacy 12 | the face lifted to the camera (2026-10-16) |

**The eyes gate (2026-10-17).** The owner's criterion for a head is whether both eyes read, and
the tilt steps do not carry it: on stage 3 the owner rejected eleven heads, ten of them "no eyes",
and the tilt check passed ten of the eleven. So a second, eyes-only call on the plate
(`EYES_PROMPT` in `src/head.ts`, no exemplars) answers EYES, NO-EYES or NO-FACE, and NO-EYES is
sent back up the dial like far-down. Measured on 53 ruled plates over two passes: 12 of the
owner's 13 eyeless heads caught on both passes (the miss a front view), 3 of 17 accepted heads
sent back; a two-word answer folded into the tilt call caught 10.

| File | Sheet | Source (Desktop `PC Tokens/prod/`) | Ruling |
| --- | --- | --- | --- |
| `right-05-tychon-stand.png` | 5 | `tychon-tessarin.png` | right: the eyes-down end of the band |
| `right-06-kartor-stand.png` | 6 | `kartor-bloodaxe.png` | right |
| `right-07-lysandra-stand.png` | 7 | `lysandra-vane.png` | right |
| `right-09-tychon-combat.png` | 9 | `tychon-tessarin-combat.png` | right |
| `right-10-kartor-combat.png` | 10 | `kartor-bloodaxe-combat.png` | right: the middle of the band |
| `right-11-lysandra-combat.png` | 11 | `lysandra-vane-combat.png` | right: the face-forward end of the band |
| `wrong-08-cecil-stand.png` | 8 | `cecil-edmunds.png` | wrong |
| `wrong-12-cecil-combat.png` | 12 | `cecil-edmunds-combat.png` | wrong: the face lifted to the camera |

These crops are the judge's ruler, not a render reference: the owner ruled (2026-10-17) that the
legacy heads were luck, not a standard, so a PC renders on the bust like any NPC, with the
portrait's head-to-waist crop as `character` and `headAnchor: "bust-2"` on the call (the crop is
then bound to identity only). A head the owner has ruled on can still be attached as `character`
with no `headAnchor`, when it is bound as the token head and carries its own tilt.

**Binding sentence for a PC head as `character`** (the server writes it on a mannequin edit):

> Image N is a CHARACTER reference: this figure's head as it appears on its approved tokens, seen
> from this same overhead token camera. Take the face, hair, skin, eyes and the tilt of the head
> from it, the head tipped exactly as it is there, and nothing of its framing, lighting or
> background.

When a `character` reference is attached the server attaches no bust: the reference is taken as a
token head and carries the tilt itself. A steered retry on a PC render adds a bust as a second
reference beside it rather than replacing it.
