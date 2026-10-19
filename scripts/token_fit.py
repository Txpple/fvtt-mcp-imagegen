#!/usr/bin/env python
# The pixel passes done by hand on the Echoes of Halruaa PC tokens, 2026-10-16 to 18, written
# down as a tool so the next token gets the same finish without re-deriving it from the shelf's
# prose (the campaign's art/SHELF.md, "The standing finish for go-forward art" and "Token size").
"""Finish a cut token in pixels: fit, squash, despill, hue, derim, headmatch.

Every subcommand reads a square RGBA PNG (512, or 1024 for a Large creature) and writes a NEW
file; it never writes in place and refuses an output path equal to the input. Pixel figures
below are for a 512 canvas and scale with the canvas.

    python token_fit.py fit IN OUT [--body 245] [--margin 10] [--fade 10] [--open 14]
        The body fit: the figure's body is the largest alpha blob left after a 14 px
        morphological opening (a disc of that radius: a staff, a blade and a stray glow fall
        away, a lute or a shield stays) with glowing (bright, saturated) spell pixels removed. The whole
        image is scaled so sqrt(body area) = 245 px, capped so the whole figure (staff, lute,
        spell and all) still sits inside a 10 px margin, centred halfway between the body's
        centre and the whole figure's centre, and the alpha faded to zero over the last 10 px of
        the square. Re-running it on a fitted token is close to a no-op.
    python token_fit.py fit IN OUT --shrink 79
        The small-race size: the figure scaled to 79% on the same canvas, centred, Lanczos
        (a dwarf PC is 79%; a pose that should read smaller than its siblings was 95%).
    python token_fit.py squash IN OUT [--head Y0:Y1] [--head-scale 0.97] [--body-scale 0.90]
        A steeper camera on a finished token: a graded vertical squash. The head-and-collar
        box (given, or measured from the top of the alpha) keeps 97% of its height, the body
        below eases to 90%, blended over --blend rows so no seam shows. The figure keeps its
        vertical centre (--anchor top keeps the top of the head instead).
    python token_fit.py despill IN OUT [--band 3] [--rebuild 2] [--speck 40] [--cap-green]
        The edge clean after a chroma cut, three steps: an edge despill (every pixel within
        3 px of transparency or semi-transparent where green leads red has its green capped to
        max(r, b)); an edge rebuild (every pixel within 2 px of transparency or semi-transparent
        takes the colour of its nearest fully opaque interior pixel, alpha untouched, so no
        fringe of any hue survives); and the speck drop (every alpha component under 40 px
        cleared). --cap-green also caps g <= max(r, b) over the whole figure, Lysandra's rule;
        it is off by default since it would kill a green cloak.
    python token_fit.py hue IN OUT [--range 38:170] [--sat 0.18] [--target BF262A] [--box X0,Y0,X1,Y1]
        Rebuild every pixel in a hue range (default 38 to 170 degrees, the green and olive the
        model paints on a green plate) and saturation over 0.18 as the target colour scaled by the
        pixel's own brightness: with the default target a pixel of value v becomes blood red,
        r = 0.75 v, g = 0.2 r, b = 0.22 r. --box limits the pass to a rectangle.
    python token_fit.py derim IN OUT [--blur 6] [--protect X0,Y0,X1,Y1]
        Strip a cool rim light or tint: every cool pixel (hue 165 to 330, or a grey highlight)
        takes the colour of its warm neighbours (a 6 px blur of the warm pixels) and keeps its
        own shading; a rim highlight brighter than its surroundings is pulled halfway down to the
        local brightness. --protect masks a rectangle out (Cecil's silver tuning-pipe).
    python token_fit.py headmatch A B OUT [--box-a X0,Y0,X1,Y1] [--box-b ...] [--widths WA WB] [--debug DIR]
        Match two tokens of one character by the head: the hair blob's width is measured in
        the upper half of each body (the crown's colour, grown into the blob that holds it),
        both widths are reported, and the token with the larger head is rescaled on its own
        canvas (as --shrink) so the heads match, written to OUT. The measure is a best effort
        on a top-down figure (a raised arm or a spell above the head fools it): read the
        --debug images, and give the head box read off the image as --box-a/--box-b, or the
        widths as --widths, when it is wrong. --measure prints and stops.

Pillow and numpy only (requirements.txt); the morphology, the distance bands, the nearest-pixel
fill and the component labelling are written here rather than pulled from scipy.
"""
from __future__ import annotations

import argparse
import math
import os
import sys

import numpy as np
from PIL import Image

REFERENCE_EDGE = 512          # the pixel figures in the docstring are for this canvas


# ----------------------------------------------------------------------------------------------
# I/O
# ----------------------------------------------------------------------------------------------

def load(path):
    """An RGBA PNG as float32 RGB (H, W, 3) in 0..255 and alpha (H, W) in 0..255."""
    img = Image.open(path).convert("RGBA")
    a = np.asarray(img).astype(np.float32)
    return a[..., :3].copy(), a[..., 3].copy()


def save(path, rgb, alpha):
    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(alpha, 0, 255)]).round().astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path)


def check_output(inp, out):
    """Never in place: the output is a new file."""
    if os.path.abspath(inp) == os.path.abspath(out):
        sys.exit(f"refused: output {out} is the input; this tool never writes in place")


def unit(edge):
    """Pixel figures are given for a 512 canvas and scale with it."""
    return edge / REFERENCE_EDGE


# ----------------------------------------------------------------------------------------------
# Pixel toolkit (numpy only)
# ----------------------------------------------------------------------------------------------

def shift(a, dy, dx):
    """b[y, x] = a[y + dy, x + dx] where that is inside the image, else 0."""
    H, W = a.shape[:2]
    b = np.zeros_like(a)
    ys0, ys1 = max(0, dy), min(H, H + dy)
    xs0, xs1 = max(0, dx), min(W, W + dx)
    if ys1 <= ys0 or xs1 <= xs0:
        return b
    b[ys0 - dy:ys1 - dy, xs0 - dx:xs1 - dx] = a[ys0:ys1, xs0:xs1]
    return b


def disc_offsets(radius):
    """(dy, dx) pairs inside a disc, nearest first; (0, 0) excluded."""
    r = int(math.ceil(radius))
    offs = [(dy, dx) for dy in range(-r, r + 1) for dx in range(-r, r + 1)
            if (dy, dx) != (0, 0) and dy * dy + dx * dx <= radius * radius + 1e-6]
    offs.sort(key=lambda o: (o[0] * o[0] + o[1] * o[1], o))
    return offs


def dilate(mask, radius):
    """Binary dilation by a disc."""
    out = mask.copy()
    for dy, dx in disc_offsets(radius):
        out |= shift(mask, dy, dx)
    return out


def erode(mask, radius):
    return ~dilate(~mask, radius)


def opening(mask, radius):
    """Erode then dilate by a disc of the given radius: parts thinner than twice the radius (a
    staff, a blade, a stray glow) fall away and the body stays. Calibrated on the five PC
    tokens fitted by hand on 2026-10-16: at radius 14 their bodies read 246 to 256 px against
    the 245 target, so re-fitting them is a no-op within 4%; at radius 7 they read up to 269."""
    return dilate(erode(mask, radius), radius)


def label_components(mask):
    """8-connected components of a boolean mask: (labels, areas). labels[y, x] is 0 for
    background and 1..n otherwise; areas[k] is component k's pixel count (areas[0] = 0).

    Row runs are found with numpy and joined with a union-find over runs, so the Python loop
    runs over runs, not pixels.
    """
    H, W = mask.shape
    labels = np.zeros((H, W), np.int32)
    parent = []

    def find(i):
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i, j):
        ri, rj = find(i), find(j)
        if ri != rj:
            parent[max(ri, rj)] = min(ri, rj)

    prev = (np.zeros(0, np.int64), np.zeros(0, np.int64), np.zeros(0, np.int64))
    row8 = np.zeros(W + 2, np.int8)
    for y in range(H):
        row = mask[y]
        if not row.any():
            prev = (prev[0][:0], prev[1][:0], prev[2][:0])
            continue
        row8[1:-1] = row
        d = np.diff(row8)
        starts, ends = np.nonzero(d == 1)[0], np.nonzero(d == -1)[0]      # runs are [x0, x1)
        ids = np.arange(len(parent), len(parent) + len(starts))
        parent.extend(ids.tolist())
        px0, px1, pid = prev
        for x0, x1, rid in zip(starts, ends, ids):
            labels[y, x0:x1] = rid + 1
            if len(pid):
                touch = np.nonzero((px0 <= x1) & (px1 >= x0))[0]          # 8-connectivity
                for t in touch:
                    union(int(rid), int(pid[t]))
        prev = (starts, ends, ids)
    if not parent:
        return labels, np.zeros(1, np.int64)
    roots = np.array([find(i) for i in range(len(parent))])
    uniq, compact = np.unique(roots, return_inverse=True)
    remap = np.concatenate(([0], compact + 1)).astype(np.int32)
    labels = remap[labels]
    areas = np.bincount(labels.ravel(), minlength=len(uniq) + 1)
    areas[0] = 0
    return labels, areas


def largest_component(mask):
    labels, areas = label_components(mask)
    if len(areas) < 2:
        return np.zeros_like(mask)
    return labels == int(np.argmax(areas))


def drop_specks(alpha, min_area):
    """Clear every alpha component under min_area px (the chroma cut's 1 to 3 px confetti)."""
    labels, areas = label_components(alpha > 0)
    small = areas < min_area
    small[0] = False
    dropped = int(small.sum())
    out = alpha.copy()
    out[small[labels]] = 0
    return out, dropped


def hsv(rgb):
    """Hue in degrees (0..360), saturation and value in 0..1, from float RGB in 0..255."""
    c = rgb / 255.0
    r, g, b = c[..., 0], c[..., 1], c[..., 2]
    mx, mn = c.max(axis=-1), c.min(axis=-1)
    d = mx - mn
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0.0)
    with np.errstate(divide="ignore", invalid="ignore"):
        h = np.where(mx == r, ((g - b) / d) % 6.0,
            np.where(mx == g, (b - r) / d + 2.0, (r - g) / d + 4.0)) * 60.0
    h = np.where(d > 0, h, 0.0)
    return h, s, mx


def hue_in(h, lo, hi):
    """Hue inside [lo, hi], wrapping past 360 when lo > hi."""
    if lo <= hi:
        return (h >= lo) & (h <= hi)
    return (h >= lo) | (h <= hi)


def gaussian_blur(a, sigma):
    """Separable Gaussian blur of a float array (H, W) or (H, W, C), edges zero-padded."""
    r = max(1, int(math.ceil(3 * sigma)))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma) ** 2)
    k /= k.sum()
    out = np.zeros_like(a)
    for i, w in enumerate(k):
        out += w * shift(a, i - r, 0)
    a2, out = out, np.zeros_like(a)
    for i, w in enumerate(k):
        out += w * shift(a2, 0, i - r)
    return out


def fill_from_nearest(rgb, source, target, radius=16):
    """Every target pixel takes the colour of its nearest source pixel (Euclidean, exact up to
    `radius`; anything further is filled by propagation from what has been filled). The
    numpy stand-in for distance_transform_edt with return_indices."""
    out = rgb.copy()
    filled = ~target
    for dy, dx in disc_offsets(radius):
        need = target & ~filled
        if not need.any():
            return out
        take = need & shift(source, dy, dx)
        if take.any():
            out[take] = shift(rgb, dy, dx)[take]
            filled |= take
    neigh = [(dy, dx) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if (dy, dx) != (0, 0)]
    for _ in range(4096):
        need = target & ~filled
        if not need.any():
            break
        acc = np.zeros_like(out)
        cnt = np.zeros(out.shape[:2], np.float32)
        for dy, dx in neigh:
            f = shift(filled, dy, dx)
            acc += shift(out, dy, dx) * f[..., None]
            cnt += f
        take = need & (cnt > 0)
        if not take.any():
            break
        out[take] = (acc / np.maximum(cnt, 1)[..., None])[take]
        filled |= take
    return out


def resize_rgba(rgb, alpha, scale):
    """Lanczos resize of a straight-alpha image, done premultiplied so transparent pixels
    never bleed their colour into the edge."""
    H, W = alpha.shape
    nw, nh = max(1, round(W * scale)), max(1, round(H * scale))
    a = alpha / 255.0
    pre = np.dstack([rgb * a[..., None], a[..., None] * 255.0])
    bands = [Image.fromarray(pre[..., i].astype(np.float32), "F").resize((nw, nh), Image.LANCZOS)
             for i in range(4)]
    out = np.dstack([np.asarray(b, dtype=np.float32) for b in bands])
    na = np.clip(out[..., 3], 0, 255)
    with np.errstate(divide="ignore", invalid="ignore"):
        nrgb = np.where(na[..., None] > 0.5, out[..., :3] / np.maximum(na / 255.0, 1e-6)[..., None], 0.0)
    return np.clip(nrgb, 0, 255), na


def place(rgb, alpha, edge, offset):
    """Paste an image onto a transparent edge x edge canvas at (x, y), clipped to the canvas."""
    H, W = alpha.shape
    ox, oy = offset
    crgb = np.zeros((edge, edge, 3), np.float32)
    calpha = np.zeros((edge, edge), np.float32)
    x0, y0 = max(0, ox), max(0, oy)
    x1, y1 = min(edge, ox + W), min(edge, oy + H)
    if x1 > x0 and y1 > y0:
        crgb[y0:y1, x0:x1] = rgb[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
        calpha[y0:y1, x0:x1] = alpha[y0 - oy:y1 - oy, x0 - ox:x1 - ox]
    return crgb, calpha


def bbox(mask):
    """(x0, y0, x1, y1) with exclusive ends, or None for an empty mask."""
    ys, xs = np.nonzero(mask)
    if len(ys) == 0:
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def parse_box(text):
    parts = [int(v) for v in text.replace(":", ",").split(",")]
    if len(parts) != 4:
        raise argparse.ArgumentTypeError("a box is X0,Y0,X1,Y1")
    return tuple(parts)


def box_mask(shape, box):
    m = np.zeros(shape, bool)
    if box:
        x0, y0, x1, y1 = box
        m[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = True
    return m


def parse_color(text):
    h = text.lstrip("#")
    return np.array([int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)], np.float32)


def rescale_on_canvas(rgb, alpha, scale):
    """The whole figure scaled on the same canvas, its alpha box centred, Lanczos (the dwarf
    79% and the 95% stage pose)."""
    edge = alpha.shape[0]
    nrgb, nalpha = resize_rgba(rgb, alpha, scale)
    box = bbox(nalpha > 0)
    if box is None:
        return place(nrgb, nalpha, edge, ((edge - nalpha.shape[1]) // 2, (edge - nalpha.shape[0]) // 2))
    x0, y0, x1, y1 = box
    ox = round(edge / 2 - (x0 + x1) / 2)
    oy = round(edge / 2 - (y0 + y1) / 2)
    return place(nrgb, nalpha, edge, (ox, oy))


# ----------------------------------------------------------------------------------------------
# fit
# ----------------------------------------------------------------------------------------------

def body_mask(rgb, alpha, open_px, glow_sat, glow_val):
    """The body: the largest blob left after the opening, with the glowing spell pixels
    (bright and saturated) taken out first so a fireball does not count as torso."""
    solid = alpha > 127
    h, s, v = hsv(rgb)
    glow = solid & (s >= glow_sat) & (v >= glow_val)
    opened = opening(solid & ~glow, open_px)
    return largest_component(opened), int(glow.sum())


def fit(rgb, alpha, body_px, margin, fade, open_px, glow_sat, glow_val):
    edge = alpha.shape[0]
    u = unit(edge)
    body, glow_n = body_mask(rgb, alpha, open_px * u, glow_sat, glow_val)
    fig = bbox(alpha > 0)
    bod = bbox(body)
    if fig is None or bod is None:
        sys.exit("refused: no figure found (empty alpha, or nothing survives the opening)")
    area = float(body.sum())
    want = body_px * u
    scale = want / math.sqrt(area)
    # Centre halfway between the body's centre and the whole figure's centre, so a long staff
    # neither drags the body off the token nor is ignored.
    fx, fy = (fig[0] + fig[2]) / 2.0, (fig[1] + fig[3]) / 2.0
    bx, by = (bod[0] + bod[2]) / 2.0, (bod[1] + bod[3]) / 2.0
    cx, cy = (fx + bx) / 2.0, (fy + by) / 2.0
    # The cap: the whole figure, placed about that centre, stays inside the margin; 2 px of
    # slack covers the paste rounding and the resampler's ringing past the alpha edge.
    half = edge / 2.0 - margin * u - 2.0
    reach = max(abs(fig[0] - cx), abs(fig[2] - cx), abs(fig[1] - cy), abs(fig[3] - cy))
    cap = half / reach if reach > 0 else scale
    wanted = scale
    capped = scale > cap
    scale = min(scale, cap)

    nrgb, nalpha = resize_rgba(rgb, alpha, scale)
    ox = round(edge / 2.0 - cx * scale)
    oy = round(edge / 2.0 - cy * scale)
    crgb, calpha = place(nrgb, nalpha, edge, (ox, oy))
    calpha *= edge_fade(edge, fade * u)
    report = {
        "body_sqrt_area": math.sqrt(area), "body_area": area, "glow_pixels": glow_n,
        "scale": scale, "capped": capped, "wanted": wanted,
        "centre_from": (cx, cy), "shift": (ox, oy),
    }
    return crgb, calpha, report


def edge_fade(edge, fade):
    """Alpha weight ramping from 1 at `fade` px inside the square to 0 at its edge."""
    if fade <= 0:
        return np.ones((edge, edge), np.float32)
    i = np.arange(edge, dtype=np.float32) + 0.5
    d = np.minimum(i, edge - i)
    w = np.clip(d / fade, 0.0, 1.0)
    return np.minimum(w[:, None], w[None, :])


def cmd_fit(args):
    rgb, alpha = load(args.input)
    if args.shrink is not None:
        crgb, calpha = rescale_on_canvas(rgb, alpha, args.shrink / 100.0)
        save(args.output, crgb, calpha)
        print(f"shrink: {args.shrink:g}% on the {alpha.shape[1]} canvas, centred")
        print(f"saved:  {args.output}")
        return
    crgb, calpha, r = fit(rgb, alpha, args.body, args.margin, args.fade, args.open,
                          args.glow_sat, args.glow_val)
    save(args.output, crgb, calpha)
    print(f"body:   sqrt(area) {r['body_sqrt_area']:.1f} px ({r['body_area']:.0f} px^2), "
          f"{r['glow_pixels']} glow pixels set aside")
    print(f"scale:  {r['scale']:.4f}" + (f"  (capped from the body target by the {args.margin:g} px "
                                          f"margin; the body target wanted {r['wanted']:.4f})"
                                          if r["capped"] else "  (body target reached)"))
    print(f"centre: ({r['centre_from'][0]:.1f}, {r['centre_from'][1]:.1f}) in the source -> "
          f"the canvas centre; paste at {r['shift']}")
    print(f"saved:  {args.output}")


# ----------------------------------------------------------------------------------------------
# squash
# ----------------------------------------------------------------------------------------------

def smoothstep(t):
    t = np.clip(t, 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def row_scales(H, head, head_scale, body_scale, blend):
    """Per-source-row vertical scale: 1 above the head box, head_scale inside it, easing to
    body_scale over `blend` rows below it."""
    y0, y1 = head
    y = np.arange(H, dtype=np.float32)
    s = np.full(H, head_scale, np.float32)
    s[y < y0] = 1.0
    below = y >= y1
    t = smoothstep((y[below] - y1) / max(1.0, blend))
    s[below] = head_scale + (body_scale - head_scale) * t
    return s


def remap_rows(rgb, alpha, scales):
    """Resample an image vertically so source row y occupies scales[y] output rows (linear
    interpolation on premultiplied colour)."""
    H, W = alpha.shape
    pos = np.concatenate(([0.0], np.cumsum(scales))).astype(np.float64)
    new_h = int(round(pos[-1]))
    yc = np.arange(new_h) + 0.5
    src_row = np.clip(np.searchsorted(pos, yc, side="right") - 1, 0, H - 1)
    frac = (yc - pos[src_row]) / np.maximum(scales[src_row], 1e-6)   # 0..1 inside the row
    coord = np.clip(src_row + frac - 0.5, 0, H - 1)
    lo = np.floor(coord).astype(int)
    hi = np.minimum(lo + 1, H - 1)
    t = (coord - lo).astype(np.float32)[:, None, None]
    a = alpha / 255.0
    pre = np.dstack([rgb * a[..., None], a[..., None] * 255.0])
    out = pre[lo] * (1 - t) + pre[hi] * t
    na = out[..., 3]
    with np.errstate(divide="ignore", invalid="ignore"):
        nrgb = np.where(na[..., None] > 0.5, out[..., :3] / np.maximum(na / 255.0, 1e-6)[..., None], 0.0)
    return np.clip(nrgb, 0, 255), na


def auto_head_box(rgb, alpha):
    """The head-and-collar box measured from the top of the alpha: the hair blob's height
    plus a collar's worth below it."""
    width, blob = head_width(rgb, alpha)
    top = bbox(alpha > 0)[1]
    if blob is None:
        return top, top + int(round(0.35 * (bbox(alpha > 0)[3] - top)))
    return top, int(round(blob[3] + 0.25 * width))


def cmd_squash(args):
    rgb, alpha = load(args.input)
    H = alpha.shape[0]
    if args.head:
        y0, y1 = (int(v) for v in args.head.split(":"))
    else:
        y0, y1 = auto_head_box(rgb, alpha)
    fig = bbox(alpha > 0)
    scales = row_scales(H, (y0, y1), args.head_scale, args.body_scale, args.blend * unit(H))
    nrgb, nalpha = remap_rows(rgb, alpha, scales)
    pos = np.concatenate(([0.0], np.cumsum(scales)))
    if args.anchor == "top":
        oy = 0
    else:
        old_c = (fig[1] + fig[3]) / 2.0
        new_c = (pos[fig[1]] + pos[fig[3]]) / 2.0
        oy = int(round(old_c - new_c))
    crgb, calpha = place(nrgb, nalpha, H, (0, oy))
    save(args.output, crgb, calpha)
    nfig = bbox(calpha > 0)
    print(f"head:   rows {y0}:{y1} at {args.head_scale:g}, body below eased to {args.body_scale:g} "
          f"over {args.blend:g} rows" + ("" if args.head else "  (box measured from the alpha)"))
    print(f"figure: {fig[3] - fig[1]} rows -> {nfig[3] - nfig[1]} rows, anchored at the {args.anchor}")
    print(f"saved:  {args.output}")


# ----------------------------------------------------------------------------------------------
# despill
# ----------------------------------------------------------------------------------------------

def despill_edges(rgb, alpha, band_px, rebuild_px, speck_px, cap_green=False):
    transparent = alpha <= 0
    soft = (alpha > 0) & (alpha < 255)
    # 1. Edge despill: in the band, where green leads red, cap green to max(r, b).
    band = (dilate(transparent, band_px) | soft) & (alpha > 0)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    spill = band & (g > r)
    out = rgb.copy()
    out[..., 1] = np.where(spill, np.minimum(g, np.maximum(r, b)), g)
    n_spill = int(spill.sum())
    # 2. Edge rebuild: the rim takes its colour from the nearest fully opaque interior pixel.
    rim = (dilate(transparent, rebuild_px) | soft) & (alpha > 0)
    interior = (alpha >= 255) & ~rim
    if interior.any():
        out = fill_from_nearest(out, interior, rim)
    n_rim = int(rim.sum())
    if cap_green:
        out[..., 1] = np.minimum(out[..., 1], np.maximum(out[..., 0], out[..., 2]))
    # 3. Speck drop.
    nalpha, dropped = drop_specks(alpha, speck_px)
    out[nalpha <= 0] = 0
    return out, nalpha, {"spill": n_spill, "rim": n_rim, "specks": dropped}


def cmd_despill(args):
    rgb, alpha = load(args.input)
    u = unit(alpha.shape[0])
    out, nalpha, r = despill_edges(rgb, alpha, args.band * u, args.rebuild * u,
                                   args.speck * u * u, args.cap_green)
    save(args.output, out, nalpha)
    print(f"despill: {r['spill']} edge pixels had green leading red, capped")
    print(f"rebuild: {r['rim']} rim pixels recoloured from the interior (alpha untouched)")
    print(f"specks:  {r['specks']} alpha components under {args.speck:g} px dropped"
          + ("; g <= max(r, b) capped over the whole figure" if args.cap_green else ""))
    print(f"saved:   {args.output}")


# ----------------------------------------------------------------------------------------------
# hue
# ----------------------------------------------------------------------------------------------

def hue_rebuild(rgb, alpha, lo, hi, sat_min, target, box=None):
    """Pixels in the hue range and over the saturation floor become target * (v / 255),
    the target colour at the pixel's own brightness."""
    h, s, v = hsv(rgb)
    sel = (alpha > 0) & hue_in(h, lo, hi) & (s > sat_min)
    if box:
        sel &= box_mask(alpha.shape, box)
    out = rgb.copy()
    out[sel] = v[sel][:, None] * target[None, :]
    return out, int(sel.sum())


def cmd_hue(args):
    rgb, alpha = load(args.input)
    lo, hi = (float(v) for v in args.range.split(":"))
    out, n = hue_rebuild(rgb, alpha, lo, hi, args.sat, parse_color(args.target), args.box)
    save(args.output, out, alpha)
    print(f"hue:    {n} pixels in {lo:g}..{hi:g} degrees over saturation {args.sat:g} rebuilt as "
          f"#{args.target.lstrip('#').upper()} by brightness" + (f" inside {args.box}" if args.box else ""))
    print(f"saved:  {args.output}")


# ----------------------------------------------------------------------------------------------
# derim
# ----------------------------------------------------------------------------------------------

def derim(rgb, alpha, blur_px, cool_range=(165.0, 330.0), cool_sat=0.10, grey_val=0.55,
          protect=None):
    """Cool pixels take the colour of their warm neighbours and keep their own shading; a rim
    highlight is pulled halfway down to the local brightness."""
    h, s, v = hsv(rgb)
    inside = alpha > 0
    cool = inside & ((hue_in(h, *cool_range) & (s >= cool_sat)) | ((s < cool_sat) & (v >= grey_val)))
    if protect:
        cool &= ~box_mask(alpha.shape, protect)
    warm = inside & ~cool
    if not warm.any():
        return rgb.copy(), 0
    wmask = warm.astype(np.float32)
    num = gaussian_blur(rgb * wmask[..., None], blur_px)
    den = gaussian_blur(wmask, blur_px)
    local = np.where(den[..., None] > 1e-4, num / np.maximum(den, 1e-4)[..., None], 0.0)
    has_local = den > 1e-4
    local_v = local.max(axis=-1) / 255.0
    own_v = v
    target_v = np.where(own_v > local_v, (own_v + local_v) / 2.0, own_v)
    with np.errstate(divide="ignore", invalid="ignore"):
        recol = local * (target_v / np.maximum(local_v, 1e-6))[..., None]
    sel = cool & has_local
    out = rgb.copy()
    out[sel] = np.clip(recol[sel], 0, 255)
    return out, int(sel.sum())


def cmd_derim(args):
    rgb, alpha = load(args.input)
    lo, hi = (float(v) for v in args.cool.split(":"))
    out, n = derim(rgb, alpha, args.blur * unit(alpha.shape[0]), (lo, hi), args.cool_sat,
                   args.grey_val, args.protect)
    save(args.output, out, alpha)
    print(f"derim:  {n} cool pixels (hue {lo:g}..{hi:g}, or grey highlights) recoloured from a "
          f"{args.blur:g} px blur of their warm neighbours" + (f"; {args.protect} protected" if args.protect else ""))
    print(f"saved:  {args.output}")


# ----------------------------------------------------------------------------------------------
# headmatch
# ----------------------------------------------------------------------------------------------

def head_region(rgb, alpha):
    """Where the head is looked for: the upper half of the body blob (the top of the alpha can
    be a raised hand or a spell, so the body, not the figure, sets it)."""
    solid = alpha > 127
    body, _ = body_mask(rgb, alpha, 14 * unit(alpha.shape[0]), 0.55, 0.85)
    bx = bbox(body)
    if bx is None:
        return np.zeros_like(solid)
    region = np.zeros_like(solid)
    region[bx[1]:bx[1] + max(2, int(round(0.5 * (bx[3] - bx[1]))))] = True
    return region & body


def head_width(rgb, alpha, tol=25.0, crown_frac=0.08):
    """The hair blob's width: the region's crown (its top rows) gives a median colour, the
    blob is the connected run of region pixels near that colour that holds the crown, and the
    width is the blob's box. A best effort: on a top-down token the crown can be a raised arm,
    a hat, a horn or a hood (Tychon's combat token: the arm), so headmatch writes a debug image
    and takes --box-a/--box-b (the head box read off the image) or --widths when the measure is
    wrong. Returns (width, box) or (0, None)."""
    region = head_region(rgb, alpha)
    rb = bbox(region)
    if rb is None:
        return 0, None
    x0, y0, x1, y1 = rb
    crown_h = max(2, int(round((y1 - y0) * crown_frac)))
    crown = np.zeros_like(region)
    crown[y0:y0 + crown_h, x0:x1] = True
    crown &= region
    ref = np.median(rgb[crown], axis=0)
    near = region & (np.sqrt(((rgb - ref) ** 2).sum(axis=-1)) <= tol)
    labels, areas = label_components(near)
    hits = np.bincount(labels[crown], minlength=len(areas))
    hits[0] = 0
    if hits.max() == 0:
        return 0, None
    blob = labels == int(np.argmax(hits))
    bx = bbox(blob)
    return bx[2] - bx[0], bx


def cmd_headmatch(args):
    ra, aa = load(args.a)
    rb, ab = load(args.b)
    if args.widths:
        wa, wb = args.widths
        boxes = (None, None)
    else:
        wa, boxa = (args.box_a[2] - args.box_a[0], args.box_a) if args.box_a else head_width(ra, aa, args.tol)
        wb, boxb = (args.box_b[2] - args.box_b[0], args.box_b) if args.box_b else head_width(rb, ab, args.tol)
        boxes = (boxa, boxb)
        if not wa or not wb:
            sys.exit("refused: could not find a hair blob on one of the tokens; pass --box-a/--box-b or --widths")
    for name, w, path, box, given in (("A", wa, args.a, boxes[0], args.box_a), ("B", wb, args.b, boxes[1], args.box_b)):
        how = "given box" if given else ("measured blob" if box else "given width")
        print(f"head {name}: {w} px wide  {path}  ({how}" + (f" {box})" if box else ")"))
    if args.debug:
        os.makedirs(args.debug, exist_ok=True)
        for name, (r, a, box) in {"a": (ra, aa, boxes[0]), "b": (rb, ab, boxes[1])}.items():
            if box:
                d = r.copy()
                x0, y0, x1, y1 = box
                d[y0:y1, [x0, x1 - 1]] = (255, 0, 255)
                d[[y0, y1 - 1], x0:x1] = (255, 0, 255)
                save(os.path.join(args.debug, f"headmatch-{name}.png"), d, np.maximum(a, box_mask(a.shape, box) * 255))
    if args.measure:
        return
    if wa == wb:
        print("match:  the heads already match; nothing written")
        return
    larger, (r, a) = ("A", (ra, aa)) if wa > wb else ("B", (rb, ab))
    scale = min(wa, wb) / max(wa, wb)
    crgb, calpha = rescale_on_canvas(r, a, scale)
    check_output(args.a if larger == "A" else args.b, args.output)
    save(args.output, crgb, calpha)
    print(f"match:  token {larger} rescaled to {scale * 100:.1f}% on its canvas, centred")
    print(f"saved:  {args.output}")


# ----------------------------------------------------------------------------------------------
# CLI
# ----------------------------------------------------------------------------------------------

def build_parser():
    ap = argparse.ArgumentParser(description="Finish a cut token in pixels; every subcommand "
                                             "writes a new file, never in place.")
    sub = ap.add_subparsers(dest="cmd", required=True)

    p = sub.add_parser("fit", help="the body fit (or --shrink PCT for the small-race size)")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--body", type=float, default=245.0, help="sqrt of the body's area, px at 512 (245)")
    p.add_argument("--margin", type=float, default=10.0, help="the whole figure stays this far from the edge (10)")
    p.add_argument("--fade", type=float, default=10.0, help="alpha fades to zero over the last N px (10)")
    p.add_argument("--open", type=float, default=14.0, help="radius of the opening that strips thin parts (14)")
    p.add_argument("--glow-sat", type=float, default=0.55, help="a glow pixel's saturation floor (0.55)")
    p.add_argument("--glow-val", type=float, default=0.85, help="a glow pixel's brightness floor (0.85)")
    p.add_argument("--shrink", type=float, help="instead: scale the figure to PCT%% on the same canvas, centred")
    p.set_defaults(func=cmd_fit)

    p = sub.add_parser("squash", help="graded vertical squash for a steeper camera")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--head", help="the head-and-collar rows as Y0:Y1 (default: measured from the top of the alpha)")
    p.add_argument("--head-scale", type=float, default=0.97, help="the head box's vertical scale (0.97)")
    p.add_argument("--body-scale", type=float, default=0.90, help="the body's vertical scale (0.90; 0.85 is the firmer squeeze)")
    p.add_argument("--blend", type=float, default=24.0, help="rows over which the head eases into the body (24)")
    p.add_argument("--anchor", choices=["centre", "top"], default="centre",
                   help="keep the figure's vertical centre (default) or the top of its head")
    p.set_defaults(func=cmd_squash)

    p = sub.add_parser("despill", help="edge despill, edge rebuild, speck drop")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--band", type=float, default=3.0, help="despill reach from transparency, px (3)")
    p.add_argument("--rebuild", type=float, default=2.0, help="rebuild reach from transparency, px (2)")
    p.add_argument("--speck", type=float, default=40.0, help="alpha components under this many px are dropped (40)")
    p.add_argument("--cap-green", action="store_true", help="also cap g <= max(r, b) over the whole figure")
    p.set_defaults(func=cmd_despill)

    p = sub.add_parser("hue", help="rebuild a hue range as a target colour by brightness")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--range", default="38:170", help="hue range in degrees as LO:HI (38:170)")
    p.add_argument("--sat", type=float, default=0.18, help="saturation floor (0.18)")
    p.add_argument("--target", default="BF262A", help="target colour at full brightness (BF262A, blood red)")
    p.add_argument("--box", type=parse_box, help="limit to X0,Y0,X1,Y1")
    p.set_defaults(func=cmd_hue)

    p = sub.add_parser("derim", help="strip a cool rim light or tint")
    p.add_argument("input")
    p.add_argument("output")
    p.add_argument("--blur", type=float, default=6.0, help="sigma of the warm-neighbour blur, px (6)")
    p.add_argument("--cool", default="165:330", help="the cool hue range as LO:HI (165:330)")
    p.add_argument("--cool-sat", type=float, default=0.10, help="below this saturation a pixel is grey, not cool (0.10)")
    p.add_argument("--grey-val", type=float, default=0.55, help="a grey pixel this bright is a highlight (0.55)")
    p.add_argument("--protect", type=parse_box, help="leave X0,Y0,X1,Y1 alone")
    p.set_defaults(func=cmd_derim)

    p = sub.add_parser("headmatch", help="measure two heads and rescale the larger token")
    p.add_argument("a")
    p.add_argument("b")
    p.add_argument("output", nargs="?", help="the rescaled larger token (required unless --measure)")
    p.add_argument("--box-a", type=parse_box, help="A's head box X0,Y0,X1,Y1 read off the image; its width is the head")
    p.add_argument("--box-b", type=parse_box, help="B's head box, likewise")
    p.add_argument("--tol", type=float, default=25.0, help="colour distance that still counts as the hair (25)")
    p.add_argument("--widths", type=int, nargs=2, metavar=("WA", "WB"), help="skip the measurement")
    p.add_argument("--measure", action="store_true", help="report the widths and stop")
    p.add_argument("--debug", help="write headmatch-a/b.png with the measured blob boxed into this dir")
    p.set_defaults(func=cmd_headmatch)
    return ap


def main(argv=None):
    args = build_parser().parse_args(argv)
    if args.cmd == "headmatch":
        if not args.measure and not args.output:
            sys.exit("headmatch: an OUTPUT path is required unless --measure")
    else:
        check_output(args.input, args.output)
    args.func(args)


if __name__ == "__main__":
    main()
